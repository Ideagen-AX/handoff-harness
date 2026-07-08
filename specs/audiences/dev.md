# Audience spec — Developer handoff

**Who they are:** The engineers who will build this. They have the prototype to
reference; what they need from us is an unambiguous implementation spec so they don't
have to reverse-engineer intent. Precise, technical, allergic to hand-waving.

**What they care about:**
- Exactly which DS components to use, and where net-new work is required
- Every state and interaction, including the non-obvious ones
- Responsive behavior and breakpoints
- Data/content shape and any API considerations they can infer
- Clear, checkable acceptance criteria
- What's explicitly out of scope or still open

**Tone:** Precise, structured, technical. Imperative. No marketing, no filler.

**Format:** A developer spec with these sections, in this order:
1. **Overview** — one paragraph: what to build, at a glance
2. **Component & DS mapping** — table derived from `componentImpact`: for each area, which
   DS component to use / extend, or the net-new component to build (reference the separate
   component spec if one exists)
3. **States & interactions** — enumerate each state and what triggers transitions
4. **Responsive behavior** — how layout/panels adapt across breakpoints
5. **Data & content** — shape of records shown, volumes to design for, edge cases
6. **Acceptance criteria** — a checklist mirroring QA's concerns
7. **Open questions** — anything from the brief's `openQuestions`, marked as blocking or not

**Must include:**
- The component/DS mapping tied to `componentImpact`
- Acceptance criteria as a checklist
- Open questions surfaced, never silently resolved

**Must avoid:** Benefit/marketing language, vague criteria, inventing behavior not supported
by the brief.

---

**Example (responsive-search) — abbreviated:**

> **Overview:** Add six selectable result view modes to Search and make the filter/
> visualization panels viewport-adaptive across CAPA, Incidents, Audits, Corrective
> Actions, and MOC.
>
> **Component & DS mapping**
> | Area | DS action |
> |---|---|
> | Result list/table/cards | Use existing table, cards, pagination |
> | Panel behavior (modal/drawer/docked/full) | Use existing responsive panel variants — bind to standard breakpoint tokens |
> | View-mode switcher | **Extend** toggle-button-group to a 6-way switch; confirm overflow behavior |
> | Filter expression builder | **Build net-new** — see the New Component Spec artifact |
>
> **Acceptance criteria**
> - [ ] All six modes render the same result set with no loss/duplication
> - [ ] View mode + filters + sort persist together when switching modes
> - [ ] Panels reflow correctly at each breakpoint with no clipping/overlap
> - [ ] 3,471-record set performs acceptably in card and hierarchy views
