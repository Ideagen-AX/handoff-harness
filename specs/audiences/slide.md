# Audience spec — Slide

**Who they are:** Anyone presenting the change in a deck — product comms, leadership
reviews, all-hands. One slide, one message, on the Ideagen **"Blanks - Blank 1"** layout,
exported as a real .pptx.

**The format is fixed — every slide uses this one layout:**
- A dark branded background (navy → magenta glow, Ideagen logo top-right). You don't set it.
- **Title** — top-left, large.
- **Subtitle** — one supporting line directly under the title (stays in the left column).
- **Callouts** — a bulleted list down the left column: the specific highlights of the change.
- **Images** — 1–3 showcase screenshots down the right column, each with a short label.

**What they care about:**
- A title they can say out loud
- A subtitle that frames the whole change in one line
- Punchy callouts that name the concrete changes
- Screenshots that actually show the new design

**Tone:** Confident, benefit-first, spoken-word short. British spelling, full product
names. Callouts are fragments, not paragraphs — each names one concrete change.

**Output:** You produce a structured SlideSpec (validated fields), not prose:
- `title` — the change's headline, ≤ ~6 words. The feature/area + what happened
  (e.g. "Toolbar Styling Updates"), not a full sentence.
- `subtitle` — one supporting sentence capturing the essence of the change, ≤ ~18 words.
- `callouts` — 3–7 short bullets, each ≤ ~12 words, each naming one concrete highlight
  (what changed, an improvement, a caveat like "spacing unchanged"). No paragraphs.
- `images` — 1–3 entries `{ screenKey, label }`, ordered top→bottom. Choose the captured
  frames that best show the new design; prefer DISTINCT states (light vs dark, default vs
  menu-open). `label` is a short caption shown above the image (e.g. "Light mode"); use an
  empty string for no label. Use ONLY screenKeys that were actually captured.
- `notes` — a 2–3 sentence speaker note: the problem, what changed, what's on screen.

**Must:** one message; benefit/area-led title; callouts that are concrete and specific;
1–3 real captured screenKeys in `images`; a speaker note.

**Must avoid:** a full sentence as the `title`; vague callouts ("various improvements");
inventing a screenKey that wasn't captured; more than 3 images.

---

**Worked example** — this is exactly the shape to produce (see `specs/examples/slide/`):

> - title: `Toolbar Styling Updates`
> - subtitle: `The search page toolbar has been updated to reflect the new Praxis design language`
> - callouts:
>   - `Buttons are rounder, styled with a light gradient for a dimensional effect.`
>   - `Icons have been refined.`
>   - `Aria labels wired in to ensure accessibility.`
>   - `Selected display mode styled with gradient and shadow.`
>   - `Toolbar background changed from flat to gradient.`
>   - `Element spacing remains unchanged.`
>   - `New dark mode variant included.`
> - images:
>   - `{ screenKey: "toolbar-light-default", label: "Light mode" }`
>   - `{ screenKey: "toolbar-dark-default", label: "Dark mode" }`
> - notes: `The search toolbar was restyled to the Praxis design language — rounder,
>   gradient-filled controls and a first-class dark mode — with no change to its controls
>   or spacing. Shown here in light and dark.`
