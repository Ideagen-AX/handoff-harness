# Design System reference (placeholder)

> This is a lightweight stand-in so the Understand agent's `read_reference`
> tool returns something real. Replace it with a genuine export of the EHSQ-E
> Design System (component list, tokens, patterns) for sharper `dsImpact` and
> `newComponentNeeded` reasoning — the `sync-ehsqe-ds` skill can produce one.

## Components available in the library (abridged)

- **Panels & drawers** — modal, left drawer, right drawer, docked sidebar, content-fill, full-page. Viewport-driven responsive behavior via standard breakpoint tokens.
- **Toggle button group** — segmented control for switching between mutually exclusive options.
- **Data table** — sortable columns, density options, pagination.
- **Pagination** — page numbers with prev/next and truncation.
- **Cards** — content container with header/body/footer slots.
- **Filters** — basic type/facet selection.
- **Form controls** — inputs, selects, chevron-expandable menus.

## Known gaps (candidates for new components)

- No **filter expression builder** (AND/OR chaining with bracket grouping).
- No standardized **multi-mode view switcher** beyond the basic toggle button group.
- No **calendar** or **hierarchy** result-view components.

## Rules of thumb

- New patterns that recur across modules should be proposed as DS components,
  not built as one-offs (avoids drift).
- Responsive panel behavior must use existing breakpoint tokens, not bespoke ones.
