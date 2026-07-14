# Search Page Toolbar — "After"

Isolated snapshot of the **search page toolbar** as it exists in the **groom
lake** project (Praxis design language). This is the **after** state for the
handoff-agent test case; the **before** is the equivalent toolbar from the
**Responsive Search** project.

## Structure

- **`index.html`** — the deployed showcase. Shows the toolbar in **both light
  and dark** at once (stacked, each in an iframe), because dark mode is a
  first-class part of the redesign and shouldn't be hidden behind a URL flag.
- **`toolbar.html`** — the isolated toolbar component itself. Standalone it
  renders centered; embedded (`?embed=1&theme=light|dark`) it top-aligns inside
  an iframe. `#theme=` / `?theme=` selects the Praxis surface.

## Interactive states

- **Hover / active** on all controls (Back, Save, Export, Notifications, Run,
  Sort, view-switch) via the source's lit-edge Praxis pill styling.
- **View switcher** — a segmented control (List, Table, Cards, Calendar,
  Hierarchy, Chart); **List** is active by default. Selecting one moves the
  active state.
- **Responsive collapse** (viewport < 1140px) — adopts the "before" toolbar's
  pattern (with Praxis styling): the tool buttons collapse into a **Tools** menu
  and Sort + the view switch collapse into an **Options** menu, instead of
  wrapping. The menus reuse the Praxis `.px-pop`/`.px-menu` popover vocabulary
  and stay in sync with the desktop controls.
- **Both themes** are shown on the page; each toolbar is independently
  interactive.

Matching the source, the **Sort** ("Last Updated") and **Export** buttons are
styled buttons with a chevron affordance but no popup — a genuine property of
the *after* state.

## Icons

All icons are **Material Symbols (Rounded)** — the SVG sprite from the source
has been removed in favour of the Material Design icon font throughout.

## Accessibility remediation

A WCAG pass is layered on top of the source (see the commented blocks in
`toolbar.html` and `app.js`): accessible names on icon-only buttons,
`aria-pressed` view state, a real focus-visible ring, `aria-hidden` decorative
icons, `role="toolbar"` grouping, and a darkened light-theme Run gradient for
contrast. The collapse menus follow the same standard (`aria-haspopup`,
`aria-expanded`, `role="menu"` / `menuitemradio`).

## Fidelity

`praxis-core.css` and `fonts/` (Gilroy) are copied **verbatim** from the groom
lake prototype. `page.css` is that page's embedded stylesheet (tokens, Gilroy
`@font-face`, `.toolbar` / `.tbtn` / `.sortbtn` / `.viewswitch`), extracted
unchanged. The toolbar markup follows the source; deltas from the original
(icon set, responsive collapse, dark-as-first-class, a11y) are documented inline
and applied in `toolbar.html` / `index.html` / `app.js`.

## Run / deploy

Static site — no build step.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
vercel --prod                 # deploy
```
