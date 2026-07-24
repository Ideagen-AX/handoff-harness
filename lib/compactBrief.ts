// Right-size the brief for the fan-out (#5).
//
// Every generator inlines the change brief as its source of truth, and the
// fan-out prompt-caches that block so all generators share one copy. On a large
// MULTI-SCREEN brief that block balloons — chiefly because each visualManifest
// entry carries `actions` (the ordered click/viewport steps to drive the
// prototype into that state) and a `selector`. Those two fields exist ONLY for the
// capture stage; no text/code/slide generator ever reads them. Stripping them from
// the copy handed to the generators shrinks the shared, cached brief substantially
// on big runs while staying byte-identical across all generators (so the prompt
// cache still hits). The FULL brief is kept for capture and the library save.
//
// We deliberately do NOT drop whole entries or narrative fields — that would lose
// real content silently. When an array is genuinely huge we cap it and log what
// was dropped, so a reviewer can see coverage was bounded (never a silent trim).

import type { ChangeBrief } from "./types";

// Above this, an array is capped for the generator copy and the drop is logged.
// Set high enough that normal single-component briefs are untouched.
const ARRAY_CAP = 24;

function cap<T>(arr: T[] | undefined, label: string): T[] {
  const a = arr ?? [];
  if (a.length <= ARRAY_CAP) return a;
  console.error(`[compactBrief] capping ${label}: ${a.length} → ${ARRAY_CAP} for the generator prompt (full set kept in the run).`);
  return a.slice(0, ARRAY_CAP);
}

// Produce a lighter brief for the generators: strip capture-only fields from the
// visualManifest and cap any oversized arrays. Returns a new object; the input is
// not mutated.
export function compactBriefForGenerators(brief: ChangeBrief): ChangeBrief {
  return {
    ...brief,
    decisionLog: cap(brief.decisionLog, "decisionLog"),
    useCases: cap(brief.useCases, "useCases"),
    componentImpact: cap(brief.componentImpact, "componentImpact"),
    beforeAfter: cap(brief.beforeAfter, "beforeAfter"),
    visualManifest: cap(brief.visualManifest, "visualManifest").map((v) => ({
      screenKey: v.screenKey,
      caption: v.caption,
      state: v.state,
      annotations: v.annotations,
      // capture-only fields removed for generators:
      selector: "",
      actions: [],
    })),
  };
}
