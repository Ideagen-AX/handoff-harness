import { ToolLoopAgent, Output, generateText, generateObject, stepCountIs, type ToolSet } from "ai";
import { MODEL_UNDERSTAND, MODEL_GENERATE } from "./model";
import { ChangeBriefSchema, SlideSpecSchema, InstrumentationPlanSchema, type ChangeBrief, type PipelineEvent, type Artifact, type Capture, type SlideSpec, type InstrumentationPlan, type StoredRun } from "./types";
import { stat } from "node:fs/promises";
import { fetchPrototype, readReference, makeCodebaseTool, makeInspectTool, makeExploreTool } from "./tools";
import { captureScreens, capturePrototypeState } from "./capture";
import { BrowserPool } from "./browserPool";
import { discoverScreens, scopeToChanged, type ScreenMap } from "./screenMap";
import { scaledUnderstand } from "./scaledUnderstand";
import { compactBriefForGenerators } from "./compactBrief";
import { newCheckpoint, saveJob, type JobCheckpoint } from "./jobStore";
import { APP_VERSION } from "./version";
import { saveRun, projectSlug } from "./library";

type DiffPart = { type: "text"; text: string } | { type: "image"; image: string };

// A tiny push-based async queue: understand() pushes activity events from inside
// its (otherwise opaque) tool-loop await, and runPipeline drains them live and
// yields them to the client. Closed when understand settles.
class ActivityQueue {
  private items: PipelineEvent[] = [];
  private waiters: ((r: IteratorResult<PipelineEvent>) => void)[] = [];
  private closed = false;
  push(e: PipelineEvent) {
    if (this.closed) return;
    const w = this.waiters.shift();
    if (w) w({ value: e, done: false });
    else this.items.push(e);
  }
  close() {
    this.closed = true;
    let w;
    while ((w = this.waiters.shift())) w({ value: undefined as unknown as PipelineEvent, done: true });
  }
  async *drain(): AsyncGenerator<PipelineEvent> {
    while (true) {
      if (this.items.length) { yield this.items.shift()!; continue; }
      if (this.closed) return;
      const r = await new Promise<IteratorResult<PipelineEvent>>((res) => this.waiters.push(res));
      if (r.done) return;
      yield r.value;
    }
  }
}

// Map an Understand tool call to a human-readable activity line for the feed.
function toolActivity(toolName: string, input: unknown): string {
  const arg = (input as Record<string, unknown>) ?? {};
  switch (toolName) {
    case "fetchPrototype": return "Fetched the prototype page";
    case "inspectPrototype": return "Inspected the prototype's live controls";
    case "explorePrototype": {
      const acts = Array.isArray(arg.actions) ? (arg.actions as Array<Record<string, unknown>>) : [];
      const click = acts.find((a) => a.do === "click" && typeof a.target === "string");
      return click ? `Opened “${click.target}” to inspect hidden UI` : "Explored a hidden UI state";
    }
    case "readReference": {
      const name = typeof arg.name === "string" ? arg.name : "";
      return name ? `Read the ${name} reference` : "Read a reference doc";
    }
    case "readCodebase": return "Explored the target codebase";
    default: return `Used ${toolName}`;
  }
}

// Before/after prototype diff: for each state, capture a screenshot AND its
// rendered HTML/CSS markup, then have the model compare them both visually and at
// the code level. This is what makes a URL baseline useful for styling/layout
// changes — a text fetch misses them. Returns null when neither state could be
// captured (falls back to the plain text diff).
async function diffPrototypes(beforeUrl: string, afterUrl: string, note: string, subject?: string, pool?: BrowserPool): Promise<string | null> {
  const [before, after] = await Promise.all([capturePrototypeState(beforeUrl, pool), capturePrototypeState(afterUrl, pool)]);
  if (!before.image && !before.html && !after.image && !after.html) return null;

  const cap = (h: string | null) => (h ? h.replace(/\s+/g, " ").trim().slice(0, 30000) : "(unavailable)");
  const bothImages = !!(before.image && after.image);
  const content: DiffPart[] = [
    {
      type: "text",
      text: [
        subject
          ? `You are comparing two versions of a single UI COMPONENT — the ${subject} — in a BEFORE state and an AFTER state.`
          : "You are comparing two versions of the same UI — a BEFORE state and an AFTER state.",
        bothImages
          ? "For each you have a screenshot AND its rendered HTML/CSS markup."
          : "For each you have its rendered HTML/CSS markup.",
        "IMPORTANT — these are ISOLATED COMPONENT DEMOS: the component is framed inside a demo page (a centered 'stage' card, a page background, possibly an <iframe> or other wrapper). That framing is SCAFFOLDING, not part of the component. Do NOT report changes to the page background, the stage/frame card, wrappers, iframes, or overall page format/structure — report ONLY changes to the component itself and its own behaviour. If the toolbar sits on a white rounded card, that card is the demo stage, not the toolbar.",
        "Produce a precise, factual diff of what changed from BEFORE to AFTER — both visually (layout, spacing, styling, grouping, states, responsive behaviour) AND at the code level (markup structure, added/removed elements, class changes, inline styles, CSS rules in <style>). Ground every claim in the screenshots and markup; do not speculate.",
        "Express colours, spacing, radii and type as design-system TOKENS — the CSS custom properties you see in the markup (e.g. --px-* / --ehsq-*) or DS token names — not raw hex values. Only give a hex value when no token applies, and say so.",
        note ? `Designer's note for context: ${note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
  if (before.image) content.push({ type: "text", text: "— BEFORE screenshot —" }, { type: "image", image: before.image });
  content.push({ type: "text", text: `— BEFORE markup —\n${cap(before.html)}` });
  if (after.image) content.push({ type: "text", text: "— AFTER screenshot —" }, { type: "image", image: after.image });
  content.push({ type: "text", text: `— AFTER markup —\n${cap(after.html)}` });

  const { text } = await generateText({
    model: MODEL_UNDERSTAND,
    maxOutputTokens: 2200,
    messages: [{ role: "user", content }],
  });
  return text.trim();
}

// Image baseline diff: the designer uploads a SCREENSHOT of the current app as
// the "before" (e.g. a grab of production to compare their prototype against).
// The before is visual-only — no markup — so we capture the after prototype
// (screenshot + rendered HTML/CSS) and compare the two visually, telling the
// model to keep code-level claims about the prior state tentative.
//
// This is a best-effort ENHANCEMENT: the uploaded screenshot is also handed
// straight to the Understand agent (which fetches/inspects the prototype
// itself), so if this pre-diff can't run — the AFTER capture times out, the
// model errors — we return null and the agent still does the image comparison.
// It must therefore never throw: a failure here degrades, it doesn't abort.
async function diffPrototypeAgainstImage(beforeImage: string, afterUrl: string, note: string, subject?: string, pool?: BrowserPool): Promise<string | null> {
  if (!beforeImage) return null;
  let after: { image: string | null; html: string | null };
  try {
    after = await capturePrototypeState(afterUrl, pool);
  } catch (e) {
    console.error("[image-baseline] AFTER capture failed:", (e as Error).message);
    return null;
  }
  if (!after.image && !after.html) {
    console.error("[image-baseline] AFTER capture returned nothing — the agent will diff the before image directly");
    return null;
  }

  const cap = (h: string | null) => (h ? h.replace(/\s+/g, " ").trim().slice(0, 30000) : "(unavailable)");
  const content: DiffPart[] = [
    {
      type: "text",
      text: [
        subject
          ? `You are comparing two versions of a single UI COMPONENT — the ${subject} — in a BEFORE state and an AFTER state.`
          : "You are comparing two versions of the same UI — a BEFORE state and an AFTER state.",
        "The BEFORE is an uploaded SCREENSHOT of the current app (visual only — you do NOT have its markup). The AFTER is the new prototype, for which you have a screenshot AND its rendered HTML/CSS markup.",
        "IMPORTANT — these may be ISOLATED COMPONENT DEMOS: the component can be framed inside a demo page (a centered 'stage' card, a page background, possibly an <iframe> or other wrapper). That framing is SCAFFOLDING, not part of the component. Do NOT report changes to the page background, the stage/frame card, wrappers, iframes, or overall page format/structure — report ONLY changes to the component itself and its own behaviour.",
        "Produce a precise, factual VISUAL diff of what changed from BEFORE to AFTER — layout, spacing, styling, grouping, states, responsive behaviour. Ground every claim in the screenshots (and the AFTER markup); do not speculate. Because you have no BEFORE markup, do NOT assert what the prior implementation's code/structure was — keep any such inference tentative and say it is unverified.",
        "Express colours, spacing, radii and type as design-system TOKENS — the CSS custom properties you see in the AFTER markup (e.g. --px-* / --ehsq-*) or DS token names — not raw hex values. Only give a hex value when no token applies, and say so.",
        note ? `Designer's note for context: ${note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    { type: "text", text: "— BEFORE screenshot (uploaded; visual only) —" },
    { type: "image", image: beforeImage },
  ];
  if (after.image) content.push({ type: "text", text: "— AFTER screenshot —" }, { type: "image", image: after.image });
  content.push({ type: "text", text: `— AFTER markup —\n${cap(after.html)}` });

  try {
    const { text } = await generateText({
      model: MODEL_UNDERSTAND,
      maxOutputTokens: 2200,
      messages: [{ role: "user", content }],
    });
    return text.trim() || null;
  } catch (e) {
    console.error("[image-baseline] pre-diff generateText failed:", (e as Error).message);
    return null;
  }
}
import { readAudienceSpec, readChangeBriefGuidance, readComponentSpecTemplate, readReferenceDoc, readExamples, readCodeSpec, readCodeSpecFile } from "./specs";
import { AUDIENCES } from "./audiences";
import { getDesignSource, type DesignSource } from "./designSources";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The designer's rich, structured context — primary truth the agent should use
// instead of re-inferring intent. Falls back to the short note. Shared by the
// single-screen tool-loop understand() and the multi-screen scaled path so both
// frame the change identically.
function buildDesignerContext(input: {
  note?: string;
  designDescription?: string;
  projectContext?: string;
  focusAreas?: string;
  designDecisions?: string;
}): string {
  return (
    [
      input.designDescription?.trim() ? `WHAT THE NEW DESIGN IS:\n${input.designDescription.trim()}` : "",
      input.projectContext?.trim() ? `SURROUNDING CONTEXT:\n${input.projectContext.trim()}` : "",
      input.focusAreas?.trim() ? `FOCUS AREAS (weight these):\n${input.focusAreas.trim()}` : "",
      input.designDecisions?.trim()
        ? `KEY DESIGN DECISIONS & RATIONALE (use directly — do not re-infer):\n${input.designDecisions.trim()}`
        : "",
      input.note?.trim() ? `NOTE:\n${input.note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n") || input.note?.trim() || ""
  );
}

// ── Stage 1: UNDERSTAND ──────────────────────────────────────────────────────
// A real tool-loop agent: it fetches the prototype, optionally reads the
// design-system reference, then emits the structured Change Brief.
async function understand(input: {
  prototypeUrl: string;
  note: string;
  baselineUrl?: string;
  baselineImage?: string;
  codebasePath?: string;
  codebaseScope?: string;
  subject?: string;
  componentSelector?: string;
  designDescription?: string;
  projectContext?: string;
  focusAreas?: string;
  designDecisions?: string;
  designReference?: string;
  pool?: BrowserPool;
  onActivity?: (message: string, kind?: string) => void;
}): Promise<ChangeBrief> {
  const subject = input.subject?.trim();
  const designRef = input.designReference || "design-system";
  const act = input.onActivity ?? (() => {});
  const guidance = await readChangeBriefGuidance();

  const designerContext = buildDesignerContext(input);

  // Establish the "before" state: codebase (preferred) → baseline URL → inference.
  // Scope the codebase to the relevant subpath so we never crawl the whole app —
  // e.g. codebasePath=/…/Miramar + codebaseScope=src/components/Search.
  const codeRoot = input.codebasePath
    ? input.codebaseScope
      ? join(input.codebasePath, input.codebaseScope)
      : input.codebasePath
    : undefined;
  let useCodebase = false;
  if (codeRoot) {
    try {
      useCodebase = (await stat(codeRoot)).isDirectory();
    } catch {
      useCodebase = false; // path not reachable here (e.g. on Vercel) — fall back
    }
  }

  const tools: ToolSet = {
    fetchPrototype,
    readReference,
    inspectPrototype: makeInspectTool(input.pool),
    explorePrototype: makeExploreTool(3, input.pool),
  };
  if (useCodebase) tools.readCodebase = makeCodebaseTool(codeRoot!);

  // For a URL baseline, diff the two prototypes up front — visually AND at the
  // code level (screenshot + rendered HTML/CSS). Styling changes don't show up in
  // fetched text. An uploaded baseline SCREENSHOT is diffed the same way but
  // visually only (no before markup). URL takes priority over image when both are
  // given. Falls back to the plain text/inference path if capture is unavailable.
  const useImageBaseline = !useCodebase && !input.baselineUrl && !!input.baselineImage;
  if (useImageBaseline) console.error(`[image-baseline] using uploaded screenshot (~${Math.round((input.baselineImage!.length * 3) / 4 / 1024)} KB)`);
  if (!useCodebase && input.baselineUrl) act("Diffing the before/after prototypes (visual + code)…", "tool");
  else if (useImageBaseline) act("Diffing the uploaded baseline screenshot against the prototype…", "tool");
  const diffSummary = !useCodebase
    ? input.baselineUrl
      ? await diffPrototypes(input.baselineUrl, input.prototypeUrl, designerContext, subject, input.pool)
      : useImageBaseline
        ? await diffPrototypeAgainstImage(input.baselineImage!, input.prototypeUrl, designerContext, subject, input.pool)
        : null
    : null;
  if (diffSummary) act(useImageBaseline ? "Baseline screenshot diff complete" : "Before/after diff complete", "tool");

  let basisInstruction: string;
  if (useCodebase) {
    basisInstruction =
      "BASELINE: the current source code is available via readCodebase (the 'before'). Explore it — list directories, then read the files that implement the affected area — then diff it against the prototype to determine what ACTUALLY changed. Set changeBasis.method = 'codebase-diff'.";
  } else if (input.baselineUrl) {
    basisInstruction = diffSummary
      ? "BASELINE: a before/after diff of the two prototypes — comparing both the screenshots and the rendered HTML/CSS (BEFORE = baseline URL, AFTER = prototype) — is provided below. Treat it as the authoritative record of what changed, especially styling and layout, and base whatChanged/beforeAfter on it. Set changeBasis.method = 'url-diff'."
      : `BASELINE: a baseline URL of the current state is provided. Call fetchPrototype on it (${input.baselineUrl}) as the 'before', then diff against the prototype. Set changeBasis.method = 'url-diff'.`;
  } else if (useImageBaseline) {
    // The uploaded screenshot is ATTACHED to this message as an image (see the
    // agent invocation). The agent must compare it against the prototype it
    // fetches/inspects itself — this works whether or not the pre-computed
    // diffSummary below is available, so an image baseline is NEVER downgraded
    // to 'inferred'.
    basisInstruction =
      "BASELINE: an uploaded SCREENSHOT of the BEFORE state (the current app) is ATTACHED to this message as an image (labelled 'BEFORE (uploaded baseline screenshot)'). It is visual only — you have no BEFORE markup. Establish what changed by comparing that attached screenshot against the AFTER prototype you fetch and inspect (fetchPrototype/inspectPrototype give you its markup and live controls). Base whatChanged/beforeAfter on that visual delta. Because the before is visual-only, do NOT assert what the prior code/structure was — flag any such code-level inference in openQuestions. Set changeBasis.method = 'image-diff' (NOT 'inferred' — you DO have a real baseline)." +
      (diffSummary
        ? " A pre-computed before/after visual diff is also provided below as a strong starting point — reconcile it with what you see in the attached screenshot."
        : " (No pre-computed diff was available this run — rely on the attached screenshot directly.)");
  } else {
    basisInstruction =
      "BASELINE: none provided. Infer what changed from the designer's note plus product/design-system knowledge, and set changeBasis.method = 'inferred'. State clearly in changeBasis.note AND in openQuestions that whatChanged/beforeAfter are inferred and must be verified against the real prior state.";
  }

  const agent = new ToolLoopAgent({
    model: MODEL_UNDERSTAND,
    tools,
    // Modest headroom over the base tool set for a couple of explorations. Kept
    // tight — a large step budget let the loop balloon (13-min runs). The explore
    // tool is also hard-capped per run (see makeExploreTool).
    stopWhen: stepCountIs(useCodebase ? 30 : 20),
    // The change brief is a large object; give it room so it isn't truncated
    // into invalid JSON (the cause of intermittent "no object generated").
    maxOutputTokens: 16000,
    output: Output.object({ schema: ChangeBriefSchema }),
    // Narrate each tool the agent calls to the live activity feed. Fires after
    // each step; a step can carry several tool calls.
    onStepFinish: (step: { toolCalls?: Array<{ toolName: string; input?: unknown }> }) => {
      for (const tc of step.toolCalls ?? []) act(toolActivity(tc.toolName, tc.input), "tool");
    },
    instructions: [
      "You are a senior product designer preparing a design-handoff change brief.",
      `Process: (1) call fetchPrototype on the prototype URL (the AFTER state); (2) call readReference('product'); (3) call readReference('${designRef}') — the design source to compare against, its components/tokens/conventions; (4) call inspectPrototype on the prototype URL to get its ACTUAL clickable control labels; (5) if the subject is HIDDEN behind a trigger (a drawer, modal, flyout menu, or an inactive tab/toggle — you'll see the trigger label but not its contents), call explorePrototype with the click action(s) to OPEN it and read the revealed markup — once per hidden state that matters (open the drawer; switch to each tab); (6) establish the baseline per the BASELINE instruction below; (7) produce the structured change brief. Judge componentImpact against THIS design source's components.`,
      "When filling each visualManifest entry's `actions`, use the EXACT control labels returned by inspectPrototype as click targets (e.g. if the layout control reads 'Modal', target 'Modal' — not a guessed 'Filter layout'). If inspectPrototype returned no labels, fall back to the most likely visible label and note lower confidence.",
      subject
        ? `SUBJECT: this change is about the ${subject}. The prototype is an ISOLATED DEMO that frames the ${subject} in a stage/page (centered card, page background, maybe an iframe/wrapper). Analyse and report ONLY the ${subject} and its own behaviour. IGNORE the demo scaffolding — page background, the stage/frame card it sits on, wrappers, iframes, page format/structure — and never report scaffolding as a component change (e.g. do NOT say "the toolbar became a rounded card" when that card is the demo stage).`
        : "",
      "Express styling (colours, spacing, radii, type) as design-system TOKENS — the CSS variables in the markup or DS token names from the reference — not raw hex values. Only use a hex value when no token applies, and flag it.",
      basisInstruction,
      "For componentImpact, check the design-system reference before deciding: prefer 'used-as-is' or 'extended' when the library already offers a fitting component. Reserve 'net-new' for genuine gaps.",
      "NEVER describe UI you could have opened as unexaminable. If a component is hidden behind a trigger (drawer, modal, flyout, inactive tab/toggle), you MUST use explorePrototype to open it and analyse its real contents — do not write that you could 'only see the trigger'. The screenshot stage will open these states too, so your analysis must match what will be shown.",
      "Call fetchPrototype, each readReference, and inspectPrototype AT MOST ONCE. explorePrototype is SLOW (a real browser navigation) and hard-capped — call it at most 2–3 times, ONLY for a hidden state you genuinely cannot analyse from the already-fetched markup (e.g. the drawer's contents). Don't re-open the same state, and don't explore states you can already describe. As soon as you have enough context, STOP calling tools and emit the structured change brief; do not loop.",
      "Populate the downstream-feeding fields deliberately: decisionLog (the reasoning trail — decisions, rationale, alternatives, honest tradeoffs), intendedOutcomes + successMetrics (what success looks like and how it could be measured in Gainsight), useCases (persona + scenario + concrete example), and visualManifest (the views worth capturing, each with a caption and annotation callouts, ordered by narrative importance).",
      "For each visualManifest entry, also fill `actions` — the steps to drive the prototype INTO that state before its screenshot. To reach a mode/tab/panel/menu, add a click whose `target` is the control's EXACT visible label from inspectPrototype (e.g. 'Options', 'Table', 'Cards'). For a responsive/size-dependent state, add a setViewport with a realistic width (e.g. 480 mobile, 834 tablet, 1440 desktop). Leave `actions` empty only for the default view. Distinct states MUST have distinct actions, or their screenshots come out identical.",
      "IMPORTANT for collapsed/overflow menus: some controls only exist at a particular width — e.g. discrete buttons that collapse into an overflow / 'more' / 'Tools' / 'Options' menu on narrower screens (or are inline on wide screens). If a menu/trigger only appears at a certain width, the click action MUST be preceded by a setViewport to a width where that trigger is actually visible (put the setViewport action first, then the click). Clicking a control that is hidden at the current width opens nothing — the shot will look like the default. So for a 'menu open' state on a component that collapses, set the narrower viewport AND click the trigger.",
      "Capture the component's DISTINCT, meaningful states — not the same view repeatedly. For a toolbar that means e.g.: default, responsive/mobile (setViewport), each display-mode selected (click each mode), any menu/panel open (click it), and an active/pressed control. Give each a distinct screenKey and the actions to reach it.",
      "Set each visualManifest entry's `selector` to a CSS selector that scopes the screenshot to the COMPONENT (not the whole page) — the component is small and centered on the demo page, so an unscoped shot makes every state look the same. Use a selector wide enough to include any open menu/popover for menu-open states. If a component selector was provided with the run, prefer it; otherwise infer one from the markup/inspection.",
      "The designer has supplied structured context in the prompt below — what the new design is, the surrounding context, the focus areas, and the key design decisions with rationale. TREAT THIS AS PRIMARY TRUTH: put the stated decisions and their rationale straight into decisionLog (rather than re-inferring them), weight the focus areas when choosing what matters, and lean on the description instead of guessing intent. Only infer what the designer hasn't told you — and flag those inferences in openQuestions.",
      "CRITICAL — do not confuse ENHANCED with NEW. A change is often an improvement to something that already exists (making existing views responsive, faster, or more accessible), NOT the introduction of a brand-new capability. Never state that a feature, mode, or view is 'new' or 'added' unless a baseline (codebase, baseline URL, or baseline screenshot) confirms it was absent before. Without that confirmation, describe the change as an enhancement to existing behaviour and record the assumption in openQuestions. Read the designer's note literally but skeptically — 'added X' in a note may mean 'made existing X responsive'.",
      "Be concrete and factual. Never invent behavior you cannot verify — put genuine uncertainty in openQuestions instead of guessing. Where you must infer a decision or metric that the inputs don't state, still flag it in openQuestions.",
      "",
      "Follow this brief specification:",
      guidance,
    ].join("\n"),
  });

  const promptText = [
    `Prototype URL (the AFTER state): ${input.prototypeUrl}`,
    input.baselineUrl && !useCodebase ? `Baseline URL (the BEFORE state): ${input.baselineUrl}` : "",
    useImageBaseline ? "Baseline: an uploaded SCREENSHOT of the BEFORE state (the current app) is ATTACHED to this message as an image (labelled 'BEFORE (uploaded baseline screenshot)') — visual only, no markup. Compare it against the AFTER prototype you fetch/inspect." : "",
    diffSummary ? `\nBefore/after diff (authoritative record of what changed, BEFORE=baseline, AFTER=prototype):\n${diffSummary}\n` : "",
    useCodebase ? "Current source code (the BEFORE state) is available via the readCodebase tool." : "",
    "",
    `Designer's context (primary truth — use directly, infer only what's missing):`,
    designerContext || "(none provided — infer conservatively and flag it)",
    "",
    "Produce the change brief now.",
  ]
    .filter(Boolean)
    .join("\n");

  // The tool-loop + large-object generation is intermittently non-deterministic:
  // a run occasionally ends on a tool call (AI_NoOutputGeneratedError) or truncates
  // the object (AI_NoObjectGeneratedError). The gateway/model themselves are healthy,
  // so simply re-running the whole loop almost always recovers — retry BOTH.
  const RETRYABLE = new Set(["AI_NoObjectGeneratedError", "AI_NoOutputGeneratedError"]);
  // With an image baseline, attach the uploaded screenshot to the prompt as an
  // image part so the agent can see the BEFORE state directly — independent of
  // whether the pre-diff above succeeded. Otherwise a plain text prompt.
  const call: { prompt: string } | { messages: Array<{ role: "user"; content: Array<{ type: "text"; text: string } | { type: "image"; image: string }> }> } =
    useImageBaseline
      ? {
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "text", text: "— BEFORE (uploaded baseline screenshot) —" },
                { type: "image", image: input.baselineImage! },
              ],
            },
          ],
        }
      : { prompt: promptText };
  let output: unknown;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      ({ output } = await agent.generate(call));
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      const err = e as { name?: string; finishReason?: string };
      console.error(`[understand] attempt ${attempt} failed:`, { name: err?.name, finishReason: err?.finishReason });
      if (!RETRYABLE.has(err?.name ?? "")) throw e;
    }
  }
  if (lastErr) throw lastErr;

  return output as ChangeBrief;
}

// ── GENERATE (one artifact) ──────────────────────────────────────────────────
// Every artifact is generated from the brief + a spec. No tools — pure
// re-voicing of one canonical understanding. `focus` narrows a spec to a single
// subject (used for per-component new-component specs).
async function generate(opts: {
  id: string;
  label: string;
  specText: string;
  brief: ChangeBrief;
  productContext: string;
  examples?: string;
  captures?: Capture[];
  focus?: string;
  extra?: string; // extra context appended after the spec (e.g. the instrumentation plan)
}): Promise<Artifact> {
  const usableCaptures = (opts.captures ?? []).filter((c) => c.ok && c.url);
  const capturesBlock = usableCaptures.length
    ? [
        "",
        "### Captured screenshots (real, served URLs)",
        "These images were captured from the prototype. When the spec calls for a screenshot",
        "of a given screenKey, embed THAT image inline as Markdown: `![caption](url)`.",
        "Use ONLY the URLs below — never invent an image URL. If a screenKey you need is not",
        "listed, describe it in words instead.",
        ...usableCaptures.map((c) => `- screenKey \`${c.screenKey}\`: ${c.url} — ${c.caption}`),
      ].join("\n")
    : "";
  // Per-artifact tail — varies by artifact, so it must come AFTER the cached
  // shared prefix (product context + brief) or it would break the prefix match.
  const perArtifact = [
    "### Spec",
    opts.specText,
    capturesBlock,
    opts.examples
      ? [
          "",
          "### Reference examples (real Ideagen artifacts)",
          "Match their VOICE, STRUCTURE, and register closely — headings, rhythm, level of detail, spelling.",
          "Do NOT copy their specific products, features, or facts; those come only from the change brief.",
          "",
          opts.examples,
        ].join("\n")
      : "",
    opts.extra ? `\n${opts.extra}\n` : "",
    "",
    opts.focus ? `Write the artifact, focusing ONLY on: ${opts.focus}.` : `Write the artifact for: ${opts.label}.`,
  ].join("\n");

  const { text, usage, providerMetadata } = await generateText({
    model: MODEL_GENERATE,
    maxOutputTokens: 8000,
    // Prompt-cache the two blocks that are identical across every artifact in a
    // run — the product context (system) and the change brief (first user block).
    // The per-artifact spec/examples follow, uncached. The fan-out is staggered
    // (see runPipeline) so these caches are written once and read by the rest.
    messages: [
      {
        role: "system",
        content: [
          "You are drafting one design-handoff artifact for a single, specific audience or purpose.",
          "Follow the spec below exactly — its voice, format, length, must-include, and must-avoid.",
          "Use correct product terminology from the product context. Output ONLY the finished artifact as clean Markdown. No preamble, no meta commentary.",
          "",
          "### Product context (shared — use for accurate framing and terminology)",
          opts.productContext,
        ].join("\n"),
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Use this change brief as the single source of truth:\n\n${JSON.stringify(opts.brief, null, 2)}`,
            providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
          },
          { type: "text", text: perArtifact },
        ],
      },
    ],
  });
  // Cache reads surface on usage.cachedInputTokens; cache writes on the anthropic
  // provider metadata. Logged for cost visibility during the fan-out.
  const write = (providerMetadata?.anthropic as { cacheCreationInputTokens?: number } | undefined)?.cacheCreationInputTokens ?? 0;
  const read = usage?.cachedInputTokens ?? 0;
  console.error(`[cache] ${opts.id}: read=${read} write=${write}`);
  return { audienceId: opts.id, label: opts.label, content: text.trim() };
}

// The slide is generated as validated structured data (not free markdown) so the
// deck exporter can fill template placeholders reliably. Returns an Artifact with
// a readable content preview plus the SlideSpec attached for the .pptx download.
async function generateSlide(opts: {
  brief: ChangeBrief;
  productContext: string;
  examples: string;
  captures: Capture[];
}): Promise<Artifact> {
  const specText = await readAudienceSpec("slide.md");
  const usable = opts.captures.filter((c) => c.ok);
  const keys = usable.length
    ? usable.map((c) => `- ${c.screenKey} — ${c.caption}`).join("\n")
    : "(none captured — use an empty string for picScreenKey)";

  const { object } = await generateObject({
    model: MODEL_GENERATE,
    maxOutputTokens: 4000,
    schema: SlideSpecSchema,
    system: [
      "You are producing structured content for ONE Ideagen slide on the 'Blanks - Blank 1' layout.",
      "The layout is fixed: a headline title and a supporting subtitle top-left, magenta-bulleted CALLOUTS down the left column, and 1–3 showcase screenshots down the right column. Fill title, subtitle, callouts, images (choose the frames that best show the new design), and speaker notes.",
      "Follow the spec's voice and rules, and mirror the worked example's structure closely.",
      "",
      "### Product context",
      opts.productContext,
      "",
      "### Spec",
      specText,
      opts.examples ? `\n### Worked example (match this structure)\n${opts.examples}` : "",
    ].join("\n"),
    prompt: [
      "Change brief (source of truth):",
      JSON.stringify(opts.brief, null, 2),
      "",
      "Available captured screenKeys for the images (pick 1–3 that best showcase the change; use ONLY these keys):",
      keys,
    ].join("\n"),
  });

  const slideSpec = object as SlideSpec;
  // Guardrail: the model can hallucinate screenKeys. Keep only images whose
  // screenKey was actually captured (in order); if it named none that exist,
  // fall back to the first couple of real captures so the right column isn't
  // empty. Cap at 3 — the layout stacks at most three.
  const validKeys = new Set(usable.map((c) => c.screenKey));
  let images = (slideSpec.images ?? []).filter((img) => validKeys.has(img.screenKey)).slice(0, 3);
  if (!images.length && usable.length) {
    images = usable.slice(0, 2).map((c) => ({ screenKey: c.screenKey, label: c.caption?.slice(0, 24) ?? "" }));
  }
  slideSpec.images = images;

  const content = [
    `**${slideSpec.title}**`,
    "",
    slideSpec.subtitle,
    "",
    ...(slideSpec.callouts ?? []).map((c) => `- ${c}`),
    "",
    images.length
      ? `_Images: ${images.map((i) => (i.label ? `${i.screenKey} (${i.label})` : i.screenKey)).join(", ")}_`
      : "_No images_",
    "",
    `> **Speaker notes:** ${slideSpec.notes}`,
  ].join("\n");
  return { audienceId: "slide", label: "Slide", content, slideSpec };
}

// ── Instrumentation plan (the analytics ↔ code bridge) ───────────────────────
// From the brief's success metrics and UI, decide which elements Gainsight PX
// must observe and assign each a stable data-id. This ONE structured plan is then
// (a) documented in the analytics-plan artifact and (b) wired into the coded
// component's markup — so the data-ids in the doc and the code always match.
async function generateInstrumentation(opts: {
  brief: ChangeBrief;
  productContext: string;
  subject?: string;
}): Promise<InstrumentationPlan> {
  const { object } = await generateObject({
    model: MODEL_GENERATE,
    maxOutputTokens: 3000,
    schema: InstrumentationPlanSchema,
    system: [
      "You are planning analytics instrumentation for a UI change. Decide which UI elements Gainsight PX must observe to measure whether this change succeeds, and assign each a stable, unique data-id.",
      "Your data-ids are AUTHORITATIVE: they will be documented in the analytics plan AND wired verbatim into the coded component's markup as `data-id` attributes, so PX has a unique selector. Make them sensible, unique, kebab-case.",
      opts.subject
        ? `Component/subject: ${opts.subject}. Derive a short kebab-case prefix from it (e.g. 'search-toolbar-') and prefix every data-id with it.`
        : "Derive a short kebab-case prefix from the change's component and prefix every data-id with it.",
      "",
      "### Product context",
      opts.productContext,
    ].join("\n"),
    prompt: [
      "Derive the instrumentation plan from this change brief. Ground every point in the brief's successMetrics and intendedOutcomes, mapped to the ACTUAL UI elements named in whatChanged / visualManifest. One data-id per meaningful, measurable interaction — typically 3–8. Do not instrument everything; only what a metric needs.",
      "",
      JSON.stringify(opts.brief, null, 2),
    ].join("\n"),
  });
  return object as InstrumentationPlan;
}

// Render the plan as a Markdown table for injection into the analytics-plan doc
// and the code prompt — the single authoritative list of data-ids.
function instrumentationToMarkdown(plan: InstrumentationPlan | null): string {
  if (!plan?.points?.length) return "";
  const rows = plan.points
    .map((p) => `| \`${p.dataId}\` | ${p.element} | ${p.event} | ${p.metric} |`)
    .join("\n");
  return [
    "### Instrumentation plan — data-ids for Gainsight (authoritative)",
    "These `data-id` values are the Gainsight PX selectors for this change. They are wired into the coded component's markup, so use THESE exact ids — do not invent or rename them.",
    "",
    "| data-id | Element | Event | Metric it serves |",
    "|---|---|---|---|",
    rows,
  ].join("\n");
}

// The coded developer artifact: a real, DS-grounded starting-point component in
// the chosen framework (Vue by default). Separate from the dev handoff SPEC — the
// designer asked for both. Injects the design-system reference so imports/tokens
// are real, not invented, and the instrumentation plan so Gainsight data-ids are wired in.
async function generateCode(opts: {
  brief: ChangeBrief;
  productContext: string;
  dsReference: string;
  codeSpecText: string;
  framework: string;
  focus?: string;
  instrumentation?: InstrumentationPlan | null;
  analytics: { attr: string; directive: boolean };
  repoConventions?: string | null;
  label: string;
}): Promise<Artifact> {
  const instrBlock = instrumentationToMarkdown(opts.instrumentation ?? null);
  // How the target attaches an analytics id — a Vue directive (v-gs-id="'id'") or
  // a plain attribute (data-id="id").
  const attrHowto = opts.analytics.directive
    ? `the \`${opts.analytics.attr}\` directive, e.g. \`${opts.analytics.attr}="'<id>'"\``
    : `the \`${opts.analytics.attr}\` attribute, e.g. \`${opts.analytics.attr}="<id>"\``;
  const { text } = await generateText({
    model: MODEL_GENERATE,
    // Generous budget: a full SFC (template + script + scoped style) plus the
    // doc sections is sizable, and adaptive thinking also draws from this pool —
    // 8k truncated the component mid-template. 16k leaves room to finish.
    maxOutputTokens: 16000,
    system: [
      `You are a senior front-end engineer writing a starting-point ${opts.framework} component for a design-handoff.`,
      "Follow the code-target spec exactly. Ground every component/token in the design-system reference — do not invent names.",
      "Output ONLY the finished Markdown document described by the spec. No preamble.",
      "",
      "### Product context",
      opts.productContext,
      "",
      "### Design-system reference (real components, tokens, patterns — use these)",
      opts.dsReference,
      "",
      "### Code-target spec",
      opts.codeSpecText,
      opts.repoConventions
        ? [
            "",
            "### Target repo conventions — AUTHORITATIVE (from the actual codebase)",
            "These are read from the real target repository. Where they conflict with anything above, THESE WIN.",
            opts.repoConventions,
          ].join("\n")
        : "",
      instrBlock
        ? [
            "",
            "### Analytics instrumentation — REQUIRED",
            `The analytics plan instruments this change via the ids below. Attach each id to the element described using ${attrHowto} — this is how the target wires it for Gainsight PX. Use the ids VERBATIM; every one must appear in your markup, on the real interactive element. Add a short comment marking them as analytics instrumentation.`,
            instrBlock,
          ].join("\n")
        : "",
    ].join("\n"),
    prompt: [
      opts.focus
        ? `Implement this component: ${opts.focus}. It is the change's primary net-new UI.`
        : "Implement the change's primary new/changed UI as a single focused component.",
      instrBlock ? `Wire in the required analytics ids using ${attrHowto} on the elements named in the instrumentation plan.` : "",
      "Use this change brief as the source of truth:",
      "",
      JSON.stringify(opts.brief, null, 2),
    ]
      .filter(Boolean)
      .join("\n"),
  });
  return {
    audienceId: "dev-code",
    label: opts.label,
    content: text.trim(),
  };
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Wrap a generation promise so a single artifact's failure never sinks the run —
// it resolves to a visible, re-runnable error card instead of rejecting.
function guard(p: Promise<Artifact>, audienceId: string, label: string): Promise<Artifact> {
  return p.catch((err) => ({
    audienceId,
    label,
    content: `> ⚠️ This artifact failed to generate: ${String(err).slice(0, 200)}\n\nEverything else generated normally — re-run to retry just the pipeline, or edit this manually.`,
  }));
}

// Yields the results of an array of promises as each one settles.
async function* asCompleted<T>(promises: Promise<T>[]): AsyncGenerator<T> {
  const pending = new Map<number, Promise<{ i: number; v: T }>>();
  promises.forEach((p, i) => pending.set(i, p.then((v) => ({ i, v }))));
  while (pending.size) {
    const { i, v } = await Promise.race(pending.values());
    pending.delete(i);
    yield v;
  }
}

// Extract the first fenced code block from generated Markdown (for lint/preview).
function extractCodeBlock(md: string): string {
  const m = md.match(/```(?:vue|html|jsx?|tsx?|javascript|typescript)?\n([\s\S]*?)```/);
  return m ? m[1] : "";
}

// #4 — read the TARGET repo's own convention docs (best-effort, local only) so
// generated code follows the actual repo, not just the built-in profile.
async function readRepoConventions(codebasePath?: string): Promise<string | null> {
  if (!codebasePath) return null;
  const candidates = ["CLAUDE.md", "AGENTS.md", "CONTRIBUTING.md", ".github/CONTRIBUTING.md", "docs/CONVENTIONS.md"];
  for (const c of candidates) {
    try {
      const txt = await readFile(join(codebasePath, c), "utf8");
      if (txt.trim()) return `From \`${c}\`:\n\n${txt.slice(0, 12000)}`;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

// #5 — best-effort lint of the generated component against the TARGET repo's OWN
// ESLint, surfacing the same issues the developers' gate would. Local only; never
// throws; returns null when it can't run.
async function lintAgainstRepo(code: string, codebasePath?: string): Promise<string | null> {
  if (!codebasePath || !code.trim()) return null;
  try {
    const { existsSync } = await import("node:fs");
    const bin = join(codebasePath, "node_modules", ".bin", "eslint");
    if (!existsSync(bin)) return null;
    const { writeFile, rm } = await import("node:fs/promises");
    const tmp = join(codebasePath, `.harness-lint-${Date.now().toString(36)}.vue`);
    try {
      await writeFile(tmp, code);
      const { execFile } = await import("node:child_process");
      const out: string = await new Promise((resolve) => {
        execFile(bin, ["--no-ignore", "--format", "compact", tmp], { cwd: codebasePath, timeout: 45000, maxBuffer: 2_000_000 }, (_e, stdout, stderr) => resolve(`${stdout || ""}${stderr || ""}`));
      });
      return out.split(tmp).join("GeneratedComponent.vue").trim();
    } finally {
      await rm(tmp, { force: true }).catch(() => {});
    }
  } catch {
    return null;
  }
}

// ── The harness loop ─────────────────────────────────────────────────────────
// Understand → fan out to every audience → stream each artifact as it lands.
// Review + distribute happen in the UI (human in the loop).
export async function* runPipeline(input: {
  prototypeUrl: string;
  note: string;
  baselineUrl?: string;
  baselineImage?: string;
  codebasePath?: string;
  codebaseScope?: string;
  framework?: string;
  enabledOutputs?: string[];
  subject?: string;
  componentSelector?: string;
  projectName?: string;
  designDescription?: string;
  projectContext?: string;
  focusAreas?: string;
  designDecisions?: string;
  designSource?: string;
  // ── Large-prototype controls (all optional; absent = legacy single-screen) ──
  screens?: Array<string | { url: string; label?: string }>; // explicit screen list
  crawl?: boolean; // discover screens by crawling same-origin links from the entry
  maxScreens?: number; // cap on discovered/scoped screens (default 12)
  maxCaptureScreens?: number; // cap on screens actually screenshotted (default 24 when multi)
}): AsyncGenerator<PipelineEvent> {
  const source: DesignSource = getDesignSource(input.designSource);
  // Wall-clock start — reported on completion and stored with the run.
  const startedAt = Date.now();
  // Stable id for this run — used for the capture folder AND the library entry.
  const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // One warm browser shared across the whole run (discovery scoping, before/after
  // diff, per-screen analysis, and capture) instead of a cold launch per op (#3).
  // Null when no browser is available — every consumer degrades gracefully.
  const pool = await BrowserPool.open();
  // Which artifact types to produce. Empty/undefined = all. Component specs are
  // gated under "design-system" since they're a design-system deliverable.
  const enabled = input.enabledOutputs?.length ? new Set(input.enabledOutputs) : null;
  const wants = (id: string) => !enabled || enabled.has(id);
  try {
  // ── Stage: DISCOVER SCREENS + SCOPE TO THE DELTA (#1, #2) ────────────────────
  // Enumerate the prototype's screens (explicit list → crawl → single fallback),
  // then keep only those that changed vs. the baseline. A plain single-URL run
  // (no crawl, no list) yields exactly ONE screen and takes the legacy tool-loop
  // path below — so nothing regresses for the isolated-component demo case.
  yield { type: "status", stage: "discover", message: "Mapping the prototype's screens…" };
  const discovered = await discoverScreens({
    prototypeUrl: input.prototypeUrl,
    baselineUrl: input.baselineUrl,
    screens: input.screens,
    crawl: input.crawl,
    maxScreens: input.maxScreens,
  });
  const map: ScreenMap =
    discovered.screens.length > 1
      ? await scopeToChanged(discovered.screens, { pool: pool ?? undefined, hasBaseline: !!input.baselineUrl })
      : {
          screens: discovered.screens,
          method: discovered.method,
          discovered: discovered.screens.length,
          scoped: discovered.screens.length,
          note: "Single screen — no decomposition needed.",
        };
  const multi = map.screens.length > 1;
  if (discovered.screens.length > 1) {
    yield {
      type: "screenmap",
      method: map.method,
      discovered: map.discovered,
      scoped: map.scoped,
      screens: map.screens.map((s) => ({ key: s.key, label: s.label, url: s.url })),
      note: map.note,
    };
    yield { type: "activity", message: `${map.scoped}/${map.discovered} screens in scope — ${map.note}`, kind: "milestone" };
  }

  // Checkpoint the job so a re-run can resume; the content-hash cache in the
  // per-screen analysis is what actually makes an unchanged screen a cheap hit (#4).
  const checkpoint: JobCheckpoint = newCheckpoint(runId, input.prototypeUrl, map.screens.map((s) => s.key));
  void saveJob(checkpoint);

  const basis = input.codebasePath
    ? "against the current codebase"
    : input.baselineUrl
      ? "against the baseline URL"
      : input.baselineImage
        ? "against the uploaded baseline screenshot"
        : "from the note (no baseline — inferred)";
  yield {
    type: "status",
    stage: "understand",
    message: multi ? `Analysing ${map.scoped} screens and merging into one change brief…` : `Building the change brief, diffing ${basis}…`,
  };
  yield {
    type: "activity",
    message: multi ? `Analysing ${map.scoped} screens in parallel…` : "Analyzing the prototype and building the change brief…",
    kind: "stage",
  };
  // Run Understand while draining its narration to the feed. Multi-screen uses the
  // map-reduce path (scaledUnderstand); a single screen uses the legacy tool-loop.
  // The queue closes when the chosen path settles (success OR failure); we then
  // await the brief so any error still propagates.
  const q = new ActivityQueue();
  let briefErr: unknown = null;
  let screenUrls: Record<string, string> = {};
  const briefPromise = (async () => {
    if (multi) {
      const r = await scaledUnderstand(
        { designerContext: buildDesignerContext(input), designReference: source.reference, subject: input.subject },
        map.screens,
        { pool: pool ?? undefined, onActivity: (message, kind) => q.push({ type: "activity", message, kind }) },
      );
      screenUrls = r.screenUrls;
      return r.brief;
    }
    return understand({
      ...input,
      pool: pool ?? undefined,
      designReference: source.reference,
      onActivity: (message, kind) => q.push({ type: "activity", message, kind }),
    });
  })()
    .catch((e) => {
      briefErr = e;
      return null;
    })
    .finally(() => q.close());
  for await (const ev of q.drain()) yield ev;
  const brief = await briefPromise;
  if (briefErr || !brief) throw briefErr ?? new Error("Understand produced no brief");
  checkpoint.briefDone = true;
  void saveJob(checkpoint);
  yield { type: "activity", message: `Change brief ready: “${brief.title}”`, kind: "milestone" };
  yield { type: "brief", brief };

  // The lighter brief handed to the fan-out generators (#5): strips capture-only
  // visualManifest fields and caps oversized arrays, so a large multi-screen brief
  // doesn't inflate the shared, prompt-cached generator prefix. Capture and the
  // library save keep the FULL brief.
  const briefForGen = compactBriefForGenerators(brief);

  // ── Stage: CAPTURE ─────────────────────────────────────────────────────────
  // Screenshot each view in the brief's visualManifest from the live prototype.
  // Local-first; degrades to placeholders. Feeds the visual artifacts + deck.
  let captures: Capture[] = [];
  const manifest = brief.visualManifest ?? [];
  if (manifest.length) {
    yield {
      type: "status",
      stage: "capture",
      message: `Capturing ${manifest.length} screen${manifest.length > 1 ? "s" : ""} from the prototype…`,
    };
    yield { type: "activity", message: `Capturing ${manifest.length} screen${manifest.length > 1 ? "s" : ""} from the prototype…`, kind: "stage" };
    captures = await captureScreens({
      prototypeUrl: input.prototypeUrl,
      manifest,
      runId,
      defaultSelector: input.componentSelector,
      pool: pool ?? undefined, // reuse the run's warm browser + bounded concurrency (#3)
      screenUrls, // per-screen URLs for a multi-page prototype
      maxScreens: input.maxCaptureScreens ?? (multi ? 24 : undefined), // hard cap on a big run (#3)
    });
    yield { type: "captures", captures };
    const okCount = captures.filter((c) => c.ok).length;
    yield { type: "activity", message: `Captured ${okCount}/${captures.length} screens`, kind: "milestone" };
    const failed = captures.filter((c) => !c.ok).length;
    if (failed) {
      yield {
        type: "status",
        stage: "capture",
        message: `${captures.length - failed}/${captures.length} screens captured; ${failed} need manual attachment.`,
      };
    }
  }

  // Build the generation jobs: the 5 comms audiences + the developer handoff…
  const jobs: Array<{ id: string; label: string; specText: string; focus?: string }> = [];
  for (const a of AUDIENCES) {
    if (a.id === "slide") continue; // slide uses a dedicated structured generator
    if (!wants(a.id)) continue;
    jobs.push({ id: a.id, label: a.label, specText: await readAudienceSpec(a.specFile) });
  }
  if (wants("dev")) {
    jobs.push({ id: "dev", label: "Developer handoff", specText: await readAudienceSpec("dev.md") });
  }

  // …plus the conditional offshoot: one component spec per net-new component
  // (gated under the design-system output).
  const newComponents = brief.componentImpact.filter((c) => c.disposition === "net-new");
  if (newComponents.length && wants("design-system")) {
    const names = newComponents.map((c) => c.name).join(", ");
    yield {
      type: "status",
      stage: "offshoot",
      message: `${newComponents.length} net-new component${newComponents.length > 1 ? "s" : ""} detected — adding component spec${newComponents.length > 1 ? "s" : ""}: ${names}`,
    };
    const template = await readComponentSpecTemplate();
    for (const c of newComponents) {
      jobs.push({ id: `component-${slug(c.name)}`, label: `New component spec — ${c.name}`, specText: template, focus: c.name });
    }
  }

  const extra = (wants("slide") ? 1 : 0) + (wants("dev-code") ? 1 : 0);
  yield {
    type: "status",
    stage: "generate",
    message: `Drafting ${jobs.length + extra} artifact${jobs.length + extra === 1 ? "" : "s"}…`,
  };
  yield { type: "activity", message: `Drafting ${jobs.length + extra} artifact${jobs.length + extra === 1 ? "" : "s"}…`, kind: "stage" };
  const productContext = await readReferenceDoc("product");

  // The analytics ↔ code bridge: one instrumentation plan (Gainsight data-ids),
  // shared by the analytics-plan doc and the coded component so they agree on what
  // PX observes and which selectors it attaches to. Computed once, before the
  // fan-out, whenever either of those two outputs is wanted. Best-effort.
  let instrumentation: InstrumentationPlan | null = null;
  if (wants("analytics-plan") || wants("dev-code")) {
    try {
      instrumentation = await generateInstrumentation({ brief: briefForGen, productContext, subject: input.subject });
      const nPts = instrumentation?.points?.length ?? 0;
      if (nPts) {
        yield { type: "status", stage: "instrument", message: `Instrumentation plan: ${nPts} data-id${nPts > 1 ? "s" : ""} for Gainsight` };
        yield { type: "activity", message: `Instrumentation plan: ${nPts} data-id${nPts > 1 ? "s" : ""} for Gainsight`, kind: "milestone" };
        yield { type: "instrumentation", plan: instrumentation };
      }
    } catch {
      instrumentation = null; // the plan and code still generate without it
    }
  }

  // Artifacts that embed real screenshots inline (prose formats). The slide
  // references screenKeys instead and the deck exporter places the images.
  const IMAGE_ARTIFACTS = new Set(["case-study", "one-pager"]);
  const genJob = (j: { id: string; label: string; specText: string; focus?: string }) =>
    guard(
      (async () =>
        generate({
          ...j,
          brief: briefForGen,
          productContext,
          examples: await readExamples(j.id),
          captures: IMAGE_ARTIFACTS.has(j.id) ? captures : undefined,
          // The analytics plan documents the exact data-ids wired into the code.
          extra: j.id === "analytics-plan" ? instrumentationToMarkdown(instrumentation) || undefined : undefined,
        }))(),
      j.id,
      j.label,
    );

  // Warm the shared prompt cache (product context + brief) with the FIRST
  // generator, then fan the rest out concurrently so they READ that cache rather
  // than re-sending it at full price. Concurrent requests can't read a cache
  // that's still being written, so the first must land before the others fire.
  const framework = input.framework || "vue";
  const collected: Artifact[] = []; // accumulated for the library save at the end
  const promises: Promise<Artifact>[] = [];
  if (jobs.length) {
    const [firstJob, ...restJobs] = jobs;
    const first = await genJob(firstJob);
    collected.push(first);
    yield { type: "artifact", artifact: first };
    promises.push(...restJobs.map(genJob));
  }
  // The slide's dedicated structured generator, streamed alongside the rest.
  if (wants("slide")) {
    promises.push(
      guard(
        (async () => generateSlide({ brief: briefForGen, productContext, examples: await readExamples("slide"), captures }))(),
        "slide",
        "Slide",
      ),
    );
  }
  // The coded developer artifact (framework-parameterized; Vue default), grounded
  // in the design-system reference and focused on the primary net-new component.
  const codeLabel = source.codeLabel ? `Developer component code (${source.codeLabel})` : `Developer component code (${framework})`;
  if (wants("dev-code")) {
    promises.push(
      guard(
        (async () => {
          // Ground the code in the CHOSEN design source: its reference + its fixed
          // conventions spec (or the framework-based spec when it has none).
          const dsReference = await readReferenceDoc(source.reference);
          const codeSpecText = source.codeSpec ? await readCodeSpecFile(source.codeSpec) : (await readCodeSpec(framework)).text;
          const repoConventions = await readRepoConventions(input.codebasePath); // #4
          const artifact = await generateCode({
            brief: briefForGen, productContext, dsReference, codeSpecText, framework,
            focus: newComponents[0]?.name, instrumentation,
            analytics: source.analytics, repoConventions, label: codeLabel,
          });
          // #5 — lint the generated component against the target repo's own ESLint.
          const lint = await lintAgainstRepo(extractCodeBlock(artifact.content), input.codebasePath);
          if (lint !== null) {
            artifact.content += lint
              ? `\n\n---\n\n### Lint check — target repo ESLint\n\n\`\`\`\n${lint.slice(0, 4000)}\n\`\`\``
              : `\n\n---\n\n### Lint check — target repo ESLint\n\n✓ No issues reported.`;
          }
          return artifact;
        })(),
        "dev-code",
        codeLabel,
      ),
    );
  }
  for await (const artifact of asCompleted(promises)) {
    collected.push(artifact);
    yield { type: "artifact", artifact };
  }

  // ── Auto-save to the local library ────────────────────────────────────────
  // Every successful run is archived (with its screenshots), stamped with the
  // tool version and grouped under its design project, for later reference and
  // cross-run comparison. Best-effort — a save failure never fails the run.
  const durationMs = Date.now() - startedAt;
  let savedRunId: string | null = null;
  let savedProject: string | undefined;
  try {
    const projectName =
      input.projectName?.trim() || input.subject?.trim() || brief.title || "Unsorted";
    const project = { id: projectSlug(projectName), name: projectName };
    const run: StoredRun = {
      id: runId,
      version: APP_VERSION,
      createdAt: new Date().toISOString(),
      project,
      title: brief.title,
      prototypeUrl: input.prototypeUrl,
      baselineUrl: input.baselineUrl,
      subject: input.subject,
      artifactCount: collected.length,
      captureCount: captures.filter((c) => c.ok).length,
      durationMs,
      input: {
        prototypeUrl: input.prototypeUrl,
        baselineUrl: input.baselineUrl,
        framework: input.framework,
        subject: input.subject,
        componentSelector: input.componentSelector,
        designDescription: input.designDescription,
        projectContext: input.projectContext,
        focusAreas: input.focusAreas,
        designDecisions: input.designDecisions,
        enabledOutputs: input.enabledOutputs,
      },
      brief,
      captures,
      artifacts: collected,
      instrumentation,
    };
    savedRunId = await saveRun(run, runId);
    if (savedRunId) savedProject = project.id;
  } catch {
    /* archival is best-effort */
  }

  yield { type: "done", savedRunId: savedRunId ?? undefined, project: savedProject, durationMs };
  } finally {
    // One browser for the whole run — close it once, here, whether the run
    // completed, threw, or the client aborted the stream (generator .return()).
    if (pool) await pool.close();
  }
}
