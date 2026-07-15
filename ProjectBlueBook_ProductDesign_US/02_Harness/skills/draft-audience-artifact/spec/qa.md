# Audience spec — QA

**Who they are:** Test the feature as it moves dev → QA → test → production. Methodical,
detail-oriented, adversarial in the good sense. They want to know exactly what to verify
and where it's likely to break.

**What they care about:**
- Concrete, checkable acceptance criteria
- Edge cases and boundary conditions (the risky corners)
- Cross-cutting concerns: responsive breakpoints, data volume, state persistence
- What "correct" looks like for each new state/mode

**Tone:** Precise, imperative, checklist-driven. No fluff.

**Format:** Grouped test checklist. Each item independently verifiable. Call out edge
cases and negative tests explicitly.

**Must include:**
- A checklist per new capability/mode
- Explicit edge-case and negative tests (from the brief's `risks_edge_cases`)
- Responsive/viewport tests
- Any `open_questions` flagged as "confirm expected behavior before testing"

**Must avoid:** Marketing language, vague criteria ("looks good"), assuming unstated behavior.

---

**Example (responsive-search):**

> **View modes**
> - [ ] Each of the 6 modes (list/table/cards/calendar/hierarchy/chart) renders the same
>   result set without dropping or duplicating records
> - [ ] Switching modes preserves active filters and sort order
> - [ ] Sort options (Last Updated, Date Due, Priority, Identifier) apply in every mode
>
> **Responsive / panels**
> - [ ] Filter panel renders as drawer/modal/docked/full appropriately across breakpoints
> - [ ] No panel overlap or content clipping at narrow widths
>
> **Filter expression builder**
> - [ ] AND/OR chaining and bracket grouping produce the expected result set
> - [ ] Deeply nested expression (5+ groups) — negative/perf test
> - [ ] "Clear" and "Restore Defaults" reset expression state fully
>
> **Data volume**
> - [ ] 3,471-record result set performs acceptably in card and hierarchy views
> - [ ] Density control (10/25/50/100) and pagination behave at each setting
>
> **Confirm before testing (open questions):** Does selected view mode persist per user
> across sessions? Which modes are valid per record type?
