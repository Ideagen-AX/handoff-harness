import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Spec files live in /specs and are read at runtime. next.config.js traces them
// into the serverless bundle so this works on Vercel too.
const SPECS_DIR = join(process.cwd(), "specs");

export async function readChangeBriefGuidance(): Promise<string> {
  return readFile(join(SPECS_DIR, "change-brief.md"), "utf8");
}

export async function readAudienceSpec(specFile: string): Promise<string> {
  return readFile(join(SPECS_DIR, "audiences", specFile), "utf8");
}

export async function readComponentSpecTemplate(): Promise<string> {
  return readFile(join(SPECS_DIR, "component-spec.md"), "utf8");
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
