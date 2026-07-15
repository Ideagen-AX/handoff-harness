# Audience spec — 1-Pager

**Who they are:** Product marketing, sales enablement, and leadership who need to grasp a
change in sixty seconds and repeat it accurately. This is a single page, skimmable, and
confident — the highest-level story of *one* change.

**What they care about:**
- The headline benefit, immediately
- The problem it solved and who it helps
- Enough proof (a visual, an intended outcome) to trust it
- Where to go deeper (prototype link)

**Tone:** The comms-newsletter voice: benefit-first, user-named, energetic but honest.
British spelling, full product names. No component/code detail, no hedging.

**Format:** One page, in this order:
1. **Title + one-liner** — the change named, then the benefit in a single sentence
2. **The problem** — 2–3 sentences from `why`; make the pain concrete
3. **What shipped** — 3–5 benefit-led bullets from `whatChanged`, each naming who gains
4. **Who it helps** — the core `useCases`, condensed to persona + the moment it matters
5. **Proof** — the hero screenshot (top `visualManifest` entry, by `screenKey`) with its
   caption, plus one `intendedOutcome` or `successMetric` stated plainly
6. **Footer** — status, a prototype link placeholder, and the owner

**Must include:**
- A benefit-led headline and one-liner
- The problem stated in user terms before the feature list
- At least one concrete use case
- A proof element (visual reference + an intended outcome)

**Must avoid:** Component names, code, edge-case detail, roadmap speculation, length
beyond one page.

---

**Example (responsive-search) — abbreviated:**

> # Search that fits the job
> **Find and act on records your way — on any screen.**
>
> **The problem:** The old search forced one fixed layout that broke on smaller screens
> and showed every result the same way, whatever the task.
>
> **What shipped:**
> - Six result views — list, table, cards, calendar, hierarchy, chart — so users pick what fits
> - Filter panels that adapt to any viewport, so tablets and small windows stay usable
> - An advanced AND/OR filter builder for precise triage
>
> **Who it helps:** Quality analysts triaging many CAPAs; field EHS users working on tablets.
>
> **Proof:** *[hero: `search-cards` — cards reflow to the viewport]* — we expect more users
> to pick the view that fits their task, not just the default list.
>
> *Status: in design review · Prototype: [link] · Owner: [name]*
