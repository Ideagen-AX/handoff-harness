// Map-reduce Understand (#2) — the scaled replacement for one giant "understand
// everything" pass over a large, multi-screen prototype.
//
//   MAP    — analyse each screen INDEPENDENTLY and in parallel (bounded), from a
//            compact structural summary + real control labels, not raw HTML. Each
//            call is small, cache-keyed by the screen's content hash, and cheap.
//   REDUCE — merge the per-screen analyses into ONE canonical ChangeBrief (the
//            same schema every downstream artifact already consumes), synthesising
//            the cross-screen narrative (title, why, decision log, metrics).
//
// This keeps every model call small and parallelisable instead of a single
// enormous prompt, and — paired with the content-hash cache — makes re-runs after
// a one-screen edit reprocess only that screen. The single-screen case still uses
// the original tool-loop understand() in pipeline.ts; this path activates only
// when there are multiple screens.

import { generateObject } from "ai";
import { z } from "zod";
import { MODEL_UNDERSTAND } from "./model";
import { ChangeBriefSchema, type ChangeBrief } from "./types";
import { structuralSummary, summaryToPrompt, structuralSignature } from "./extract";
import { capturePrototypeState, inspectClickables } from "./capture";
import type { BrowserPool } from "./browserPool";
import { mapWithConcurrency } from "./browserPool";
import { cached, cacheKey } from "./jobStore";
import { readChangeBriefGuidance, readReferenceDoc } from "./specs";
import type { Screen } from "./screenMap";

// Reuse the exact visualManifest entry shape the brief (and the capture stage)
// already speak, so per-screen states drop straight into the final brief.
const VisualEntry = ChangeBriefSchema.shape.visualManifest.element;

const ScreenAnalysisSchema = z.object({
  summary: z.string().describe("What this screen is and does, in 1–3 sentences."),
  whatChanged: z
    .array(z.string())
    .describe("What changed on THIS screen vs. its baseline. If no baseline was provided, describe what's notable and treat as inferred."),
  components: z
    .array(
      z.object({
        name: z.string(),
        disposition: z.enum(["used-as-is", "extended", "net-new"]),
        detail: z.string(),
      }),
    )
    .describe("Design-system components this screen touches and how."),
  intendedOutcomes: z.array(z.string()).describe("What this screen is trying to achieve for the user (empty if unclear)."),
  risks: z.array(z.string()).describe("Where this screen could break or confuse users."),
  openQuestions: z.array(z.string()).describe("Anything that could NOT be determined for this screen — never guess."),
  states: z
    .array(VisualEntry)
    .describe("The views on this screen worth capturing (visualManifest entries), ordered by importance. Keep to the 1–3 that matter most."),
});
type ScreenAnalysis = z.infer<typeof ScreenAnalysisSchema>;

// Bump when the analysis prompt/shape changes, to invalidate cached entries.
const ANALYSIS_VERSION = "v1";

async function analyzeScreen(
  screen: Screen,
  ctx: { designerContext: string; designReference: string; pool?: BrowserPool },
): Promise<{ screen: Screen; analysis: ScreenAnalysis | null; hit: boolean }> {
  const afterHtml = (await capturePrototypeState(screen.url, ctx.pool)).html;
  const afterSig = afterHtml ? structuralSignature(afterHtml) : screen.url;
  const beforeHtml = screen.baselineUrl ? (await capturePrototypeState(screen.baselineUrl, ctx.pool)).html : null;
  const beforeSig = beforeHtml ? structuralSignature(beforeHtml) : "";

  // Cache key covers everything the analysis depends on: the screen's structure,
  // its baseline's structure, and the designer's framing. A change to any of these
  // misses the cache; an unchanged screen on re-run is a hit.
  const key = cacheKey(ANALYSIS_VERSION, afterSig, beforeSig, screen.url, ctx.designReference, ctx.designerContext.slice(0, 400));

  const { value, hit } = await cached<ScreenAnalysis | null>("screen-analysis", key, async () => {
    // Real control labels help the model author capture actions that hit real
    // controls. Best-effort — degrades to structure-only off-browser.
    const { labels } = await inspectClickables(screen.url, ctx.pool);
    const afterSummary = afterHtml ? summaryToPrompt(structuralSummary(afterHtml)) : "(could not fetch — JS-rendered or unreachable)";
    const beforeSummary = beforeHtml ? summaryToPrompt(structuralSummary(beforeHtml)) : null;

    const prompt = [
      `Screen: ${screen.label} (${screen.url})`,
      "",
      "AFTER (structural summary of the prototype screen):",
      afterSummary,
      labels.length ? `\nReal clickable control labels on this screen: ${labels.join(" · ")}` : "",
      beforeSummary ? `\nBEFORE (baseline structural summary — the prior state):\n${beforeSummary}` : "\n(No baseline for this screen — treat what-changed as inferred and flag it.)",
      "",
      "Designer's context (primary truth — infer only what's missing):",
      ctx.designerContext || "(none provided)",
      "",
      "Analyse ONLY this screen. For each state worth capturing, set a stable screenKey, a caption, the state, a component-scoping selector (or empty), annotation callouts, and the `actions` to drive the prototype into that state — click controls by their EXACT visible label from the list above, and use setViewport for responsive states. Keep to the states that matter.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const { object } = await generateObject({
        model: MODEL_UNDERSTAND,
        maxOutputTokens: 4000,
        schema: ScreenAnalysisSchema,
        system: [
          "You are a senior product designer analysing ONE screen of a larger prototype for a design-handoff. Be concrete and factual; never invent behaviour you cannot verify — put uncertainty in openQuestions.",
          `Judge component impact against this design source's library: ${ctx.designReference}.`,
        ].join("\n"),
        prompt,
      });
      return object as ScreenAnalysis;
    } catch (e) {
      console.error(`[analyzeScreen] ${screen.key} failed:`, String((e as Error)?.name || e));
      return null;
    }
  });

  return { screen, analysis: value, hit };
}

// Namespace a per-screen state's screenKey so it stays unique across the whole
// map and can be mapped back to the screen's URL for capture.
function nsKey(screenKey: string, stateKey: string): string {
  const clean = (stateKey || "state").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
  return clean.startsWith(screenKey) ? clean : `${screenKey}--${clean}`;
}

/**
 * Run the full map-reduce over a set of screens and return one ChangeBrief plus a
 * screenKey→URL map (so the capture stage loads the right page per screen).
 */
export async function scaledUnderstand(
  input: {
    designerContext: string;
    designReference: string;
    subject?: string;
  },
  screens: Screen[],
  opts: { pool?: BrowserPool; concurrency?: number; onActivity?: (message: string, kind?: string) => void },
): Promise<{ brief: ChangeBrief; screenUrls: Record<string, string> }> {
  const act = opts.onActivity ?? (() => {});

  // ── MAP ────────────────────────────────────────────────────────────────────
  act(`Analysing ${screens.length} screens in parallel…`, "stage");
  const analyses = await mapWithConcurrency(screens, opts.concurrency ?? 4, async (s) => {
    const r = await analyzeScreen(s, { ...input, pool: opts.pool });
    act(`Analysed “${s.label}”${r.hit ? " (cached)" : ""}`, "tool");
    return r;
  });

  const ok = analyses.filter((a) => a.analysis) as { screen: Screen; analysis: ScreenAnalysis }[];
  if (!ok.length) throw new Error("No screens could be analysed");

  // Build the screenKey→URL map and namespace every state key so they're unique.
  const screenUrls: Record<string, string> = {};
  const perScreen = ok.map(({ screen, analysis }) => {
    const states = (analysis.states ?? []).map((st) => {
      const screenKey = nsKey(screen.key, st.screenKey);
      screenUrls[screenKey] = screen.url;
      return { ...st, screenKey };
    });
    return { screen, analysis, states };
  });

  // ── REDUCE ───────────────────────────────────────────────────────────────
  act(`Merging ${ok.length} screen analyses into one change brief…`, "stage");
  const guidance = await readChangeBriefGuidance();

  const analysesJson = JSON.stringify(
    perScreen.map(({ screen, analysis, states }) => ({
      screen: { key: screen.key, label: screen.label, url: screen.url, hasBaseline: !!screen.baselineUrl },
      summary: analysis.summary,
      whatChanged: analysis.whatChanged,
      components: analysis.components,
      intendedOutcomes: analysis.intendedOutcomes,
      risks: analysis.risks,
      openQuestions: analysis.openQuestions,
      states,
    })),
    null,
    2,
  );

  const anyBaseline = screens.some((s) => s.baselineUrl);
  const RETRYABLE = new Set(["AI_NoObjectGeneratedError", "AI_NoOutputGeneratedError"]);
  let brief: ChangeBrief | null = null;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { object } = await generateObject({
        model: MODEL_UNDERSTAND,
        maxOutputTokens: 16000,
        schema: ChangeBriefSchema,
        system: [
          "You are a senior product designer writing ONE canonical design-handoff change brief that spans a MULTI-SCREEN change. You are given per-screen analyses; synthesise them into a single coherent brief — do NOT just concatenate them.",
          input.subject ? `The change concerns: ${input.subject}.` : "",
          anyBaseline
            ? "A baseline was available for at least some screens; set changeBasis.method = 'url-diff' and note which screens were verified vs. inferred."
            : "No baseline was available; set changeBasis.method = 'inferred' and state in changeBasis.note AND openQuestions that whatChanged is unverified.",
          "Merge componentImpact across screens (dedupe by component name, keeping the strongest disposition). Build visualManifest as the union of the screens' states — KEEP each state's screenKey VERBATIM (they are globally unique and map to specific screens) — ordered by narrative importance across the whole change. Synthesise title, oneLiner, why, decisionLog, intendedOutcomes, successMetrics, useCases, beforeAfter, affectedAreas, userVisible, and risksEdgeCases at the level of the WHOLE change.",
          "Express styling as design-system tokens, not raw hex. Never invent behaviour — put genuine uncertainty in openQuestions.",
          "",
          "Follow this brief specification:",
          guidance,
        ]
          .filter(Boolean)
          .join("\n"),
        prompt: [
          "Designer's context (primary truth — use directly, infer only what's missing):",
          input.designerContext || "(none provided — infer conservatively and flag it)",
          "",
          `Per-screen analyses (${ok.length} screens):`,
          analysesJson,
          "",
          "Produce the single canonical change brief now.",
        ].join("\n"),
      });
      brief = object as ChangeBrief;
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      const err = e as { name?: string };
      console.error(`[scaledUnderstand:reduce] attempt ${attempt} failed:`, err?.name);
      if (!RETRYABLE.has(err?.name ?? "")) throw e;
    }
  }
  if (lastErr || !brief) throw lastErr ?? new Error("Reduce produced no brief");

  // Guardrail: keep the visualManifest aligned to states we can actually capture —
  // drop any entry whose screenKey the reduce invented (not in screenUrls). This
  // keeps capture URLs and brief entries in lockstep.
  brief.visualManifest = (brief.visualManifest ?? []).filter((v) => screenUrls[v.screenKey]);

  return { brief, screenUrls };
}
