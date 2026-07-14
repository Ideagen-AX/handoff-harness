import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChangeBrief, Capture, SlideSpec } from "./types";
import { buildDeck } from "./deck";

type BundleArtifact = { audienceId: string; label: string; content: string; slideSpec?: SlideSpec };
type BundleMeta = {
  prototypeUrl?: string;
  baselineUrl?: string;
  note?: string;
  framework?: string;
  generatedAt?: string;
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artifact";
}

function briefToMarkdown(brief: ChangeBrief): string {
  const list = (arr: string[]) => (arr?.length ? arr.map((x) => `- ${x}`).join("\n") : "_none_");
  const lines: string[] = [
    `# Change brief — ${brief.title}`,
    "",
    `**One-liner:** ${brief.oneLiner}`,
    "",
    `**Change basis:** \`${brief.changeBasis.method}\` — ${brief.changeBasis.note}`,
    "",
    "## What changed",
    list(brief.whatChanged),
    "",
    "## Why",
    brief.why,
    "",
    "## Before → after",
    brief.beforeAfter?.length
      ? brief.beforeAfter.map((b) => `- **Before:** ${b.before}\n  **After:** ${b.after}`).join("\n")
      : "_none_",
    "",
    "## Component impact",
    brief.componentImpact?.length
      ? brief.componentImpact.map((c) => `- **${c.name}** · _${c.disposition}_ — ${c.detail}`).join("\n")
      : "_none_",
    "",
    "## Decisions & tradeoffs",
    brief.decisionLog?.length
      ? brief.decisionLog
          .map(
            (d) =>
              `- **${d.decision}** — ${d.rationale}` +
              (d.alternativesConsidered?.length ? `\n  - Alternatives: ${d.alternativesConsidered.join("; ")}` : "") +
              (d.tradeoff ? `\n  - Tradeoff: ${d.tradeoff}` : ""),
          )
          .join("\n")
      : "_none_",
    "",
    "## Use cases",
    brief.useCases?.length
      ? brief.useCases.map((u) => `- **${u.persona}** — ${u.scenario}\n  - e.g. ${u.example}`).join("\n")
      : "_none_",
    "",
    "## Intended outcomes",
    list(brief.intendedOutcomes),
    "",
    "## Success metrics",
    brief.successMetrics?.length
      ? brief.successMetrics.map((m) => `- ${m.metric} — signal: ${m.signal}; ${m.direction} → ${m.target}`).join("\n")
      : "_none_",
    "",
    "## User-visible",
    brief.userVisible,
    "",
    "## Risks / edge cases",
    list(brief.risksEdgeCases),
    "",
    "## Open questions",
    list(brief.openQuestions),
  ];
  return lines.join("\n") + "\n";
}

/**
 * Package a whole run into a .zip for archival/comparison: a README, the change
 * brief, every artifact as Markdown, the captured screenshots, and the generated
 * slide deck (.pptx). Best-effort per item — a single failure (e.g. the deck)
 * never sinks the archive.
 */
export async function buildBundle(input: {
  title?: string;
  meta?: BundleMeta;
  brief?: ChangeBrief | null;
  artifacts: BundleArtifact[];
  captures?: Capture[];
}): Promise<Buffer> {
  const zip = new JSZip();
  const meta = input.meta ?? {};
  const captures = input.captures ?? [];

  const readme = [
    `# Design handoff — ${input.title ?? "run"}`,
    "",
    meta.generatedAt ? `Generated: ${meta.generatedAt}` : "",
    meta.prototypeUrl ? `After (prototype): ${meta.prototypeUrl}` : "",
    meta.baselineUrl ? `Before (baseline): ${meta.baselineUrl}` : "",
    meta.framework ? `Code target: ${meta.framework}` : "",
    meta.note ? `\nNote: ${meta.note}` : "",
    "",
    "## Contents",
    input.brief ? "- `change-brief.md`" : "",
    input.artifacts.length ? "- `artifacts/` — one Markdown file per output" : "",
    captures.some((c) => c.ok) ? "- `screenshots/` — captured prototype states" : "",
    input.artifacts.some((a) => a.audienceId === "slide" && a.slideSpec) ? "- `slide.pptx` — the branded deck" : "",
  ]
    .filter(Boolean)
    .join("\n");
  zip.file("README.md", readme + "\n");

  if (input.brief) {
    zip.file("change-brief.md", briefToMarkdown(input.brief));
    zip.file("change-brief.json", JSON.stringify(input.brief, null, 2));
  }

  const arts = zip.folder("artifacts")!;
  const seen = new Map<string, number>();
  for (const a of input.artifacts) {
    let name = slug(a.audienceId);
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    if (n > 1) name = `${name}-${n}`;
    arts.file(`${name}.md`, `<!-- ${a.label} -->\n\n${a.content}\n`);
  }

  // Screenshots that were actually captured to disk.
  const shots = captures.filter((c) => c.ok && c.url);
  if (shots.length) {
    const dir = zip.folder("screenshots")!;
    for (const c of shots) {
      try {
        const buf = await readFile(join(process.cwd(), "public", c.url!.replace(/^\//, "")));
        dir.file(`${slug(c.screenKey)}.png`, buf);
      } catch {
        /* skip missing */
      }
    }
  }

  // The branded deck, if a slide was generated.
  const slide = input.artifacts.find((a) => a.audienceId === "slide" && a.slideSpec);
  if (slide?.slideSpec) {
    try {
      zip.file("slide.pptx", await buildDeck(slide.slideSpec, captures));
    } catch {
      /* deck templates may be unavailable (e.g. on Vercel) — skip */
    }
  }

  return zip.generateAsync({ type: "nodebuffer" }) as Promise<Buffer>;
}
