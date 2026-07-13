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
| `changeBasis` | How the delta was established: `method` (`codebase-diff` / `url-diff` / `inferred`) + `note` | Provenance — tells the reviewer how much to trust `whatChanged`/`beforeAfter`. `inferred` means no baseline was available. |
| `what_changed` | Bulleted list of concrete changes | The facts, no spin |
| `why` | The problem it solves / motivation | Human note is the seed; agent enriches |
| `decisionLog` | The reasoning trail: `decision` + `rationale` + `alternativesConsidered` + honest `tradeoff` | Feeds the narrative case study and dev handoff. Infer likely decisions if unstated, and flag inferences in `open_questions`. |
| `intendedOutcomes` | What success looks like, in plain user/business terms | Feeds the analytics plan |
| `successMetrics` | Candidate measurables: `metric` + `signal` (what to instrument) + `direction` + `target` | Draft for the analyst; prefer signals instrumentable in Gainsight PX |
| `before_after` | Prior behavior → new behavior | Table or paired bullets |
| `affected_areas` | Modules / screens / flows touched | e.g. "Search, across CAPA/Incidents/Audits" |
| `componentImpact` | Per-component list: name + disposition (`used-as-is` / `extended` / `net-new`) + detail | Drives the DS-team artifact, the dev handoff, and the new-component offshoot. Any `net-new` entry triggers an automatic component-spec artifact. |
| `useCases` | Core use cases: `persona` + `scenario` + concrete `example` | Feeds product docs and the support summary |
| `user_visible` | What an end user will actually notice | Feeds support + release notes |
| `risks_edge_cases` | Where it could break or confuse | Feeds QA + support "how NOT to use" |
| `open_questions` | Anything the agent couldn't determine | Surfaced to the human, never guessed |
| `visualManifest` | Views worth capturing: `screenKey` + `caption` + `state` + optional `selector` + `annotations[]` + `actions[]` | Drives the screenshot stage; feeds the case study, one-pager, and slide. `actions` = steps (click by visible label / setViewport / wait) that drive the prototype into that state before capture — distinct states need distinct actions or the screenshots come out identical. Order by narrative importance. |

> **Enhanced ≠ new.** Do not describe a mode, view, or feature as "new" or "added"
> unless a baseline confirms it was absent before. Many changes make *existing* behaviour
> responsive/faster/clearer. Without a baseline, treat the change as an enhancement and note
> the assumption in `open_questions` — and read the designer's note literally but skeptically.

---

## Worked example — the responsive-search prototype

> This is what the agent should be able to produce from
> `https://responsive-search.vercel.app/` + a one-line human note.

**title:** Responsive search result views

**one_liner:** Search results can now be viewed as list, table, cards, calendar,
hierarchy, or chart, and the surrounding filter/visualization panels adapt to any
screen size.

**changeBasis:** `{ method: "codebase-diff", note: "Compared the prototype against the current Search implementation in the product source." }` — or, with no baseline: `{ method: "inferred", note: "No baseline provided; whatChanged/beforeAfter are inferred from the note and must be verified." }`

**what_changed:**
- Added six result view modes: list, table, cards, calendar, hierarchy, chart
- Filter and visualization panels can render as modal, left drawer, right drawer,
  docked sidebar, content-fill, or full-page — chosen to fit the viewport
- Custom filter expression builder (AND/OR chaining with bracket grouping)
- Result density control (10 / 25 / 50 / 100 per page) and updated pagination

**why:** The old search was a fixed layout that broke on smaller viewports and forced
one presentation of results regardless of the task. Users doing different jobs (scanning,
comparing, scheduling) needed different views of the same records.

**decisionLog:**
- *decision:* Ship six fixed view modes rather than a user-configurable view builder.
  *rationale:* Covers the known jobs without the complexity/QA surface of a builder.
  *alternativesConsidered:* [Configurable column/view builder; two modes only].
  *tradeoff:* Power users can't compose a bespoke view yet.
- *decision:* Let panels change presentation (drawer/modal/docked/full) by viewport rather than a single responsive reflow.
  *rationale:* Preserves usable filtering on small screens where a reflow would bury controls.
  *alternativesConsidered:* [Single fluid reflow; hide filters below a breakpoint].
  *tradeoff:* More states to design, test, and document.

**intendedOutcomes:**
- Users complete search-and-filter tasks on small viewports without horizontal scrolling or hidden controls.
- Adoption of non-list view modes shows users are choosing the view that fits their task.

**successMetrics:**
- *metric:* Share of searches using a non-list view mode. *signal:* view-mode toggle events. *direction:* increase. *target:* TBD.
- *metric:* Small-viewport search task completion. *signal:* filter-apply events on <768px sessions. *direction:* increase. *target:* TBD.
- *metric:* Advanced filter builder usage. *signal:* expression-builder open + apply events. *direction:* increase. *target:* TBD.

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

**useCases:**
- *persona:* Quality analyst. *scenario:* Comparing dozens of open CAPAs by owner and due date. *example:* Switches to table view, sorts by due date, applies an AND/OR filter for "overdue AND unassigned."
- *persona:* Field EHS user on a tablet. *scenario:* Checking incidents on a narrow viewport in the field. *example:* Opens the filter drawer as a modal, filters to today's site, scans results as cards.

**user_visible:** A row of view-mode toggle icons above results; results reflow into the
chosen format; filter panels open as drawers/modals depending on screen size.

**risks_edge_cases:** Very large result sets (3,471+ rows) in card/hierarchy views;
deeply nested filter expressions; view-mode preference persistence across sessions;
narrow-viewport drawer overlap.

**open_questions:** Does the selected view mode persist per user? Which modes are
available for which record types? (Agent could not confirm from the prototype.)

**visualManifest:**
- *screenKey:* `search-list-default`. *caption:* Default list view with the view-mode switcher. *state:* default. *selector:* "". *annotations:* [View-mode switcher; result density control]. *actions:* [] (landing view).
- *screenKey:* `search-cards`. *caption:* Card view of the same result set. *state:* default. *selector:* "". *annotations:* [Cards reflow to viewport width]. *actions:* [{do: click, target: "Cards"}].
- *screenKey:* `filter-drawer-mobile`. *caption:* Filter panel on a narrow viewport. *state:* expanded. *selector:* "". *annotations:* [Panel adapts to a modal/drawer below tablet width]. *actions:* [{do: setViewport, width: 480, height: 900}, {do: click, target: "Filters"}].
- *screenKey:* `expression-builder`. *caption:* Custom AND/OR filter expression builder. *state:* default. *selector:* ".expression-builder". *annotations:* [Bracket grouping; AND/OR toggles per row]. *actions:* [{do: click, target: "Filters"}].
