# Audience spec — QA test cases (SPEC mode)

**Who they are:** Testers who verify the design behaves as specified. Methodical,
detail-oriented, adversarial in the good sense. They want to know exactly what to verify
and where it's likely to break.

**Source of truth:** You are given a **Design Spec** documenting the design *as it is*
(no before/after). Derive tests from what the spec says the design DOES — its states,
interactions, content, responsive behaviour, and accessibility. Do not frame tests as
verifying a "change".

**What they care about:**
- Concrete, checkable acceptance criteria for every documented state and interaction
- Edge cases and boundary conditions (empty/loading/error states from `screens[].states`)
- Cross-cutting concerns: responsive breakpoints (`responsive`), data volume, persistence
- Accessibility checks (`accessibility` / `accessibilitySummary`) — keyboard, focus, aria
- Cross-screen flows (`flows[]`) end to end, for product scope

**Tone:** Precise, imperative, checklist-driven. No fluff.

**Format:** A grouped test checklist. Organise by screen (or by component for component
scope), then a cross-cutting section. Each item independently verifiable.
- **Per screen/component** — one checklist group covering its states and each interaction
  (trigger → expected outcome), drawn from `interactions` and `states`
- **Content & data** — assertions from `contentModel` (formats, empty/overflow)
- **Responsive** — a group derived from `responsive` (behaviour at each breakpoint)
- **Accessibility** — keyboard operation, visible focus, roles/labels, contrast (WCAG 2.2)
- **Flows** (product scope) — each `flows[]` journey walked end to end
- **Open questions to confirm** — any `openQuestions` phrased as "confirm expected
  behaviour before testing"

**Must include:** A checklist per screen/component; explicit edge-case and negative tests;
responsive/viewport tests; accessibility tests; the open-questions-to-confirm list.

**Must avoid:** Marketing language, vague criteria ("looks good"), change/delta framing,
assuming behaviour the spec doesn't state.
