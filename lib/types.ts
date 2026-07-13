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
  changeBasis: z
    .object({
      method: z
        .enum(["codebase-diff", "url-diff", "inferred"])
        .describe(
          "How 'what changed' was established: compared against the current source code, against a baseline URL, or inferred from the note + knowledge with NO baseline",
        ),
      note: z
        .string()
        .describe(
          "One line on how the delta was determined and any caveats. If 'inferred', state plainly that whatChanged/beforeAfter are unverified.",
        ),
    })
    .describe("Provenance of the change analysis — lets the reviewer know how much to trust it"),
  whatChanged: z
    .array(z.string())
    .describe("Concrete, factual bullet list of what changed — no spin"),
  why: z.string().describe("The problem it solves / motivation"),
  decisionLog: z
    .array(
      z.object({
        decision: z.string().describe("A notable design or scope decision made"),
        rationale: z.string().describe("Why this choice was made"),
        alternativesConsidered: z
          .array(z.string())
          .describe("Other options weighed and set aside (empty if none)"),
        tradeoff: z
          .string()
          .describe("What was given up or deferred by choosing this — be honest"),
      }),
    )
    .describe(
      "The reasoning trail: decisions made along the way, why, and their tradeoffs. Feeds the narrative case study and developer handoff. If the note/inputs reveal no explicit decisions, infer the most likely ones and flag them in openQuestions.",
    ),
  intendedOutcomes: z
    .array(z.string())
    .describe(
      "What success looks like in plain terms — the user or business outcomes this change is meant to produce. Feeds the analytics plan.",
    ),
  successMetrics: z
    .array(
      z.object({
        metric: z.string().describe("A measurable indicator, e.g. 'time to file an incident'"),
        signal: z
          .string()
          .describe("The observable behavior/event that moves it (what to instrument)"),
        direction: z
          .enum(["increase", "decrease", "maintain"])
          .describe("The desired direction of movement"),
        target: z
          .string()
          .describe("A candidate target or threshold if one can be reasoned; else 'TBD'"),
      }),
    )
    .describe(
      "Candidate measurable signals for the analytics plan. Draft, not authoritative — the analyst refines. Prefer signals plausibly instrumentable in Gainsight PX (page/feature usage, adoption, funnels).",
    ),
  useCases: z
    .array(
      z.object({
        persona: z.string().describe("Who — a role from the product context where possible"),
        scenario: z.string().describe("The real situation in which they hit this"),
        example: z.string().describe("A concrete, plausible walked-through example"),
      }),
    )
    .describe(
      "Core use cases with concrete examples. Feeds product documentation and the support summary.",
    ),
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
  visualManifest: z
    .array(
      z.object({
        screenKey: z
          .string()
          .describe("Short stable label for the view/state, e.g. 'search-cards-view'"),
        caption: z.string().describe("One line describing what this view shows"),
        state: z
          .string()
          .describe("The specific state captured, e.g. 'default', 'empty', 'error', 'expanded'"),
        selector: z
          .string()
          .describe(
            "Optional CSS selector to scope the screenshot to one element; empty string for a full-page capture",
          ),
        annotations: z
          .array(z.string())
          .describe(
            "Ordered callouts to place beside the captured image — each points out one meaningful region or change",
          ),
      }),
    )
    .describe(
      "The views worth capturing, with captions and annotation callouts. Drives the screenshot stage and feeds the case study, one-pager, and slide. Order by narrative importance.",
    ),
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
