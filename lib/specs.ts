import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// Spec files live in /specs and are read at runtime. next.config.js traces them
// into the serverless bundle so this works on Vercel too.
const SPECS_DIR = join(process.cwd(), "specs");
const EXAMPLES_DIR = join(SPECS_DIR, "examples");

export async function readChangeBriefGuidance(): Promise<string> {
  return readFile(join(SPECS_DIR, "change-brief.md"), "utf8");
}

export async function readAudienceSpec(specFile: string): Promise<string> {
  return readFile(join(SPECS_DIR, "audiences", specFile), "utf8");
}

export async function readComponentSpecTemplate(): Promise<string> {
  return readFile(join(SPECS_DIR, "component-spec.md"), "utf8");
}

// Framework-specific code-target spec (specs/code/<framework>.md). Falls back to
// Vue — the only target with a design-system mapping today — with a note when an
// unsupported framework is requested.
export async function readCodeSpec(framework: string): Promise<{ text: string; supported: boolean }> {
  const safe = framework.toLowerCase().replace(/[^a-z0-9-]/gi, "");
  try {
    return { text: await readFile(join(SPECS_DIR, "code", `${safe}.md`), "utf8"), supported: true };
  } catch {
    const vue = await readFile(join(SPECS_DIR, "code", "vue.md"), "utf8");
    return {
      text:
        `No code target is defined for "${framework}" yet, and the design-system mapping is Vue-specific. ` +
        `Produce ${framework} code on a best-effort basis, following the STRUCTURE below but translating idioms to ${framework}, ` +
        `and add a prominent TODO that a ${framework} design-system mapping is required before this is trustworthy.\n\n` +
        vue,
      supported: false,
    };
  }
}

// Real-world exemplars, staged per artifact under specs/examples/<dir>/. Injected
// as few-shot so voice-heavy artifacts match Ideagen's actual house style. Most
// artifacts read their own id's folder; a few borrow another's voice (below).
const EXAMPLE_DIRS: Record<string, string[]> = {
  // Exec-comms + narrative artifacts borrow the product-comms newsletter VOICE
  // (benefit-first, user-named) — we have no dedicated exemplar for them yet.
  "one-pager": ["product-comms"],
  slide: ["product-comms"],
  "case-study": ["product-comms"],
};

// Cap on total example text injected per artifact — one strong exemplar beats
// several diluted ones, and keeps token cost bounded.
const EXAMPLE_CHAR_BUDGET = 7000;

function stripLeadingComment(md: string): string {
  return md.replace(/^\s*<!--[\s\S]*?-->\s*/, "").trim();
}

// Returns few-shot exemplar text for an artifact, or "" if none are staged.
// Files are added in filename order, skipping any that would blow the budget
// (so a small primary example is preferred over a large secondary one).
export async function readExamples(artifactId: string): Promise<string> {
  const dirs = EXAMPLE_DIRS[artifactId] ?? [artifactId];
  const chosen: string[] = [];
  let used = 0;
  for (const dir of dirs) {
    let files: string[];
    try {
      files = (await readdir(join(EXAMPLES_DIR, dir))).filter((f) => f.endsWith(".md")).sort();
    } catch {
      continue; // no folder for this artifact — fine
    }
    for (const file of files) {
      const body = stripLeadingComment(await readFile(join(EXAMPLES_DIR, dir, file), "utf8"));
      if (!body) continue;
      if (used + body.length > EXAMPLE_CHAR_BUDGET) continue; // skip, try smaller ones
      chosen.push(body);
      used += body.length;
    }
  }
  return chosen.join("\n\n---\n\n");
}

// Reference docs the Understand agent can pull in via the read_reference tool
// (e.g. the design-system reference). Returns a friendly note if absent, so the
// agent degrades gracefully rather than erroring.
export async function readReferenceDoc(name: string): Promise<string> {
  const safe = name.replace(/[^a-z0-9-]/gi, "");
  try {
    return await readFile(join(SPECS_DIR, "references", `${safe}.md`), "utf8");
  } catch {
    return `No reference document named "${name}" is available. Proceed without it and note any resulting uncertainty in openQuestions.`;
  }
}
