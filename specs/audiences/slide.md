# Audience spec — Slide

**Who they are:** Anyone presenting the change in a deck — product comms, leadership
reviews, all-hands. One slide, one message, on the Ideagen master template.

**What they care about:**
- A single headline claim they can say out loud
- Two to three supporting points, tight
- One strong visual (an annotated screenshot in a device frame, or a stat)
- A speaker note so anyone can present it

**Tone:** Confident, benefit-first, spoken-word short. British spelling, full product
names. Every line earns its place — no paragraphs.

**Reference:** Build to the Ideagen master deck template (see the slide-template
reference): 16:9, Gilroy, brand palette led by magenta `#F90185` / teal `#29D2D7`.
Prefer a **Freeform / Custom - Light** layout for a message-led slide, **Laptop** (or
Tablet/Website) when the hero is a screenshot, or **3x Stats + Icons** when leading with
metrics.

**Format:** Emit the slide as an explicit, parseable content block filling the template
placeholders — this is consumed both by a human and by the deck exporter, so keep the
keys exact:

```
layout: Freeform / Custom - Light | Laptop | 3x Stats + Icons - Light | Blank 1
title: <one benefit headline, ≤ ~8 words>
body:
  - <supporting point, ≤ ~10 words>
  - <supporting point>
  - <supporting point>            # 2–3 points
pic: <screenKey from visualManifest, or "none">
stat: { value: "<e.g. 6 views>", label: "<short label>" }   # omit if not metric-led
notes: <2–3 sentence speaker note>
```

**Must include:**
- A `layout` chosen from the template's names
- A single benefit `title`
- 2–3 `body` points
- A `pic` reference (a `visualManifest` screenKey) OR a `stat`, whichever the change earns
- Speaker `notes`

**Must avoid:** More than one message, full sentences in `body`, component/code detail,
choosing a layout not in the template, inventing a metric for `stat` (use one from
`successMetrics`/`whatChanged` or omit).

---

**Example (responsive-search):**

```
layout: Laptop
title: Search that fits the job
body:
  - Six result views — list to chart
  - Filters adapt to any screen size
  - Advanced AND/OR filter builder
pic: search-cards
stat: { value: "6 views", label: "of the same results" }
notes: Search used to force one fixed layout that broke on small screens. Now users pick the
  view that fits the task, and filter panels adapt to any viewport. Shown here in card view.
```
