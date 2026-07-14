import { mkdir, writeFile, readFile, readdir, rm, copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { StoredRun, StoredRunMeta } from "./types";

// Local, on-disk library of generated runs. Lives under public/library/ so the
// captured screenshots are servable by Next, and each run is a self-contained
// folder: run.json + screenshots/. Grouped by design project so runs can be
// browsed and compared over time. Local-first (like capture); gitignored.
const LIBRARY_DIR = join(process.cwd(), "public", "library");

export function projectSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unsorted";
}
function fileSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "screen";
}

/**
 * Persist a run to the library: copy its captured screenshots into the run's
 * folder (rewriting their URLs to the served /library path) and write run.json.
 * Best-effort — returns the stored id, or null on failure (never throws into the
 * pipeline). `captureRunId` is where the live screenshots currently sit under
 * public/captures/.
 */
export async function saveRun(run: StoredRun, captureRunId: string): Promise<string | null> {
  try {
    const projSlug = run.project.id;
    const runDir = join(LIBRARY_DIR, projSlug, run.id);
    const shotsDir = join(runDir, "screenshots");
    await mkdir(shotsDir, { recursive: true });

    // Copy screenshots and rewrite their served URLs to the library location.
    const captures = await Promise.all(
      run.captures.map(async (c) => {
        if (!c.ok || !c.url) return c;
        const src = join(process.cwd(), "public", "captures", captureRunId, `${c.screenKey}.png`);
        const name = `${fileSlug(c.screenKey)}.png`;
        try {
          await copyFile(src, join(shotsDir, name));
          return { ...c, url: `/library/${projSlug}/${run.id}/screenshots/${name}` };
        } catch {
          return { ...c, ok: false, url: undefined, note: "screenshot not archived" };
        }
      }),
    );

    const stored: StoredRun = { ...run, captures };
    await writeFile(join(runDir, "run.json"), JSON.stringify(stored, null, 2));
    return run.id;
  } catch {
    return null;
  }
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

// List all stored runs, grouped by project, newest first within each group.
export async function listProjects(): Promise<
  { project: { id: string; name: string }; runs: StoredRunMeta[] }[]
> {
  let projDirs: string[];
  try {
    projDirs = await readdir(LIBRARY_DIR);
  } catch {
    return [];
  }
  const groups: { project: { id: string; name: string }; runs: StoredRunMeta[] }[] = [];
  for (const proj of projDirs) {
    let runIds: string[];
    try {
      runIds = await readdir(join(LIBRARY_DIR, proj));
    } catch {
      continue;
    }
    const runs: StoredRunMeta[] = [];
    let projectName = proj;
    for (const id of runIds) {
      try {
        const run = JSON.parse(await readFile(join(LIBRARY_DIR, proj, id, "run.json"), "utf8")) as StoredRun;
        runs.push(toMeta(run));
        projectName = run.project?.name || projectName;
      } catch {
        /* skip malformed */
      }
    }
    if (!runs.length) continue;
    runs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    groups.push({ project: { id: proj, name: projectName }, runs });
  }
  // Projects with the most recent activity first.
  groups.sort((a, b) => (a.runs[0]?.createdAt < b.runs[0]?.createdAt ? 1 : -1));
  return groups;
}

export async function getRun(projectId: string, runId: string): Promise<StoredRun | null> {
  try {
    const raw = await readFile(join(LIBRARY_DIR, projectSlug(projectId), runId, "run.json"), "utf8");
    return JSON.parse(raw) as StoredRun;
  } catch {
    return null;
  }
}

export async function deleteRun(projectId: string, runId: string): Promise<boolean> {
  try {
    await rm(join(LIBRARY_DIR, projectSlug(projectId), runId), { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
