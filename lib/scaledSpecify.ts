// Map-reduce SPECIFY — the spec-mode counterpart to scaledUnderstand, for
// documenting a whole multi-screen product/flow (spec scope = "product").
//
//   MAP    — document each screen INDEPENDENTLY and in parallel (bounded), from a
//            compact structural summary + real control labels. Each call is small,
//            cache-keyed by the screen's content hash, and cheap. Produces a full
//            ScreenDoc plus the per-screen capture states.
//   REDUCE — the per-screen ScreenDocs and captures are assembled in CODE (no lossy
//            re-summarisation); one small model call synthesises only the
//            design-WIDE narrative (overview, flows, tokens, a11y summary, use
//            cases, open questions). Assembled into one DesignSpec.
//
// The single-screen / component case uses specify() in pipeline.ts; this path
// activates only for product scope with multiple screens.

import { generateObject } from "ai";
import { z } from "zod";
import { MODEL_UNDERSTAND } from "./model";
import { DesignSpecSchema, ScreenDocSchema, type DesignSpec } from "./types";
import { structuralSummary, summaryToPrompt, structuralSignature } from "./extract";
import { capturePrototypeState, inspectClickables } from "./capture";
import type { BrowserPool } from "./browserPool";
import { mapWithConcurrency } from "./browserPool";
import { cached, cacheKey } from "./jobStore";
import { readDesignSpecGuidance, readReferenceDoc } from "./specs";
import type { Screen } from "./screenMap";

// Reuse the exact visualManifest entry shape the spec (and the capture stage)
// already speak, so per-screen capture states drop straight into the final spec.
const VisualEntry = DesignSpecSchema.shape.visualManifest.element;

// Per-screen MAP output: a full ScreenDoc plus the states worth capturing.
const ScreenSpecSchema = ScreenDocSchema.extend({
  captures: z
    .array(VisualEntry)
    .describe("The views on this screen worth screenshotting (visualManifest entries), each with distinct actions. Keep to the states that matter."),
});
type ScreenSpec = z.infer<typeof ScreenSpecSchema>;

// The design-WIDE fields the reduce synthesises; everything else is assembled in code.
const DesignWideSchema = DesignSpecSchema.pick({
  title: true,
  oneLiner: true,
  overview: true,
  flows: true,
  designTokens: true,
  accessibilitySummary: true,
  useCases: true,
  openQuestions: true,
});
type DesignWide = z.infer<typeof DesignWideSchema>;

// Bump when the per-screen prompt/shape changes, to invalidate cached entries.
const ANALYSIS_VERSION = "spec-v1";

async function specScreen(
  screen: Screen,
  ctx: { designerContext: string; designReference: string; pool?: BrowserPool },
): Promise<{ screen: Screen; spec: ScreenSpec | null; hit: boolean }> {
  const html = (await capturePrototypeState(screen.url, ctx.pool)).html;
  const sig = html ? structuralSignature(html) : screen.url;
  const key = cacheKey(ANALYSIS_VERSION, sig, screen.url, ctx.designReference, ctx.designerContext.slice(0, 400));

  const { value, hit } = await cached<ScreenSpec | null>("screen-spec", key, async () => {
    const { labels } = await inspectClickables(screen.url, ctx.pool);
    const summary = html ? summaryToPrompt(structuralSummary(html)) : "(could not fetch — JS-rendered or unreachable)";

    const prompt = [
      `Screen: ${screen.label} (${screen.url})`,
      "",
      "Structural summary of the screen:",
      summary,
      labels.length ? `\nReal clickable control labels on this screen: ${labels.join(" · ")}` : "",
      "",
      "Designer's context (primary truth — infer only what's missing):",
      ctx.designerContext || "(none provided)",
      "",
      "Document ONLY this screen, EXHAUSTIVELY and factually — there is no before/after, so never frame anything as a change. Fill: purpose; anatomy (regions top→bottom); components (name, role, variants, states, DS tokens consumed — not raw hex); interactions (trigger by EXACT visible label → behavior → outcome); states (name + description: default/empty/loading/error/edge); contentModel (field/format/source); responsive behaviour; accessibility (roles, keyboard, focus, aria — WCAG 2.2). Also fill `captures`: the states worth screenshotting, each with a stable screenKey, caption, state, scoping selector, annotations, and `actions` (click by exact label; setViewport for responsive) — distinct states must have distinct actions. Set key='" + screen.key + "' and url='" + screen.url + "'.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const { object } = await generateObject({
        model: MODEL_UNDERSTAND,
        maxOutputTokens: 6000,
        schema: ScreenSpecSchema,
        system: [
          "You are a senior product designer + technical writer documenting ONE screen of a larger product for a design-handoff SPECIFICATION. Be exhaustive, concrete, and factual; never invent behaviour you cannot verify — put uncertainty in openQuestions on the whole-design spec (here, omit what you can't determine rather than guessing).",
          `Map components and tokens onto this design source's library: ${ctx.designReference}.`,
        ].join("\n"),
        prompt,
      });
      const obj = object as ScreenSpec;
      obj.key = screen.key;
      obj.url = screen.url;
      return obj;
    } catch (e) {
      console.error(`[specScreen] ${screen.key} failed:`, String((e as Error)?.name || e));
      return null;
    }
  });

  return { screen, spec: value, hit };
}

// Namespace a per-screen capture's screenKey so it stays unique across the whole
// map and can be mapped back to the screen's URL for capture.
function nsKey(screenKey: string, stateKey: string): string {
  const clean = (stateKey || "state").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
  return clean.startsWith(screenKey) ? clean : `${screenKey}--${clean}`;
}

/**
 * Run the full map-reduce over a set of screens and return one DesignSpec plus a
 * screenKey→URL map (so the capture stage loads the right page per screen).
 */
export async function scaledSpecify(
  input: { designerContext: string; designReference: string; subject?: string },
  screens: Screen[],
  opts: { pool?: BrowserPool; concurrency?: number; onActivity?: (message: string, kind?: string) => void },
): Promise<{ spec: DesignSpec; screenUrls: Record<string, string> }> {
  const act = opts.onActivity ?? (() => {});

  // ── MAP ────────────────────────────────────────────────────────────────────
  act(`Documenting ${screens.length} screens in parallel…`, "stage");
  const results = await mapWithConcurrency(screens, opts.concurrency ?? 4, async (s) => {
    const r = await specScreen(s, { ...input, pool: opts.pool });
    act(`Documented “${s.label}”${r.hit ? " (cached)" : ""}`, "tool");
    return r;
  });

  const ok = results.filter((r) => r.spec) as { screen: Screen; spec: ScreenSpec }[];
  if (!ok.length) throw new Error("No screens could be documented");

  // Assemble screens + a namespaced, capture-ready visualManifest IN CODE, so the
  // detailed per-screen docs are preserved verbatim (no lossy re-summarisation).
  const screenUrls: Record<string, string> = {};
  const screenDocs: DesignSpec["screens"] = [];
  const visualManifest: DesignSpec["visualManifest"] = [];
  for (const { screen, spec } of ok) {
    const { captures, ...doc } = spec;
    screenDocs.push(doc);
    for (const st of captures ?? []) {
      const screenKey = nsKey(screen.key, st.screenKey);
      screenUrls[screenKey] = screen.url;
      visualManifest.push({ ...st, screenKey });
    }
  }

  // ── REDUCE (design-wide narrative only) ──────────────────────────────────────
  act(`Synthesising the whole-design spec from ${ok.length} screens…`, "stage");
  const guidance = await readDesignSpecGuidance();
  const screenDigest = JSON.stringify(
    screenDocs.map((d) => ({
      key: d.key,
      label: d.label,
      purpose: d.purpose,
      anatomy: d.anatomy,
      components: d.components.map((c) => c.name),
      interactions: d.interactions.map((i) => i.trigger),
      states: d.states.map((s) => s.name),
      accessibility: d.accessibility,
    })),
    null,
    2,
  );

  const RETRYABLE = new Set(["AI_NoObjectGeneratedError", "AI_NoOutputGeneratedError"]);
  let wide: DesignWide | null = null;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { object } = await generateObject({
        model: MODEL_UNDERSTAND,
        maxOutputTokens: 6000,
        schema: DesignWideSchema,
        system: [
          "You are a senior product designer writing the design-WIDE sections of a multi-screen product SPECIFICATION. You are given per-screen digests; synthesise the cross-screen picture — do NOT restate each screen. There is no before/after; never frame anything as a change.",
          input.subject ? `The product/area concerns: ${input.subject}.` : "",
          "Fill: title + oneLiner for the whole product; overview (purpose/audience/whereItLives); flows (the key cross-screen journeys, steps referencing screen labels); designTokens (categories and the tokens observed across screens — DS token names, not raw hex); accessibilitySummary (cross-cutting a11y obligations, WCAG 2.2); useCases (persona/scenario/example); openQuestions (anything undetermined across the design — never guess).",
          "",
          "Follow this design-spec specification:",
          guidance,
        ]
          .filter(Boolean)
          .join("\n"),
        prompt: [
          "Designer's context (primary truth — use directly, infer only what's missing):",
          input.designerContext || "(none provided — document conservatively and flag gaps)",
          "",
          `Per-screen digests (${ok.length} screens):`,
          screenDigest,
          "",
          "Produce the design-wide sections now.",
        ].join("\n"),
      });
      wide = object as DesignWide;
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      const err = e as { name?: string };
      console.error(`[scaledSpecify:reduce] attempt ${attempt} failed:`, err?.name);
      if (!RETRYABLE.has(err?.name ?? "")) throw e;
    }
  }
  if (lastErr || !wide) throw lastErr ?? new Error("Reduce produced no design-wide sections");

  const spec: DesignSpec = {
    ...wide,
    scope: "product",
    screens: screenDocs,
    visualManifest,
  };
  return { spec, screenUrls };
}
