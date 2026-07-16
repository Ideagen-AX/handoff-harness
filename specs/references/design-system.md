# Design System reference — EHSQ-E DS

> Curated from the EHSQ-E Design System monorepo (VitePress + Vue 3), synced
> 2026-06-30. The Understand agent reads this to classify each affected
> component as used-as-is / extended / net-new, and to ground new-component
> specs in real tokens and patterns. Re-sync with the `sync-ehsqe-ds` skill.

## Foundations at a glance
- **Token prefix** `--ehsq-*`; **BEM** naming (`.ehsq-{block}__{el}--{mod}`).
- **Font** Gilroy (400/500/600/700). Default body weight is **semibold (600)**.
- **Icons** Material Symbols (Rounded, outlined, weight 400), inline SVG. Sizes 16/20(default)/24/32.
- **Type scale** xs12 sm14 base16 lg18 xl20 2xl24 + h1 30. **Spacing** 8px grid + 4px steps.
- **Radii** sm 4px (button/input/card) · md 8px (callout/table/modal) · lg 12px (dialog) · full.
- **Semantic color** interactive = teal-60; status success/warning/danger/info = green/orange/red/blue-60; text-primary neutral-90; surface white / subtle neutral-10.
- **Breakpoints** sm640 md768 lg1024 xl1280 2xl1536. Desktop-first. Content max 1280 / forms 720 / tables 100%.
- **Motion** fast100/normal200/slow300/slower500ms; respect `prefers-reduced-motion`.
- **Principles** clarity over cleverness · consistency · purposeful data density · WCAG 2.1 AA mandatory · progressive disclosure.

## Component inventory (what exists — use these before proposing new ones)

**Global:** Search Bar (persistent top bar) · Nav Rail (56px icon rail) · Page Header (breadcrumb + title) · Profile Menu · Create New Menu · **Toolbar**.

**Core:**
- **Button** — primary/secondary/danger/ghost, sizes XXS–XL.
- **Callout** — inline dismissible message banner, 7 variants (tip/info/instruction/warning/caution/error/success).
- **Chip** — read-only / dismissible / selectable.
- **Data Table** — primary record-list grid; optional built-in tab group + toolbar; cell types text/link/badge/actions; selectable; sortable; empty state. Pagination 10/25/50/100 (default 25).
- **Field** — record-detail row, 8 types (small/large char, picklist, checkbox, radio, toggle, reference, date); inline or stacked.
- **Modal** — dialog overlay, dark header (inverted vs Helix), sizes sm/md/lg.
- **Status Banner** — full-width persistent single-line strip, 4 variants.
- **Switch** · **Tab Group** · **Toggle Button** (pill radio group for mutually-exclusive views/modes).

**Records:** Current Task · Process Tree · Required Fields Guide · Workflow. *(These record-guide cards have no Helix equivalent.)*

**Dashboards:** Miramar (legacy) + Nexus — nav menu, toolbar, primitives, compositions, agentic creation, layouts, customization controls.

### ⚑ Especially relevant to search/results work
- **Toolbar** — action bar below the Page Header. Variants Default / Record / Monaco / Admin. **Documents display modes: List / Table / Card / Calendar / Hierarchy / Tree.** So a multi-mode view switcher is largely an *existing* capability — prefer "extend Toolbar" over "net-new" unless a specific mode has no rendering component.
- **Toggle Button** — the DS-sanctioned control for switching mutually-exclusive modes (radiogroup semantics).
- **Data Table** + **Data Display pattern** — cover List/Table result rendering, sorting, pagination, empty states.

## Patterns
- **Page Layout** — Search Bar → Nav Rail → Page Content (Page Header → Toolbar → Content Card). Only the Content Card varies per page.
- **Record Page** — three-column: guide (Current Task/Required Fields/Workflow) · content · Process Tree.
- **Data Display** — tables for scan/filter/compare; pagination 10/25/50/100, "1–25 of 342"; filter bar with active-count badge, URL-persisted, 300ms debounce; list pattern for mobile.
- **Forms** — vertical single-column default; validation on blur/submit; wizard for >15 fields.
- **Feedback** — toast (bottom-right, 5s) · inline alert · banner · confirmation dialog for destructive actions.
- *Empty States / Error Handling / Loading States / Navigation* — currently stub placeholders in the DS (flag as needing guidance if a change depends on them).

## Known gaps / no existing component (genuine net-new candidates)
- **Filter expression builder** (AND/OR chaining + bracket grouping) — no DS equivalent.
- **Chart-based result view** — no charting/visualization result component (Toolbar lists a mode, but no rendering component is documented).
- Calendar / Hierarchy / Tree result rendering — Toolbar *names* these display modes, but confirm whether rendering components exist; treat as "extend Toolbar mode + possibly net-new renderer" and flag in openQuestions rather than assuming.

## Rules of thumb
- New recurring patterns should be proposed as DS components, not built as one-offs (avoids drift).
- Responsive panel/layout behavior must use the breakpoint tokens above, not bespoke ones.
- Prefer extending an existing component (e.g. Toolbar display modes, Toggle Button) over declaring net-new.
