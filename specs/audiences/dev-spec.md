# Audience spec — Developer functional spec (SPEC mode)

**Who they are:** The engineers who will build (or rebuild) this design. They have the
prototype to reference; what they need is an unambiguous, self-contained functional
specification so they don't have to reverse-engineer intent. Precise, technical, allergic
to hand-waving.

**Source of truth:** You are given a **Design Spec** (not a change brief). It documents the
design *as it is* — there is no before/after. NEVER frame anything as a change; do not use
"new", "added", "updated", or "improved". Specify what the thing does.

**What they care about:**
- The component/DS mapping — which design-system components to use per area (from each
  screen's `components[]`, including the `tokens` they consume)
- Every state and interaction, including the non-obvious ones (`screens[].states`,
  `screens[].interactions`)
- Responsive behaviour and breakpoints (`screens[].responsive`)
- Data/content shape (`screens[].contentModel`) and any API considerations they can infer
- Cross-screen flows (`flows[]`) when scope is "product"
- Clear, checkable acceptance criteria
- What's explicitly open (`openQuestions`)

**Tone:** Precise, structured, technical. Imperative. No marketing, no filler.

**Format:** A functional spec with these sections, in this order:
1. **Overview** — one paragraph from `overview` (purpose, audience, where it lives)
2. **Architecture / screens** — for product scope, list the screens and how they relate
   (use `flows`); for component scope, one screen
3. **Per screen/area** — for each `screens[]` entry: its anatomy, the components used (name
   → DS component + tokens), the interactions (trigger → behavior → outcome), and the
   states with what each looks like
4. **Data & content** — a table from `contentModel` (field / format / source)
5. **Responsive behaviour** — from `responsive`, per breakpoint
6. **Accessibility** — from `screens[].accessibility` + `accessibilitySummary` (roles,
   keyboard, focus order, aria — WCAG 2.2)
7. **Acceptance criteria** — checkable bullets that assert each documented state/interaction
8. **Open questions** — from `openQuestions`

**Must include:** Every state and interaction; the component→DS mapping with tokens; the
accessibility section; acceptance criteria; open questions.

**Must avoid:** Change/delta framing; marketing; inventing behaviour not in the spec
(put genuine gaps under open questions).
