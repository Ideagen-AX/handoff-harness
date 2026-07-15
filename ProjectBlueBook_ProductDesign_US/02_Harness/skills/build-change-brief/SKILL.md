# Skill: Build the Change Brief

The harness's foundational skill — it turns a finished prototype into the one
structured understanding every other artifact is generated from. (Instructions:
`specs/change-brief.md`; schema: `lib/types.ts` → `ChangeBriefSchema`.)

- **What recurring work it automates:** Working out — and writing down — *what actually
  changed* in a design and why. A designer normally reconstructs this from memory for
  every downstream doc; here it's done once, verifiably, per change. Ran on **every UX
  change** handed off (multiple times a sprint).
- **Trigger / how it's invoked:** The **Understand** stage of the run, kicked off when the
  designer clicks **Generate handoff**. Runs as a tool-loop agent.
- **Inputs it expects:** a prototype URL (the "after"); a short structured designer note
  (what it is, context, focus areas, key decisions); an optional baseline (a codebase
  path *or* a baseline URL); an optional subject + component CSS selector; the product
  and design-system reference docs (read via tools).
- **What it produces:** one validated **Change Brief** JSON — title, whatChanged,
  before/after, componentImpact (used-as-is / extended / net-new), decisionLog,
  intendedOutcomes, successMetrics, useCases, a `visualManifest` (which screens to
  capture + the clicks/viewports to reach them), openQuestions, and a `changeBasis`
  (computed vs inferred). It is shown in the UI as the run's source of truth.
- **Guardrail pairing:** The brief is **reviewed before anything is generated from it**.
  It carries a *computed vs inferred* badge; the agent will not claim a codebase diff it
  couldn't perform, and every inference is listed in `openQuestions`.
