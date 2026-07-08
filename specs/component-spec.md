# Template — New DS Component Spec (the "offshoot")

This artifact is generated automatically, once per `net-new` component the change brief
identifies. It's the starting point for the design-system offshoot: a definition the DS
team and engineering can turn into a real, reusable component.

**Audience:** DS team + the engineers building it. Technical and precise.

**Focus:** You will be told which single component to spec. Write about **only** that
component, generalized for reuse across the product — not just this one feature's instance.

**Tone:** Neutral, specification-grade. Present tense. No marketing.

**Format:** A component spec with these sections:
1. **Component name & purpose** — what it is, the problem it solves, when to use it
2. **Anatomy** — the parts that make it up
3. **Variants** — meaningful variations, if any
4. **States** — default, hover, focus, active, disabled, error, empty, loading (as applicable)
5. **Behavior & interaction** — how a user operates it; keyboard interaction
6. **Props / API (proposed)** — inputs it should accept, as a simple list or table
7. **Accessibility** — roles, labels, keyboard, focus management (WCAG 2.2 in mind)
8. **Tokens** — spacing/color/type tokens it should consume (reference the DS reference)
9. **Usage — do / don't** — a couple of each
10. **Open questions** — decisions the DS team must make before build

**Must include:** Accessibility section, proposed API, and do/don't guidance.

**Must avoid:** Speccing anything beyond the named component; benefit/marketing language;
inventing product requirements not implied by the brief.

---

**Example focus — "Filter expression builder" (abbreviated):**

> **Purpose:** Lets users compose a filter from multiple conditions joined with AND/OR and
> grouped with brackets, producing a readable expression. Use when simple facet filtering
> is insufficient and users need boolean logic.
>
> **Anatomy:** condition rows (field · operator · value), AND/OR joiners, group brackets,
> add/remove controls, a live expression preview, and apply/clear actions.
>
> **Accessibility:** each control keyboard-operable; group nesting announced; the expression
> preview exposed to assistive tech as it updates; visible focus throughout.
