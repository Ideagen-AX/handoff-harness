# Reference — Ideagen slide format (Blanks - Blank 1)

For this first version the harness relies on **one** slide format: the Ideagen
**"Blanks - Blank 1"** layout, rebuilt from scratch so we don't ship the 65 MB master
deck. The deck exporter (`lib/deck.ts`) composes it with `pptxgenjs` over a single
pre-composited brand background (`specs/templates/blank1-bg.png`). Facts below are what
the slide artifact must produce content for.

## Canvas
- **16:9**, 13.333 in × 7.5 in (1280 × 720 px @ 96 dpi). Design for widescreen.

## The one layout
Fixed regions (the exporter places these — the artifact only supplies the text/images):

| Region | Where | Holds |
|---|---|---|
| Title | top-left | `title` — the headline |
| Subtitle | under the title, left column | `subtitle` — one supporting line |
| Callouts | left column | `callouts[]` — magenta-bulleted highlights |
| Showcase images | right column, stacked | `images[]` — 1–3 screenshots, each with an optional label |
| Brand furniture | background | navy → magenta glow, corner dot pattern, Ideagen logo (baked into the background image) |

## Brand palette (theme colours)
| Role | Hex | Notes |
|---|---|---|
| Ink / dark navy | `#0B1124` | Slide background base |
| Dark slate | `#24303C` | Background gradient end |
| White | `#FFFFFF` | Title, subtitle, callout text |
| **Magenta (accent1)** | `#F90185` | Bullet marks; primary brand accent |
| **Teal (accent2)** | `#29D2D7` | Secondary brand accent |
| Muted grey | `#AEB4C2` | Image labels |

## Type
- **Gilroy** throughout — SemiBold/Bold for the title, Regular for body. Never substitute
  another face. (PowerPoint uses the viewer's Gilroy; we don't embed fonts, to stay light.)

## Content contract the slide artifact emits (SlideSpec)
- `title` — headline, ≤ ~6 words
- `subtitle` — one supporting sentence, ≤ ~18 words
- `callouts[]` — 3–7 concrete highlights, each ≤ ~12 words (fragments, not paragraphs)
- `images[]` — 1–3 `{ screenKey, label }`, ordered top→bottom; `screenKey` must be one that
  was actually captured; `label` is a short caption ("Light mode") or empty string
- `notes` — 2–3 sentence speaker note

See `specs/audiences/slide.md` for the voice rules and `specs/examples/slide/` for the
canonical worked example.
