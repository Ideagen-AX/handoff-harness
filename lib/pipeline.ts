import { ToolLoopAgent, Output, generateText, generateObject, stepCountIs, type ToolSet } from "ai";
import { MODEL_UNDERSTAND, MODEL_GENERATE } from "./model";
import { ChangeBriefSchema, SlideSpecSchema, type ChangeBrief, type PipelineEvent, type Artifact, type Capture, type SlideSpec } from "./types";
import { stat } from "node:fs/promises";
import { fetchPrototype, readReference, makeCodebaseTool, inspectPrototype } from "./tools";
import { captureScreens, capturePrototypeState } from "./capture";

type DiffPart = { type: "text"; text: string } | { type: "image"; image: string };

// Before/after prototype diff: for each state, capture a screenshot AND its
// rendered HTML/CSS markup, then have the model compare them both visually and at
// the code level. This is what makes a URL baseline useful for styling/layout
// changes — a text fetch misses them. Returns null when neither state could be
// captured (falls back to the plain text diff).
async function diffPrototypes(beforeUrl: string, afterUrl: string, note: string, subject?: string): Promise<string | null> {
  const [before, after] = await Promise.all([capturePrototypeState(beforeUrl), capturePrototypeState(afterUrl)]);
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
import { readAudienceSpec, readChangeBriefGuidance, readComponentSpecTemplate, readReferenceDoc, readExamples, readCodeSpec } from "./specs";
import { AUDIENCES } from "./audiences";

// ── Stage 1: UNDERSTAND ──────────────────────────────────────────────────────
// A real tool-loop agent: it fetches the prototype, optionally reads the
// design-system reference, then emits the structured Change Brief.
async function understand(input: {
  prototypeUrl: string;
  note: string;
  baselineUrl?: string;
  codebasePath?: string;
  subject?: string;
  componentSelector?: string;
}): Promise<ChangeBrief> {
  const subject = input.subject?.trim();
  const guidance = await readChangeBriefGuidance();

  // Establish the "before" state: codebase (preferred) → baseline URL → inference.
  let useCodebase = false;
  if (input.codebasePath) {
    try {
      useCodebase = (await stat(input.codebasePath)).isDirectory();
    } catch {
      useCodebase = false; // path not reachable here (e.g. on Vercel) — fall back
    }
  }

  const tools: ToolSet = { fetchPrototype, readReference, inspectPrototype };
  if (useCodebase) tools.readCodebase = makeCodebaseTool(input.codebasePath!);

  // For a URL baseline, diff the two prototypes up front — visually AND at the
  // code level (screenshot + rendered HTML/CSS). Styling changes don't show up in
  // fetched text. Falls back to the plain text diff if capture is unavailable.
  const diffSummary =
    !useCodebase && input.baselineUrl
      ? await diffPrototypes(input.baselineUrl, input.prototypeUrl, input.note, subject)
      : null;

  let basisInstruction: string;
  if (useCodebase) {
    basisInstruction =
      "BASELINE: the current source code is available via readCodebase (the 'before'). Explore it — list directories, then read the files that implement the affected area — then diff it against the prototype to determine what ACTUALLY changed. Set changeBasis.method = 'codebase-diff'.";
  } else if (input.baselineUrl) {
    basisInstruction = diffSummary
      ? "BASELINE: a before/after diff of the two prototypes — comparing both the screenshots and the rendered HTML/CSS (BEFORE = baseline URL, AFTER = prototype) — is provided below. Treat it as the authoritative record of what changed, especially styling and layout, and base whatChanged/beforeAfter on it. Set changeBasis.method = 'url-diff'."
      : `BASELINE: a baseline URL of the current state is provided. Call fetchPrototype on it (${input.baselineUrl}) as the 'before', then diff against the prototype. Set changeBasis.method = 'url-diff'.`;
  } else {
    basisInstruction =
      "BASELINE: none provided. Infer what changed from the designer's note plus product/design-system knowledge, and set changeBasis.method = 'inferred'. State clearly in changeBasis.note AND in openQuestions that whatChanged/beforeAfter are inferred and must be verified against the real prior state.";
  }

  const agent = new ToolLoopAgent({
    model: MODEL_UNDERSTAND,
    tools,
    stopWhen: stepCountIs(useCodebase ? 28 : 12),
    // The change brief is a large object; give it room so it isn't truncated
    // into invalid JSON (the cause of intermittent "no object generated").
    maxOutputTokens: 16000,
    output: Output.object({ schema: ChangeBriefSchema }),
    instructions: [
      "You are a senior product designer preparing a design-handoff change brief.",
      "Process: (1) call fetchPrototype on the prototype URL (the AFTER state); (2) call readReference('product'); (3) call readReference('design-system'); (4) call inspectPrototype on the prototype URL to get its ACTUAL clickable control labels; (5) establish the baseline per the BASELINE instruction below; (6) produce the structured change brief.",
      "When filling each visualManifest entry's `actions`, use the EXACT control labels returned by inspectPrototype as click targets (e.g. if the layout control reads 'Modal', target 'Modal' — not a guessed 'Filter layout'). If inspectPrototype returned no labels, fall back to the most likely visible label and note lower confidence.",
      subject
        ? `SUBJECT: this change is about the ${subject}. The prototype is an ISOLATED DEMO that frames the ${subject} in a stage/page (centered card, page background, maybe an iframe/wrapper). Analyse and report ONLY the ${subject} and its own behaviour. IGNORE the demo scaffolding — page background, the stage/frame card it sits on, wrappers, iframes, page format/structure — and never report scaffolding as a component change (e.g. do NOT say "the toolbar became a rounded card" when that card is the demo stage).`
        : "",
      "Express styling (colours, spacing, radii, type) as design-system TOKENS — the CSS variables in the markup or DS token names from the reference — not raw hex values. Only use a hex value when no token applies, and flag it.",
      basisInstruction,
      "For componentImpact, check the design-system reference before deciding: prefer 'used-as-is' or 'extended' when the library already offers a fitting component. Reserve 'net-new' for genuine gaps.",
      "Populate the downstream-feeding fields deliberately: decisionLog (the reasoning trail — decisions, rationale, alternatives, honest tradeoffs), intendedOutcomes + successMetrics (what success looks like and how it could be measured in Gainsight), useCases (persona + scenario + concrete example), and visualManifest (the views worth capturing, each with a caption and annotation callouts, ordered by narrative importance).",
      "For each visualManifest entry, also fill `actions` — the steps to drive the prototype INTO that state before its screenshot. To reach a mode/tab/panel/menu, add a click whose `target` is the control's EXACT visible label from inspectPrototype (e.g. 'Options', 'Table', 'Cards'). For a responsive/size-dependent state, add a setViewport with a realistic width (e.g. 480 mobile, 834 tablet, 1440 desktop). Leave `actions` empty only for the default view. Distinct states MUST have distinct actions, or their screenshots come out identical.",
      "Capture the component's DISTINCT, meaningful states — not the same view repeatedly. For a toolbar that means e.g.: default, responsive/mobile (setViewport), each display-mode selected (click each mode), any menu/panel open (click it), and an active/pressed control. Give each a distinct screenKey and the actions to reach it.",
      "Set each visualManifest entry's `selector` to a CSS selector that scopes the screenshot to the COMPONENT (not the whole page) — the component is small and centered on the demo page, so an unscoped shot makes every state look the same. Use a selector wide enough to include any open menu/popover for menu-open states. If a component selector was provided with the run, prefer it; otherwise infer one from the markup/inspection.",
      "CRITICAL — do not confuse ENHANCED with NEW. A change is often an improvement to something that already exists (making existing views responsive, faster, or more accessible), NOT the introduction of a brand-new capability. Never state that a feature, mode, or view is 'new' or 'added' unless a baseline (codebase or baseline URL) confirms it was absent before. Without that confirmation, describe the change as an enhancement to existing behaviour and record the assumption in openQuestions. Read the designer's note literally but skeptically — 'added X' in a note may mean 'made existing X responsive'.",
      "Be concrete and factual. Never invent behavior you cannot verify — put genuine uncertainty in openQuestions instead of guessing. Where you must infer a decision or metric that the inputs don't state, still flag it in openQuestions.",
      "",
      "Follow this brief specification:",
      guidance,
    ].join("\n"),
  });

  const promptText = [
    `Prototype URL (the AFTER state): ${input.prototypeUrl}`,
    input.baselineUrl && !useCodebase ? `Baseline URL (the BEFORE state): ${input.baselineUrl}` : "",
    diffSummary ? `\nBefore/after diff (authoritative — visual + code, BEFORE=baseline, AFTER=prototype):\n${diffSummary}\n` : "",
    useCodebase ? "Current source code (the BEFORE state) is available via the readCodebase tool." : "",
    "",
    `Designer's note about what changed and why:`,
    input.note || "(none provided — infer conservatively)",
    "",
    "Produce the change brief now.",
  ]
    .filter(Boolean)
    .join("\n");

  // Object generation on a large schema is occasionally non-deterministic; retry
  // only on that specific failure (rethrow anything else immediately).
  let output: unknown;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      ({ output } = await agent.generate({ prompt: promptText }));
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      const err = e as { name?: string; finishReason?: string };
      console.error(`[understand] attempt ${attempt} failed:`, { name: err?.name, finishReason: err?.finishReason });
      // Retry ONLY the transient truncated-JSON failure. "No output" means the
      // step cap was hit before emitting — retrying re-runs the whole loop and
      // just doubles latency; the fix for that is the larger stepCount budget.
      if (err?.name !== "AI_NoObjectGeneratedError") throw e;
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
      "You are producing structured content for ONE Ideagen slide, built on the master deck template.",
      "Follow the spec's voice and rules. Pick the template and the single best hero screenshot.",
      "",
      "### Product context",
      opts.productContext,
      "",
      "### Spec",
      specText,
      opts.examples ? `\n### Reference voice\n${opts.examples}` : "",
    ].join("\n"),
    prompt: [
      "Change brief (source of truth):",
      JSON.stringify(opts.brief, null, 2),
      "",
      "Available captured screenKeys for picScreenKey (choose the single best hero, or empty string if none fits):",
      keys,
    ].join("\n"),
  });

  const slideSpec = object as SlideSpec;
  // Guardrail: the model can hallucinate a screenKey. Force picScreenKey to a real
  // captured key so the deck exporter reliably finds the hero (best available if
  // the model's choice doesn't exist; empty only when nothing was captured).
  const validKeys = new Set(usable.map((c) => c.screenKey));
  if (slideSpec.picScreenKey && !validKeys.has(slideSpec.picScreenKey)) {
    slideSpec.picScreenKey = usable[0]?.screenKey ?? "";
  }
  const content = [
    `**${slideSpec.title}**`,
    "",
    slideSpec.subtitle,
    "",
    slideSpec.picScreenKey ? `_Hero image: \`${slideSpec.picScreenKey}\`_` : "_No hero image_",
    `_Template: ${slideSpec.template} · ${slideSpec.attribution}_`,
    "",
    `> **Speaker notes:** ${slideSpec.notes}`,
  ].join("\n");
  return { audienceId: "slide", label: "Slide", content, slideSpec };
}

// The coded developer artifact: a real, DS-grounded starting-point component in
// the chosen framework (Vue by default). Separate from the dev handoff SPEC — the
// designer asked for both. Injects the design-system reference so imports/tokens
// are real, not invented.
async function generateCode(opts: {
  brief: ChangeBrief;
  productContext: string;
  dsReference: string;
  codeSpecText: string;
  framework: string;
  focus?: string;
}): Promise<Artifact> {
  const { text } = await generateText({
    model: MODEL_GENERATE,
    maxOutputTokens: 8000,
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
    ].join("\n"),
    prompt: [
      opts.focus
        ? `Implement this component: ${opts.focus}. It is the change's primary net-new UI.`
        : "Implement the change's primary new/changed UI as a single focused component.",
      "Use this change brief as the source of truth:",
      "",
      JSON.stringify(opts.brief, null, 2),
    ].join("\n"),
  });
  return {
    audienceId: "dev-code",
    label: `Developer component code (${opts.framework})`,
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

// ── The harness loop ─────────────────────────────────────────────────────────
// Understand → fan out to every audience → stream each artifact as it lands.
// Review + distribute happen in the UI (human in the loop).
export async function* runPipeline(input: {
  prototypeUrl: string;
  note: string;
  baselineUrl?: string;
  codebasePath?: string;
  framework?: string;
  enabledOutputs?: string[];
  subject?: string;
  componentSelector?: string;
}): AsyncGenerator<PipelineEvent> {
  // Which artifact types to produce. Empty/undefined = all. Component specs are
  // gated under "design-system" since they're a design-system deliverable.
  const enabled = input.enabledOutputs?.length ? new Set(input.enabledOutputs) : null;
  const wants = (id: string) => !enabled || enabled.has(id);
  const basis = input.codebasePath
    ? "against the current codebase"
    : input.baselineUrl
      ? "against the baseline URL"
      : "from the note (no baseline — inferred)";
  yield { type: "status", stage: "understand", message: `Building the change brief, diffing ${basis}…` };
  const brief = await understand(input);
  yield { type: "brief", brief };

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
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    captures = await captureScreens({ prototypeUrl: input.prototypeUrl, manifest, runId, defaultSelector: input.componentSelector });
    yield { type: "captures", captures };
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
  const productContext = await readReferenceDoc("product");
  // Artifacts that embed real screenshots inline (prose formats). The slide
  // references screenKeys instead and the deck exporter places the images.
  const IMAGE_ARTIFACTS = new Set(["case-study", "one-pager"]);
  const genJob = (j: { id: string; label: string; specText: string; focus?: string }) =>
    guard(
      (async () =>
        generate({
          ...j,
          brief,
          productContext,
          examples: await readExamples(j.id),
          captures: IMAGE_ARTIFACTS.has(j.id) ? captures : undefined,
        }))(),
      j.id,
      j.label,
    );

  // Warm the shared prompt cache (product context + brief) with the FIRST
  // generator, then fan the rest out concurrently so they READ that cache rather
  // than re-sending it at full price. Concurrent requests can't read a cache
  // that's still being written, so the first must land before the others fire.
  const framework = input.framework || "vue";
  const promises: Promise<Artifact>[] = [];
  if (jobs.length) {
    const [firstJob, ...restJobs] = jobs;
    yield { type: "artifact", artifact: await genJob(firstJob) };
    promises.push(...restJobs.map(genJob));
  }
  // The slide's dedicated structured generator, streamed alongside the rest.
  if (wants("slide")) {
    promises.push(
      guard(
        (async () => generateSlide({ brief, productContext, examples: await readExamples("slide"), captures }))(),
        "slide",
        "Slide",
      ),
    );
  }
  // The coded developer artifact (framework-parameterized; Vue default), grounded
  // in the design-system reference and focused on the primary net-new component.
  if (wants("dev-code")) {
    promises.push(
      guard(
        (async () => {
          const dsReference = await readReferenceDoc("design-system");
          const { text: codeSpecText } = await readCodeSpec(framework);
          return generateCode({ brief, productContext, dsReference, codeSpecText, framework, focus: newComponents[0]?.name });
        })(),
        "dev-code",
        `Developer component code (${framework})`,
      ),
    );
  }
  for await (const artifact of asCompleted(promises)) {
    yield { type: "artifact", artifact };
  }

  yield { type: "done" };
}
