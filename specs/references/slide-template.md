# Reference — Ideagen master deck template (JUN26)

Facts extracted from `Ideagen_MASTER-BLANK-Template_JUN26.potx`. The slide artifact must
produce content that drops cleanly into this template.

## Canvas
- **16:9**, 13.33 in × 7.5 in (12192000 × 6858000 EMU). Design for widescreen.

## Brand palette (theme colours)
| Role | Hex | Notes |
|---|---|---|
| Ink / dark navy (`dk1`) | `#0E1324` | Primary text on light; dark-slide background |
| Dark surface (`dk2`) | `#24303C` | Secondary dark |
| Light surface (`lt2`) | `#EDEEF0` | Light panel / off-white |
| White (`lt1`) | `#FFFFFF` | |
| **Magenta (`accent1`)** | `#F90185` | Primary brand accent; also hyperlink |
| Deep magenta (`accent3`) | `#BB0164` | |
| Light magenta (`accent5`) | `#FF54A3` | |
| **Teal (`accent2`)** | `#29D2D7` | Secondary brand accent |
| Deep teal (`accent4`) | `#039DB7` | |
| Cyan (`accent6`) | `#36EEFF` | |

## Type
- **Headings:** Gilroy-SemiBold · **Body:** Gilroy-Regular. Never substitute another face.

## Layouts to target (per the designer: prefer blank / freeform)
| Use the change leads with… | Layout(s) | Placeholders |
|---|---|---|
| A single clear message | **Freeform / Custom** — Light 47 / Dark 46 / Blend 48; **Blank 1–5** (54–58) | `title` + 1–3 `body` |
| A product screenshot | **Laptop** 50 · **Tablet** 51/52 · **Website** 49 | `title` + `body` + `pic` (device frame) |
| Metrics / outcomes | **3x Stats + Icons - Light** 38 · **Single Custom Data** 42/43 | `title` + section `body` + stat `body` (`00%`) + `pic` (icon) |
| Headline + supporting image | **Single Line / Image - Light** 10 (or Dark 8) | `title` + `pic` |

Default for a change slide: **Freeform / Custom - Light (47)** for a message-led slide, or
**Laptop (50)** when the hero is an annotated screenshot. Both are 16:9 and carry the
brand furniture (footer, slide number) automatically.

## Content contract the slide artifact emits
So the content is paste-ready AND machine-assemblable later, the slide artifact should
name its target layout and fill the placeholders explicitly:
- `layout`: one of the names above
- `title`: the single benefit headline
- `body[]`: 1–3 short supporting points (≤ ~10 words each)
- `pic`: which `visualManifest` screenshot goes in the picture/device placeholder (by `screenKey`)
- optional `stat`: one metric callout `{value, label}` when leading with outcomes
- `notes`: 2–3 sentence speaker note
