# 02 · Harness — Agents

The harness runs a single **loop** with one true tool-using agent at its head, then a
deterministic parallel fan-out. Both are defined in `lib/pipeline.ts`.

## Agent: Understand (the change-brief agent)

- **Job:** Turn a finished prototype into one canonical, structured **Change Brief** —
  the single source of truth every downstream artifact is generated from. It works out
  *what actually changed*, classifies the design-system impact, plans which screens are
  worth capturing (and the exact clicks/viewports to reach each state), and records the
  decision log, intended outcomes, success metrics, use cases and open questions.
- **Skills / tools it chains (in order):**
  1. `fetchPrototype` — read the hosted prototype (the AFTER state).
  2. `readReference('product')` — load EHSQ-E product context.
  3. `readReference('<design source>')` — load the chosen design system's components/tokens/conventions.
  4. `inspectPrototype` — read the prototype's **real** clickable control labels, so the capture actions target controls that actually exist.
  5. **Baseline step** — establishes the "before" in a strict order of preference: **codebase diff** (`readCodebase`, scoped read-only) → **URL diff** (screenshot + rendered-HTML comparison of before/after) → **inferred** (from the note + product knowledge, explicitly labelled *unverified*).
  6. Emits the structured Change Brief (validated against `ChangeBriefSchema`).
- **Autonomy:** Decides *without a human* which tools to call and how many times, how to
  interpret the diff, what to capture, and how to classify component impact. **Where a
  human steps in:** it never asserts a change as fact it couldn't verify — every brief
  carries a `changeBasis` badge (*computed* vs *inferred*), inferences go in
  `openQuestions`, and the whole brief is shown for review before anything is generated
  from it. It will not claim a codebase diff it didn't actually perform.
- **Runs on:** **Claude via the Vercel AI Gateway** (default `anthropic/claude-sonnet-5`;
  swappable to `anthropic/claude-opus-4.8` for deeper reasoning through the
  `HARNESS_MODEL_UNDERSTAND` env var). Implemented with the Vercel AI SDK
  `ToolLoopAgent`, in-process. Config: `lib/model.ts`, `lib/tools.ts`, `lib/pipeline.ts`.

## Agent: Fan-out generators (9 artifact drafters)

- **Job:** From the *one* approved understanding, draft every downstream artifact in
  parallel — each in its own voice, format and register: Design-System update,
  Product docs, Support/TAM summary, QA test cases, Release notes, Analytics & success
  plan, Executive 1-pager, Executive slide (`.pptx`), and a Case study. Plus two
  engineering outputs — a developer **handoff spec** and a **coded starting-point
  component** — and, conditionally, a **new-component spec** for every net-new component
  the brief detected.
- **Skills it chains:** each generator loads its audience spec (`specs/audiences/*.md`)
  as instructions, the shared product context, real house-style examples, and the
  relevant screenshots. Two specialised structured sub-agents run first when needed:
  an **instrumentation planner** (assigns Gainsight PX `data-id`s once, so the analytics
  doc and the coded component agree) and the **slide** generator (emits validated
  structured slide data the `.pptx` exporter fills). It *decides between* outputs via the
  user's output selection and the brief's content (e.g. a component spec is only produced
  when a net-new component exists).
- **Autonomy:** Decides wording, structure and which captured screens to embed. **Where a
  human steps in:** nothing is sent — all drafts land in the review UI for edit/approve;
  the coded component is explicitly a *starting point* for a developer to review and is
  linted against the target repo's own ESLint where available.
- **Runs on:** **Claude via the Vercel AI Gateway** (`anthropic/claude-sonnet-5`, via
  `HARNESS_MODEL_GENERATE`), Vercel AI SDK `generateText` / `generateObject`, staggered so
  they share one prompt cache. Config in `lib/pipeline.ts`, specs in `specs/`.

> This is a "we built the harness" submission: the loop, the tools, the structured
> hand-off contract (the Change Brief) and the guardrail (human review) are ours —
> we did not import an off-the-shelf agent framework.
