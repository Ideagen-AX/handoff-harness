# Audience spec — Slide

**Who they are:** Anyone presenting the change in a deck — product comms, leadership
reviews, all-hands. One slide, one message, built on the Ideagen master template and
exported as a real .pptx.

**What they care about:**
- A single headline claim they can say out loud
- One tight supporting line
- One strong hero screenshot
- A speaker note so anyone can present it

**Tone:** Confident, benefit-first, spoken-word short. British spelling, full product
names. Every word earns its place — no paragraphs, no bullet dumps.

**Output:** You produce a structured SlideSpec (validated fields), not prose. Fill it so
it drops onto an Ideagen branded content slide:
- `template` — the brand colour of the slide: **Teal** or **Pink**. Pick either; default Teal.
- `title` — the single benefit headline (≤ ~8 words). This is the claim, not the feature name.
- `subtitle` — one supporting line capturing the essence (≤ ~16 words). If you must convey
  two ideas, join them with " · ".
- `picScreenKey` — the screenKey of the single best hero screenshot from those offered.
  Choose the frame that most shows the benefit. Use an empty string only if none fits.
- `attribution` — a short owner/date line, e.g. "Design review · 2026".
- `notes` — a 2–3 sentence speaker note: the problem, what changed, and what's on screen.

**Must:** one message only; benefit-led title; a real screenKey from those offered (or
empty); a speaker note.

**Must avoid:** feature-name-as-title, two messages, full sentences in `title`/`subtitle`,
inventing a screenKey that wasn't offered.

---

**Example (responsive-search):**

> - template: `Teal`
> - title: `Search that fits the job`
> - subtitle: `Six result views, and filters that adapt to any screen size`
> - picScreenKey: `search-cards-view`
> - attribution: `Design review · 2026`
> - notes: `Search used to force one fixed layout that broke on small screens. Now users
>   pick the view that fits the task and filter panels adapt to any viewport. Shown here in
>   card view.`
