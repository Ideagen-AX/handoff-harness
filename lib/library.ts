import { mkdir, writeFile, readFile, readdir, rm, copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { StoredRun, StoredRunMeta } from "./types";
import { USE_BLOB } from "./storage";

// Library of generated runs, grouped by design project, for later reference and
// cross-run comparison. Two backends, chosen automatically:
//  • Local (no Blob token): run.json + screenshots under public/library/ (served
//    by Next, gitignored) — the local-first default.
//  • Vercel Blob (BLOB_READ_WRITE_TOKEN present): run.json at library/<proj>/<id>/
//    run.json; screenshots already live in Blob from the capture step.
const LIBRARY_DIR = join(process.cwd(), "public", "library");

export function projectSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unsorted";
}
function fileSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "screen";
}

function toMeta(run: StoredRun): StoredRunMeta {
  return {
    id: run.id,
    version: run.version,
    createdAt: run.createdAt,
    project: run.project,
    title: run.title,
    prototypeUrl: run.prototypeUrl,
    baselineUrl: run.baselineUrl,
    subject: run.subject,
    artifactCount: run.artifacts?.length ?? 0,
    captureCount: (run.captures ?? []).filter((c) => c.ok).length,
  };
}

/**
 * Persist a run to the library. Best-effort — returns the stored id, or null on
 * failure (never throws into the pipeline). `captureRunId` is where the live
 * screenshots sit (public/captures/ locally; already in Blob when USE_BLOB).
 */
export async function saveRun(run: StoredRun, captureRunId: string): Promise<string | null> {
  try {
    if (USE_BLOB) {
      const { put } = await import("@vercel/blob");
      // Screenshots are already public Blob URLs from the capture step; just
      // store the run manifest that references them.
      await put(`library/${run.project.id}/${run.id}/run.json`, JSON.stringify(run, null, 2), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
      return run.id;
    }

    // Local: copy screenshots into the run folder and rewrite their served URLs.
    const runDir = join(LIBRARY_DIR, run.project.id, run.id);
    const shotsDir = join(runDir, "screenshots");
    await mkdir(shotsDir, { recursive: true });
    const captures = await Promise.all(
      run.captures.map(async (c) => {
        if (!c.ok || !c.url) return c;
        const src = join(process.cwd(), "public", "captures", captureRunId, `${c.screenKey}.png`);
        const name = `${fileSlug(c.screenKey)}.png`;
        try {
          await copyFile(src, join(shotsDir, name));
          return { ...c, url: `/library/${run.project.id}/${run.id}/screenshots/${name}` };
        } catch {
          return { ...c, ok: false, url: undefined, note: "screenshot not archived" };
        }
      }),
    );
    await writeFile(join(runDir, "run.json"), JSON.stringify({ ...run, captures }, null, 2));
    return run.id;
  } catch {
    return null;
  }
}

export async function listProjects(): Promise<{ project: { id: string; name: string }; runs: StoredRunMeta[] }[]> {
  const all: StoredRun[] = [];
  if (USE_BLOB) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: "library/" });
      const runJsons = blobs.filter((b) => b.pathname.endsWith("/run.json"));
      await Promise.all(
        runJsons.map(async (b) => {
          try {
            const res = await fetch(b.url);
            if (res.ok) all.push((await res.json()) as StoredRun);
          } catch {
            /* skip */
          }
        }),
      );
    } catch {
      return [];
    }
  } else {
    let projDirs: string[];
    try {
      projDirs = await readdir(LIBRARY_DIR);
    } catch {
      return [];
    }
    for (const proj of projDirs) {
      let ids: string[];
      try {
        ids = await readdir(join(LIBRARY_DIR, proj));
      } catch {
        continue;
      }
      for (const id of ids) {
        try {
          all.push(JSON.parse(await readFile(join(LIBRARY_DIR, proj, id, "run.json"), "utf8")) as StoredRun);
        } catch {
          /* skip malformed */
        }
      }
    }
  }

  // Group by project, newest run first; most-recently-active project first.
  const byProject = new Map<string, { project: { id: string; name: string }; runs: StoredRunMeta[] }>();
  for (const run of all) {
    const key = run.project.id;
    if (!byProject.has(key)) byProject.set(key, { project: run.project, runs: [] });
    byProject.get(key)!.runs.push(toMeta(run));
  }
  const groups = [...byProject.values()];
  for (const g of groups) g.runs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  groups.sort((a, b) => (a.runs[0]?.createdAt < b.runs[0]?.createdAt ? 1 : -1));
  return groups;
}

export async function getRun(projectId: string, runId: string): Promise<StoredRun | null> {
  const slug = projectSlug(projectId);
  if (USE_BLOB) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `library/${slug}/${runId}/` });
      const rj = blobs.find((b) => b.pathname.endsWith("/run.json"));
      if (!rj) return null;
      const res = await fetch(rj.url);
      return res.ok ? ((await res.json()) as StoredRun) : null;
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(await readFile(join(LIBRARY_DIR, slug, runId, "run.json"), "utf8")) as StoredRun;
  } catch {
    return null;
  }
}

export async function deleteRun(projectId: string, runId: string): Promise<boolean> {
  const slug = projectSlug(projectId);
  if (USE_BLOB) {
    try {
      const { list, del } = await import("@vercel/blob");
      const a = await list({ prefix: `library/${slug}/${runId}/` });
      const b = await list({ prefix: `captures/${runId}/` });
      const urls = [...a.blobs, ...b.blobs].map((x) => x.url);
      if (urls.length) await del(urls);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await rm(join(LIBRARY_DIR, slug, runId), { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
