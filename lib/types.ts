import { z } from "zod";

// ── Shared sub-schemas ───────────────────────────────────────────────────────
// Reused by BOTH canonical objects — the Change Brief (compare mode) and the
// Design Spec (spec mode). Keeping these single-sourced guarantees the two modes
// produce identical shapes for the fields the downstream stages depend on — most
// importantly `visualManifest`, which the capture stage reads verbatim.

// One core use case: who, when, and a concrete example.
export const UseCaseSchema = z.object({
  persona: z.string().describe("Who — a role from the product context where possible"),
  scenario: z.string().describe("The real situation in which they hit this"),
  example: z.string().describe("A concrete, plausible walked-through example"),
});

// One view/state worth screenshotting, plus the actions to drive the prototype
// into that state. Drives the capture stage identically in both modes.
export const VisualManifestEntrySchema = z.object({
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
  actions: z
    .array(
      z.object({
        do: z
          .enum(["click", "setViewport", "wait"])
          .describe("The interaction to perform before capturing this screen"),
        target: z
          .string()
          .optional()
          .describe(
            "For 'click': the visible label/text of the control to click (e.g. 'Cards', 'Calendar') OR a CSS selector.",
          ),
        width: z
          .number()
          .optional()
          .describe("For 'setViewport': viewport width in px (e.g. 480 mobile, 834 tablet, 1440 desktop)."),
        height: z
          .number()
          .optional()
          .describe("For 'setViewport': viewport height in px (e.g. 900)."),
        ms: z.number().optional().describe("For 'wait': milliseconds to wait."),
      }),
    )
    .describe(
      "Ordered steps to drive the prototype into THIS state before the screenshot (e.g. click the 'Cards' toggle; set a narrow viewport for a mobile/drawer state). Empty for the default landing state. Prefer clicking by the control's VISIBLE TEXT, and use setViewport for responsive/size-dependent states.",
    ),
});

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
        .enum(["codebase-diff", "url-diff", "image-diff", "inferred"])
        .describe(
          "How 'what changed' was established: compared against the current source code, against a baseline URL, against an uploaded baseline screenshot (visual only), or inferred from the note + knowledge with NO baseline",
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
    .array(UseCaseSchema)
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
    .array(VisualManifestEntrySchema)
    .describe(
      "The views worth capturing, with captions and annotation callouts. Drives the screenshot stage and feeds the case study, one-pager, and slide. Order by narrative importance.",
    ),
});

export type ChangeBrief = z.infer<typeof ChangeBriefSchema>;

// ── Run mode ─────────────────────────────────────────────────────────────────
// "compare" = the original before/after change analysis (Change Brief).
// "spec"    = document a design in itself, no baseline (Design Spec).
export type RunMode = "compare" | "spec";
// In spec mode, whether we're documenting a single component/screen or a whole
// multi-screen product/flow.
export type SpecScope = "component" | "product";

// ── The Design Spec (canonical understanding for SPEC mode) ───────────────────
// The standalone counterpart to the Change Brief: a thorough, self-contained
// specification of a design as it IS — no before/after, no diff. Produced by the
// Understand stage's specify() path and fanned out to the spec-mode audiences.
// Shares the downstream-critical shapes (useCases, visualManifest) with the
// Change Brief. See specs/design-spec.md for the human-readable version.

// One documented component within a screen: what it is and how it behaves,
// generalized enough to hand to a DS/eng team.
export const ComponentDocSchema = z.object({
  name: z.string().describe("The component's name (a DS name where one fits, else a descriptive one)"),
  role: z.string().describe("What it is and the job it does in this screen"),
  variants: z.array(z.string()).describe("Meaningful variations, if any (empty if none)"),
  states: z
    .array(z.string())
    .describe("States it exhibits — default/hover/focus/active/disabled/error/empty/loading as applicable"),
  tokens: z
    .array(z.string())
    .describe("Design-system tokens it consumes — the CSS custom properties/DS token names seen in the markup, not raw hex"),
});

// One documented screen/view. For component scope there is a single entry; for
// product scope there is one per discovered screen.
export const ScreenDocSchema = z.object({
  key: z.string().describe("Short stable label for the screen, e.g. 'incident-list'"),
  label: z.string().describe("Human name for the screen"),
  url: z.string().describe("The screen's URL if known; empty string otherwise"),
  purpose: z.string().describe("What this screen is for and where it sits in the product"),
  anatomy: z
    .array(z.string())
    .describe("The screen's regions/structure, top to bottom — its layout and hierarchy"),
  components: z.array(ComponentDocSchema).describe("Every notable component on this screen"),
  interactions: z
    .array(
      z.object({
        trigger: z.string().describe("The control/gesture that starts it (use the EXACT visible label)"),
        behavior: z.string().describe("What happens — the interaction and any transition"),
        outcome: z.string().describe("The resulting state or result the user ends up in"),
      }),
    )
    .describe("The screen's interactions: trigger → behavior → outcome. Cover every meaningful control."),
  states: z
    .array(
      z.object({
        name: z.string().describe("State name, e.g. 'default', 'empty', 'loading', 'error', 'no results'"),
        description: z.string().describe("What the screen looks like / does in this state"),
      }),
    )
    .describe("The screen's distinct states, exhaustively — default plus empty/loading/error/edge as applicable"),
  contentModel: z
    .array(
      z.object({
        field: z.string().describe("A piece of data/content shown on the screen"),
        format: z.string().describe("Its format/shape (e.g. date, status enum, free text, currency)"),
        source: z.string().describe("Where it comes from if inferable (module/entity); else 'unknown'"),
      }),
    )
    .describe("The data/content the screen presents — fields, their formats, and likely sources"),
  responsive: z
    .array(z.string())
    .describe("How the screen adapts across breakpoints (what reflows/collapses/hides, and at roughly what widths)"),
  accessibility: z
    .array(z.string())
    .describe("Accessibility facts for this screen — roles, keyboard operation, focus order, aria, contrast (WCAG 2.2)"),
});

export const DesignSpecSchema = z.object({
  title: z.string().describe("Short name of the design being specified"),
  oneLiner: z.string().describe("The design in a single sentence"),
  scope: z
    .enum(["component", "product"])
    .describe("Whether this documents a single component/screen or a whole multi-screen product/flow"),
  overview: z
    .object({
      purpose: z.string().describe("What this design is for — the problem it solves and what it enables"),
      audience: z.string().describe("Who uses it — the primary roles/personas"),
      whereItLives: z.string().describe("Where it sits in the product — module(s), entry points, context"),
    })
    .describe("The high-level framing of the design"),
  screens: z
    .array(ScreenDocSchema)
    .describe(
      "The documented screens. For component scope this is a SINGLE entry (the component/screen). For product scope, one entry per discovered screen, in a sensible reading order.",
    ),
  flows: z
    .array(
      z.object({
        name: z.string().describe("The flow's name, e.g. 'Report a new incident'"),
        steps: z.array(z.string()).describe("The ordered steps across screens, referencing screen keys/labels"),
      }),
    )
    .describe("Cross-screen user flows. Empty for component scope; for product scope, the key journeys through the screens."),
  designTokens: z
    .array(
      z.object({
        category: z.string().describe("Token category — colour / spacing / type / radius / elevation / motion"),
        notes: z.string().describe("The concrete tokens observed in this category and how they're applied"),
      }),
    )
    .describe("The design tokens the design actually uses, by category — expressed as DS token names, not raw values"),
  accessibilitySummary: z
    .array(z.string())
    .describe("Cross-cutting accessibility characteristics and obligations spanning the whole design (WCAG 2.2)"),
  useCases: z
    .array(UseCaseSchema)
    .describe("Core use cases with concrete examples. Feeds product documentation and the support summary."),
  openQuestions: z
    .array(z.string())
    .describe("Anything that could NOT be determined from the prototype. Never guess — put uncertainty here."),
  visualManifest: z
    .array(VisualManifestEntrySchema)
    .describe(
      "Every meaningful view/state worth capturing across the design. Drives the screenshot stage. In spec mode, be COMPREHENSIVE — enumerate distinct states, not just a hero shot.",
    ),
});

export type DesignSpec = z.infer<typeof DesignSpecSchema>;

// Structured content for the deck exporter. The slide artifact emits this
// (validated) instead of free markdown, so the single Ideagen "Blanks - Blank 1"
// layout can be filled reliably: title + subtitle top-left, bulleted callouts
// down the left column, and one-to-three showcase images down the right column.
export const SlideSpecSchema = z.object({
  title: z.string().describe("The change's headline, ≤ ~6 words (e.g. 'Toolbar Styling Updates')"),
  subtitle: z
    .string()
    .describe("One supporting sentence capturing the essence of the change, ≤ ~18 words"),
  callouts: z
    .array(z.string())
    .describe(
      "3–7 short bullet callouts for the left column — the specific highlights of the change, each ≤ ~12 words. No sentences-as-paragraphs.",
    ),
  images: z
    .array(
      z.object({
        screenKey: z
          .string()
          .describe("screenKey of a captured screenshot to show on the right (must be one that was captured)"),
        label: z
          .string()
          .describe("Short label shown above the image, e.g. 'Light mode' / 'Dark mode'; empty string for none"),
      }),
    )
    .describe(
      "1–3 showcase screenshots for the right column, ordered top→bottom. Pick the frames that best show the new design; prefer distinct states (e.g. light vs dark, default vs menu-open).",
    ),
  notes: z.string().describe("2–3 sentence speaker note"),
});
export type SlideSpec = z.infer<typeof SlideSpecSchema>;

// The bridge between the analytics plan and the coded component. The analytics
// stage decides which UI elements must be observable in Gainsight PX and assigns
// each a stable `data-id`; the analytics-plan artifact documents these, and the
// generated component wires the SAME data-ids into its markup so PX has a unique
// selector to attach to. One source of truth → the two always agree.
export const InstrumentationPlanSchema = z.object({
  points: z
    .array(
      z.object({
        dataId: z
          .string()
          .describe(
            "The unique data-id attribute VALUE to attach to the element for Gainsight to select on. kebab-case, prefixed by the component (e.g. 'search-toolbar-cards-view'). Must be stable and unique across the component.",
          ),
        element: z
          .string()
          .describe(
            "The specific UI control/element to instrument, described precisely enough to locate it in the markup (e.g. 'the Cards view-mode toggle button').",
          ),
        event: z
          .enum(["click", "view", "change", "submit", "hover"])
          .describe("The interaction Gainsight PX should observe on this element."),
        metric: z
          .string()
          .describe("Which success metric or intended outcome (from the brief) this instrumentation serves."),
        note: z.string().describe("What this measures and why it matters — one line."),
      }),
    )
    .describe(
      "The elements to instrument with data-ids so Gainsight PX can observe them. Only what a metric actually needs — typically 3–8 points, not every element.",
    ),
});
export type InstrumentationPlan = z.infer<typeof InstrumentationPlanSchema>;

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
  slideSpec?: SlideSpec; // set only for the slide artifact — drives the deck exporter
};

// One captured screenshot (or a placeholder when capture wasn't possible),
// derived from a visualManifest entry.
export type Capture = {
  screenKey: string;
  caption: string;
  annotations: string[];
  ok: boolean;
  url?: string; // served path when ok, e.g. /captures/<runId>/<screenKey>.png
  note?: string; // why it failed / was skipped, when !ok
};

// Events streamed from the pipeline to the review UI (one JSON object per line).
export type PipelineEvent =
  | { type: "status"; stage: string; message: string }
  // Fine-grained narration for the live activity feed (e.g. each tool the
  // Understand agent calls). Distinct from `status` (which drives the spinner).
  | { type: "activity"; message: string; kind?: string }
  // The discovered/scoped screen map for a large multi-screen prototype. Emitted
  // before the brief so the UI can show how the app was decomposed and which
  // screens were pruned as unchanged (delta-scoping).
  | {
      type: "screenmap";
      method: string;
      discovered: number;
      scoped: number;
      screens: { key: string; label: string; url: string }[];
      note: string;
    }
  | { type: "brief"; brief: ChangeBrief }
  // The canonical understanding in SPEC mode (parallel to `brief`).
  | { type: "spec"; spec: DesignSpec }
  | { type: "captures"; captures: Capture[] }
  | { type: "instrumentation"; plan: InstrumentationPlan }
  | { type: "artifact"; artifact: Artifact }
  | { type: "done"; savedRunId?: string; project?: string; durationMs?: number }
  | { type: "error"; message: string };

// A generated run, persisted to the local library for later reference/comparison.
export type StoredRunMeta = {
  id: string;
  version: string; // APP_VERSION that produced it
  createdAt: string; // ISO
  project: { id: string; name: string };
  title: string; // brief/spec title
  mode?: RunMode; // "compare" (default when absent, for old runs) | "spec"
  prototypeUrl?: string;
  baselineUrl?: string;
  subject?: string;
  artifactCount: number;
  captureCount: number;
  durationMs?: number; // wall-clock time the run took to generate
};
export type StoredRun = StoredRunMeta & {
  input: {
    prototypeUrl?: string;
    baselineUrl?: string;
    framework?: string;
    subject?: string;
    componentSelector?: string;
    designDescription?: string;
    projectContext?: string;
    focusAreas?: string;
    designDecisions?: string;
    enabledOutputs?: string[];
  };
  // Exactly one of these is set, per `mode`. `brief` for compare, `spec` for spec.
  // `brief` is optional now; old runs (pre-spec-mode) always have it.
  brief?: ChangeBrief;
  spec?: DesignSpec;
  captures: Capture[];
  artifacts: Artifact[];
  instrumentation: InstrumentationPlan | null;
};
