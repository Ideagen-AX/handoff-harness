# The Change Brief (canonical understanding)

This is the single structured artifact the agent produces in the **Understand** stage.
Every downstream audience artifact is generated *from this brief* — not from the raw
prototype. Get this right and the fan-out is mostly re-voicing one good understanding.

The agent fills this in by fetching the prototype, reading the design-system reference,
and reading the codebase, plus the short human note that kicks off a run.

---

## Fields

| Field | What it holds | Notes |
|---|---|---|
| `title` | Short name of the change | e.g. "Responsive search result views" |
| `one_liner` | The change in a single sentence | Reused verbatim in release notes |
| `what_changed` | Bulleted list of concrete changes | The facts, no spin |
| `why` | The problem it solves / motivation | Human note is the seed; agent enriches |
| `before_after` | Prior behavior → new behavior | Table or paired bullets |
| `affected_areas` | Modules / screens / flows touched | e.g. "Search, across CAPA/Incidents/Audits" |
| `componentImpact` | Per-component list: name + disposition (`used-as-is` / `extended` / `net-new`) + detail | Drives the DS-team artifact, the dev handoff, and the new-component offshoot. Any `net-new` entry triggers an automatic component-spec artifact. |
| `user_visible` | What an end user will actually notice | Feeds support + release notes |
| `risks_edge_cases` | Where it could break or confuse | Feeds QA + support "how NOT to use" |
| `open_questions` | Anything the agent couldn't determine | Surfaced to the human, never guessed |
| `screens` | Key views/states, with labels | Referenced by every artifact |

---

## Worked example — the responsive-search prototype

> This is what the agent should be able to produce from
> `https://responsive-search.vercel.app/` + a one-line human note.

**title:** Responsive search result views

**one_liner:** Search results can now be viewed as list, table, cards, calendar,
hierarchy, or chart, and the surrounding filter/visualization panels adapt to any
screen size.

**what_changed:**
- Added six result view modes: list, table, cards, calendar, hierarchy, chart
- Filter and visualization panels can render as modal, left drawer, right drawer,
  docked sidebar, content-fill, or full-page — chosen to fit the viewport
- Custom filter expression builder (AND/OR chaining with bracket grouping)
- Result density control (10 / 25 / 50 / 100 per page) and updated pagination

**why:** The old search was a fixed layout that broke on smaller viewports and forced
one presentation of results regardless of the task. Users doing different jobs (scanning,
comparing, scheduling) needed different views of the same records.

**before_after:**
| Before | After |
|---|---|
| Single fixed results layout | Six selectable view modes |
| Panels fixed, overflowed on narrow screens | Panels adapt (drawer/modal/docked/full) to viewport |
| Basic type filtering only | Basic + advanced expression builder |

**affected_areas:** Search, spanning CAPA, Incidents, Audits, Corrective Actions,
Management of Change.

**componentImpact:**
- *Panel / drawer* — **used-as-is**. Existing responsive panel variants (modal, drawer, docked, full) cover the new behavior.
- *Table, pagination, cards* — **used-as-is**. Standard components render the list/table/card views.
- *Toggle button group* — **extended**. Now drives a 6-way view-mode switch; may exceed the current variant matrix (overflow / sizing).
- *Filter expression builder* — **net-new**. AND/OR chaining with bracket grouping has no DS equivalent.
- *Calendar view, Hierarchy view* — **net-new**. No existing result-view components for these formats.

**user_visible:** A row of view-mode toggle icons above results; results reflow into the
chosen format; filter panels open as drawers/modals depending on screen size.

**risks_edge_cases:** Very large result sets (3,471+ rows) in card/hierarchy views;
deeply nested filter expressions; view-mode preference persistence across sessions;
narrow-viewport drawer overlap.

**open_questions:** Does the selected view mode persist per user? Which modes are
available for which record types? (Agent could not confirm from the prototype.)

**screens:** Search — list view (default); table view; cards; hierarchy; chart;
filter drawer (left); custom expression builder; visualizations panel.
