# The Design Spec (canonical understanding — SPEC mode)

This is the single structured artifact the agent produces in the **Understand** stage
when the harness runs in **spec mode**. It is the standalone counterpart to the Change
Brief: instead of documenting *what changed* against a baseline, it documents a design
**as it is** — thoroughly, factually, and self-contained. Every downstream audience
artifact is generated *from this spec*.

There is **no before/after and no baseline**. Never frame anything as a change — avoid
"new", "added", "updated", "improved". Describe what exists.

The agent fills this in by fetching the prototype, reading the product and design-system
references, inspecting the live controls, and **exhaustively opening every hidden state**
(drawers, modals, flyouts, menus, inactive tabs/toggles) so nothing is left undocumented.

---

## Scope

- `scope: "component"` — a single component or screen, documented in depth. `screens`
  holds ONE entry; `flows` is empty.
- `scope: "product"` — a whole multi-screen product/flow. `screens` holds one entry per
  discovered screen; `flows` holds the key cross-screen journeys.

## Fields

| Field | What it holds | Notes |
|---|---|---|
| `title` | Short name of the design | e.g. "Search results toolbar" |
| `oneLiner` | The design in a single sentence | Reused verbatim by overview artifacts |
| `scope` | `component` or `product` | Set by the run; do not change it |
| `overview` | `purpose` + `audience` + `whereItLives` | The high-level framing |
| `screens[]` | Per-screen documentation (see below) | One entry for component scope; many for product |
| `flows[]` | Cross-screen journeys: `name` + ordered `steps` | Empty for component scope |
| `designTokens[]` | Tokens used, by `category` (+ `notes`) | DS token names, not raw hex |
| `accessibilitySummary` | Cross-cutting a11y for the whole design | WCAG 2.2 in mind |
| `useCases[]` | `persona` + `scenario` + concrete `example` | Feeds product docs + support |
| `openQuestions` | Anything that could NOT be determined | Never guess — put it here |
| `visualManifest[]` | Every meaningful state worth capturing | Drives the screenshot stage; be COMPREHENSIVE |

### Each `screens[]` entry

| Field | What it holds |
|---|---|
| `key` | Short stable label, e.g. `incident-list` |
| `label` | Human name for the screen |
| `url` | The screen's URL if known; else empty |
| `purpose` | What the screen is for and where it sits |
| `anatomy[]` | Regions/structure, top to bottom |
| `components[]` | Every notable component: `name`, `role`, `variants`, `states`, `tokens` |
| `interactions[]` | `trigger` (exact visible label) → `behavior` → `outcome`, for every control |
| `states[]` | Distinct states, exhaustively: `name` + `description` (default/empty/loading/error/edge) |
| `contentModel[]` | Data shown: `field` + `format` + `source` |
| `responsive[]` | How it adapts across breakpoints |
| `accessibility[]` | Roles, keyboard, focus order, aria, contrast (WCAG 2.2) |

---

## Quality bar

- **Exhaustive, not a summary.** Enumerate every component, state, and interaction. If a
  panel can be opened, open it and document its contents — never write "could only see
  the trigger".
- **Factual and verifiable.** Ground every statement in what you fetched, inspected, or
  opened. Genuine uncertainty goes in `openQuestions`, never a guess.
- **Tokens, not hex.** Express styling as design-system tokens; flag any raw value.
- **Reusable framing.** Describe components generalised for reuse, not just this one
  instance — this spec seeds the design-system and developer handoffs.
- **A capture-ready visualManifest.** Each entry needs distinct `actions` (click by exact
  visible label; `setViewport` for responsive states) or its screenshot will be identical
  to another's.
