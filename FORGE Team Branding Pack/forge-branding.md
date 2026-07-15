# FORGE 2026 — Team Branding Guide

Everything your team needs to make presentations, demo videos, team pages and slides look unmistakably **FORGE**. Copy freely — that's what this pack is for.

**In this pack:** this guide · `forge-logo-dark.svg` · `forge-logo-light.svg` · `forge-presentation-template.html`

---

## 1. The name

- **FORGE** in eyebrows, marks, titles and logos (all caps).
- **Forge** in prose ("during the Forge", "the Forge build days").
- Never "The FORGE 2026 Event" — it's just **FORGE 2026**.
- The Teams channel is **Forge 2026** (never "#forge-2026").

## 2. Colours

| Token | Hex | Use |
|---|---|---|
| Navy | `#092133` | Primary background (dark register), headline text on light |
| Deep navy | `#0e1324` | Footers, deepest background layers |
| Ink | `#24303c` | Body text on light backgrounds |
| Teal | `#2B828D` | Accents, icons, labels on light |
| Light teal | `#5CC9D0` | Gradient partner, highlights on dark |
| Pink | `#E30072` | Primary accent, emphasis, full stops |
| Bright pink | `#FF54A4` | Gradient partner, eyebrows on dark |
| Bright blue | `#36eeff` | Sub-headlines and stats on dark |
| Green | `#00CE7D` | Success, "live" states |
| Paper | `#f3f4f6` | Light register background |

**The FORGE gradient** (the "bloom") — light teal → bright pink, animated left-to-right on headline words:

```css
background: linear-gradient(90deg, #5CC9D0, #FF54A4 25%, #5CC9D0 50%, #FF54A4 75%, #5CC9D0);
background-size: 220% auto;
-webkit-background-clip: text; background-clip: text;
-webkit-text-fill-color: transparent;
animation: bloom 7s ease-in-out infinite;
@keyframes bloom { 0%,100% { background-position: 0% center } 50% { background-position: 100% center } }
```

Use the bloom on **one or two words per headline**, never the whole sentence.

## 3. Typography

- **Typeface:** Gilroy (Ideagen brand face). Fallback stack: `"Gilroy", "Helvetica Neue", Arial, sans-serif`.
- **Headlines:** weight 700–800, tight letter-spacing (`-0.02em`), end with a **pink full stop**: `Two days to build<span style="color:#FF54A4">.</span>`
- **Eyebrows** (small labels above headlines): 12px, uppercase, letter-spacing `0.18em`, weight 700, bright pink on dark / teal on light.
- **Body:** weight 400, line-height 1.6.

## 4. The logo

Two lockups in this pack — the Ideagen cubes with the FORGE wordmark:

- `forge-logo-dark.svg` — for **dark/navy** backgrounds (white wordmark)
- `forge-logo-light.svg` — for **light/white** backgrounds (navy wordmark)

Rules: don't stretch, recolour, outline or add effects to the cubes; keep clear space around the lockup of at least the height of one cube; minimum on-screen width 120px.

## 5. The two registers

**Dark (event & presentation)** — navy `#092133` background, glowing pink/cyan blurred orbs bottom-right, white headlines with a bloomed word, bright-blue sub-text. Use for slides, videos, big screens.

**Light (documents & guides)** — paper `#f3f4f6` background, white cards with 1px `#e6e9ee` borders and a 4px teal or pink left border, navy headlines. Use for guides and handouts.

## 6. Motion

Motion is part of the brand — subtle, purposeful, never busy:

- **Reveal:** elements fade-and-rise in on scroll (`0.55s`, cubic-bezier `(.2,.7,.2,1)`).
- **Hover:** cards lift `-2px` with a soft shadow; icons tilt `-5°`.
- **Bloom:** gradient headline words shift slowly (7s loop).
- **Glow drift:** background orbs drift over 16–20s.
- Always respect `prefers-reduced-motion` — motion off, content intact.

## 7. Voice

- **Build, not talk.** Short sentences. Verbs first.
- Confident and concrete: "the agent runs end to end", not "we hope to explore".
- Every capability claim pairs with a guardrail claim — in copy as in code.
- Say **harness** (an environment: context, skills, agents, connectors, guardrails) — never "a bot" or "an automation".
- The people who help you are **Smiths**; they run **meetings** (never "clinics").

## 8. Video title cards

Open your demo video with a 3-second dark-register title card (the first slide of `forge-presentation-template.html` works as-is): FORGE eyebrow, team name headline with one bloomed word, function + hub below. Close with the team slide. Screen-record the deck or export the slides as images.

---

*FORGE 2026 · Ideagen internal · Questions → **Forge 2026** on Microsoft Teams*
