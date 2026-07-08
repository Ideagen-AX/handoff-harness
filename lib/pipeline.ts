import { ToolLoopAgent, Output, generateText, stepCountIs } from "ai";
import { MODEL_UNDERSTAND, MODEL_GENERATE } from "./model";
import { ChangeBriefSchema, type ChangeBrief, type PipelineEvent, type Artifact } from "./types";
import { fetchPrototype, readReference } from "./tools";
import { readAudienceSpec, readChangeBriefGuidance, readComponentSpecTemplate, readReferenceDoc } from "./specs";
import { AUDIENCES } from "./audiences";

// ── Stage 1: UNDERSTAND ──────────────────────────────────────────────────────
// A real tool-loop agent: it fetches the prototype, optionally reads the
// design-system reference, then emits the structured Change Brief.
async function understand(input: {
  prototypeUrl: string;
  note: string;
}): Promise<ChangeBrief> {
  const guidance = await readChangeBriefGuidance();

  const agent = new ToolLoopAgent({
    model: MODEL_UNDERSTAND,
    tools: { fetchPrototype, readReference },
    stopWhen: stepCountIs(8),
    output: Output.object({ schema: ChangeBriefSchema }),
    instructions: [
      "You are a senior product designer preparing a design-handoff change brief.",
      "Process: (1) call fetchPrototype on the given URL; (2) call readReference('product') for product context and correct terminology; (3) call readReference('design-system') to ground component impact in the real component library; (4) produce the structured change brief.",
      "For componentImpact, check the design-system reference before deciding: prefer 'used-as-is' or 'extended' when the library already offers a fitting component. Reserve 'net-new' for genuine gaps.",
      "Be concrete and factual. Never invent behavior you cannot verify — put genuine uncertainty in openQuestions instead of guessing.",
      "",
      "Follow this brief specification:",
      guidance,
    ].join("\n"),
  });

  const { output } = await agent.generate({
    prompt: [
      `Prototype URL: ${input.prototypeUrl}`,
      "",
      `Designer's note about what changed and why:`,
      input.note || "(none provided — infer conservatively from the prototype)",
      "",
      "Produce the change brief now.",
    ].join("\n"),
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
  focus?: string;
}): Promise<Artifact> {
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
}): AsyncGenerator<PipelineEvent> {
  yield { type: "status", stage: "understand", message: "Reading the prototype and building the change brief…" };
  const brief = await understand(input);
  yield { type: "brief", brief };

  // Build the generation jobs: the 5 comms audiences + the developer handoff…
  const jobs: Array<{ id: string; label: string; specText: string; focus?: string }> = [];
  for (const a of AUDIENCES) {
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
  const promises = jobs.map((j) => generate({ ...j, brief, productContext }));
  for await (const artifact of asCompleted(promises)) {
    yield { type: "artifact", artifact };
  }

  yield { type: "done" };
}
