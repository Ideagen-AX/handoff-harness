import { z } from "zod";

// The Change Brief — the single canonical understanding produced by the
// Understand stage. Every audience artifact is generated from this, not from
// the raw prototype. Field docs guide the model; see specs/change-brief.md for
// the human-readable version.

export const ChangeBriefSchema = z.object({
  title: z.string().describe("Short name of the change"),
  oneLiner: z
    .string()
    .describe("The change in a single sentence; reused verbatim in release notes"),
  whatChanged: z
    .array(z.string())
    .describe("Concrete, factual bullet list of what changed — no spin"),
  why: z.string().describe("The problem it solves / motivation"),
  beforeAfter: z
    .array(
      z.object({
        before: z.string().describe("Prior behavior"),
        after: z.string().describe("New behavior"),
      }),
    )
    .describe("Paired before/after statements"),
  affectedAreas: z
    .array(z.string())
    .describe("Modules, screens, or flows this touches"),
  componentImpact: z
    .array(
      z.object({
        name: z.string().describe("The design-system component"),
        disposition: z
          .enum(["used-as-is", "extended", "net-new"])
          .describe(
            "'used-as-is' = existing component, no change; 'extended' = existing component pushed beyond its current variants/behavior; 'net-new' = no DS equivalent exists yet",
          ),
        detail: z
          .string()
          .describe("Why this disposition — what's used, stretched, or missing"),
      }),
    )
    .describe(
      "Per-component design-system impact. Include every component the change touches. 'net-new' entries drive the new-component offshoot.",
    ),
  userVisible: z
    .string()
    .describe("What an end user will actually notice"),
  risksEdgeCases: z
    .array(z.string())
    .describe("Where it could break or confuse users"),
  openQuestions: z
    .array(z.string())
    .describe(
      "Anything that could NOT be determined from the inputs. Never guess — put uncertainty here.",
    ),
  screens: z
    .array(z.string())
    .describe("Key views/states, labeled"),
});

export type ChangeBrief = z.infer<typeof ChangeBriefSchema>;

// One downstream audience the harness fans out to.
export type Audience = {
  id: string;
  label: string;
  specFile: string; // relative to specs/audiences/
};

// A generated, human-reviewable artifact for one audience.
export type Artifact = {
  audienceId: string;
  label: string;
  content: string; // Markdown
};

// Events streamed from the pipeline to the review UI (one JSON object per line).
export type PipelineEvent =
  | { type: "status"; stage: string; message: string }
  | { type: "brief"; brief: ChangeBrief }
  | { type: "artifact"; artifact: Artifact }
  | { type: "done" }
  | { type: "error"; message: string };
