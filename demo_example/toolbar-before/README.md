# Search Page Toolbar — "Before"

Isolated snapshot of the **search page toolbar** as it exists in the
**Responsive Search** project. This is the clean **before** state for the
handoff-agent test case. The **after** state is the equivalent toolbar from the
**groom lake** project.

The component is framed centered on the page with nothing else, and reproduces
every interactive state:

- **Hover / active / focus** on all controls (Back, Save, Export, Notifications,
  Run, Options, Sort, view-mode toggles).
- **View-mode selection** — the six display modes (List, Table, Cards, Calendar,
  Hierarchy, Chart); selecting one sets the active state.
- **Options panel** — drops from the toolbar with a scrim. Display tab (Sort by,
  and Show-as/Format where relevant); in Table mode the **Fields** and
  **Groupings** tabs appear (Fields lists the column checkboxes).
- **Responsive collapse** (viewport < 1200px) — inline tools collapse into a
  **Tools** dropdown, Sort + modes collapse behind the **Options** pill, and a
  **Create** (+) button appears.

Note: matching the source, the toolbar's own **Sort** dropdown is a styled
button with a hover state only — it has no popup on desktop. Sort is changed via
the Options panel. This is a genuine characteristic of the *before*.

## Fidelity

`styles.css` and `Assets/fonts/` (Gilroy) are copied **verbatim** from the
Responsive Search project, so tokens, brand palette, typography, hover/focus,
and responsive rules render identically. `app.js` is the source project's
toolbar/Options interaction layer, trimmed to this component (results-grid side
effects are stubbed).

## Run / deploy

Static site — no build step.

```bash
# local
python3 -m http.server 8000   # then open http://localhost:8000

# deploy (static)
vercel            # preview
vercel --prod     # production
```
