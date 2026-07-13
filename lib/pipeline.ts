import { ToolLoopAgent, Output, generateText, generateObject, stepCountIs, type ToolSet } from "ai";
import { MODEL_UNDERSTAND, MODEL_GENERATE } from "./model";
import { ChangeBriefSchema, SlideSpecSchema, type ChangeBrief, type PipelineEvent, type Artifact, type Capture, type SlideSpec } from "./types";
import { stat } from "node:fs/promises";
import { fetchPrototype, readReference, makeCodebaseTool } from "./tools";
import { captureScreens } from "./capture";
import { readAudienceSpec, readChangeBriefGuidance, readComponentSpecTemplate, readReferenceDoc, readExamples } from "./specs";
import { AUDIENCES } from "./audiences";

// ── Stage 1: UNDERSTAND ──────────────────────────────────────────────────────
// A real tool-loop agent: it fetches the prototype, optionally reads the
// design-system reference, then emits the structured Change Brief.
async function understand(input: {
  prototypeUrl: string;
  note: string;
  baselineUrl?: string;
  codebasePath?: string;
}): Promise<ChangeBrief> {
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

  const tools: ToolSet = { fetchPrototype, readReference };
  if (useCodebase) tools.readCodebase = makeCodebaseTool(input.codebasePath!);

  let basisInstruction: string;
  if (useCodebase) {
    basisInstruction =
      "BASELINE: the current source code is available via readCodebase (the 'before'). Explore it — list directories, then read the files that implement the affected area — then diff it against the prototype to determine what ACTUALLY changed. Set changeBasis.method = 'codebase-diff'.";
  } else if (input.baselineUrl) {
    basisInstruction = `BASELINE: a baseline URL of the current state is provided. Call fetchPrototype on it (${input.baselineUrl}) as the 'before', then diff against the prototype. Set changeBasis.method = 'url-diff'.`;
  } else {
    basisInstruction =
      "BASELINE: none provided. Infer what changed from the designer's note plus product/design-system knowledge, and set changeBasis.method = 'inferred'. State clearly in changeBasis.note AND in openQuestions that whatChanged/beforeAfter are inferred and must be verified against the real prior state.";
  }

  const agent = new ToolLoopAgent({
    model: MODEL_UNDERSTAND,
    tools,
    stopWhen: stepCountIs(useCodebase ? 18 : 8),
    output: Output.object({ schema: ChangeBriefSchema }),
    instructions: [
      "You are a senior product designer preparing a design-handoff change brief.",
      "Process: (1) call fetchPrototype on the prototype URL (the AFTER state); (2) call readReference('product'); (3) call readReference('design-system'); (4) establish the baseline per the BASELINE instruction below; (5) produce the structured change brief.",
      basisInstruction,
      "For componentImpact, check the design-system reference before deciding: prefer 'used-as-is' or 'extended' when the library already offers a fitting component. Reserve 'net-new' for genuine gaps.",
      "Populate the downstream-feeding fields deliberately: decisionLog (the reasoning trail — decisions, rationale, alternatives, honest tradeoffs), intendedOutcomes + successMetrics (what success looks like and how it could be measured in Gainsight), useCases (persona + scenario + concrete example), and visualManifest (the views worth capturing, each with a caption and annotation callouts, ordered by narrative importance).",
      "Be concrete and factual. Never invent behavior you cannot verify — put genuine uncertainty in openQuestions instead of guessing. Where you must infer a decision or metric that the inputs don't state, still flag it in openQuestions.",
      "",
      "Follow this brief specification:",
      guidance,
    ].join("\n"),
  });

  const { output } = await agent.generate({
    prompt: [
      `Prototype URL (the AFTER state): ${input.prototypeUrl}`,
      input.baselineUrl && !useCodebase ? `Baseline URL (the BEFORE state): ${input.baselineUrl}` : "",
      useCodebase ? "Current source code (the BEFORE state) is available via the readCodebase tool." : "",
      "",
      `Designer's note about what changed and why:`,
      input.note || "(none provided — infer conservatively)",
      "",
      "Produce the change brief now.",
    ]
      .filter(Boolean)
      .join("\n"),
  });

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
  const { text } = await generateText({
    model: MODEL_GENERATE,
    system: [
      "You are drafting one design-handoff artifact for a single, specific audience or purpose.",
      "Follow the spec below exactly — its voice, format, length, must-include, and must-avoid.",
      "Use correct product terminology from the product context. Output ONLY the finished artifact as clean Markdown. No preamble, no meta commentary.",
      "",
      "### Product context (shared — use for accurate framing and terminology)",
      opts.productContext,
      "",
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
    ].join("\n"),
    prompt: [
      opts.focus ? `This artifact must focus ONLY on: ${opts.focus}` : `Write the artifact for: ${opts.label}.`,
      "Use this change brief as the single source of truth:",
      "",
      JSON.stringify(opts.brief, null, 2),
    ].join("\n"),
  });
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

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
}): AsyncGenerator<PipelineEvent> {
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
    captures = await captureScreens({ prototypeUrl: input.prototypeUrl, manifest, runId });
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
    jobs.push({ id: a.id, label: a.label, specText: await readAudienceSpec(a.specFile) });
  }
  jobs.push({ id: "dev", label: "Developer handoff", specText: await readAudienceSpec("dev.md") });

  // …plus the conditional offshoot: one component spec per net-new component.
  const newComponents = brief.componentImpact.filter((c) => c.disposition === "net-new");
  if (newComponents.length) {
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

  yield {
    type: "status",
    stage: "generate",
    message: `Drafting ${jobs.length} artifacts in parallel…`,
  };
  const productContext = await readReferenceDoc("product");
  // Artifacts that embed real screenshots inline (prose formats). The slide
  // references screenKeys instead and the deck exporter places the images.
  const IMAGE_ARTIFACTS = new Set(["case-study", "one-pager"]);
  const promises = jobs.map(async (j) =>
    generate({
      ...j,
      brief,
      productContext,
      examples: await readExamples(j.id),
      captures: IMAGE_ARTIFACTS.has(j.id) ? captures : undefined,
    }),
  );
  // The slide's dedicated structured generator, streamed alongside the rest.
  promises.push(
    (async () =>
      generateSlide({
        brief,
        productContext,
        examples: await readExamples("slide"),
        captures,
      }))(),
  );
  for await (const artifact of asCompleted(promises)) {
    yield { type: "artifact", artifact };
  }

  yield { type: "done" };
}
