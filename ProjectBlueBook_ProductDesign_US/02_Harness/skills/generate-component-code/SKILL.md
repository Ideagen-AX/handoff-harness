# Skill: Generate a starting-point component

Turns the Change Brief into a real, design-system-grounded starting component in the
target's framework — code a developer can pick up rather than rebuild from a
screenshot. (Instructions: `specs/code/miramar.md` for the production Vue/Vuetify
target, `specs/code/vue.md` otherwise; grounded in the design-system reference.)

- **What recurring work it automates:** The developer's first hour on a handoff —
  translating a design into a plausible component skeleton in house style, with the right
  imports, tokens and analytics hooks. Ran **once per net-new / significantly-changed
  component**.
- **Trigger / how it's invoked:** Part of the fan-out when the **Coded component** output
  is selected; focuses on the primary net-new component the brief detected.
- **Inputs it expects:** the Change Brief; the chosen **design source** (Miramar
  Vue 3/Vuetify 3 production conventions, or the design-team DS) and its reference doc;
  the code-target spec; the instrumentation plan (Gainsight `data-id`s to wire in); and,
  when a local repo path is given, that repo's own conventions and ESLint.
- **What it produces:** a Markdown doc containing a single focused component (template +
  script + scoped style) using **real** DS components/tokens (never invented), with the
  planned analytics ids wired verbatim onto the right elements — plus, when the target
  repo's ESLint is available locally, a lint report appended so it meets the same gate
  the developers' own pipeline would apply.
- **Guardrail pairing:** Labelled explicitly a **starting point for a developer to
  review**, not shippable code. Grounded so it can't invent component or token names; the
  analytics ids it wires match the analytics-plan doc exactly (one authoritative plan);
  and it is linted against the real repo where possible so review is fast and honest.
