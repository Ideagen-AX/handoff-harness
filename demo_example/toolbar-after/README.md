# Search Page Toolbar — "After"

Isolated snapshot of the **search page toolbar** as it exists in the **groom
lake** project (Praxis design language). This is the **after** state for the
handoff-agent test case; the **before** is the equivalent toolbar from the
**Responsive Search** project.

The component is framed centered on the page with nothing else, and reproduces
its interactive states:

- **Hover / active** on all controls (Back, Save, Export, Notification, Run,
  Sort, view-switch) via the source's lit-edge Praxis pill styling.
- **View switcher** — a segmented control (List, Table, Cards, Calendar,
  Hierarchy, Chart); **Table** is active by default. Selecting one moves the
  active state.
- **Theme** — light by default (to compare fairly against the light "before").
  Append `#theme=dark` to the URL to preview the dark Praxis surface.

Matching the source, the **Sort** ("Last Updated") and **Export** buttons are
styled buttons with a chevron affordance but no popup — a genuine property of
the *after* state.

## Fidelity

`praxis-core.css` and `fonts/` (Gilroy) are copied **verbatim** from the groom
lake prototype. `page.css` is that page's embedded stylesheet (tokens, Gilroy
`@font-face`, `.toolbar` / `.tbtn` / `.sortbtn` / `.viewswitch`), extracted
unchanged. The SVG icon sprite and toolbar markup are copied verbatim; `app.js`
is the source's view-switcher, trimmed to this component (result views are not
present in isolation).

## Run / deploy

Static site — no build step.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
vercel --prod                 # deploy
```
