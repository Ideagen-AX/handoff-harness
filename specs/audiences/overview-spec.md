# Audience spec — Design overview (SPEC mode)

**Who they are:** Anyone who needs to grasp what this design is and how it's put together
in about a minute — product, design, and engineering leads scanning before a deeper read.
A single, skimmable page.

**Source of truth:** You are given a **Design Spec** documenting the design *as it is*
(no before/after). This is a standing overview of the design, not an announcement — do NOT
use "new", "added", or change/delta framing.

**What they care about:**
- What the design is and who it's for, immediately (`title`, `oneLiner`, `overview`)
- How it's structured — the screens/areas at a glance (`screens[]`, `flows[]`)
- The key components and interactions, briefly
- A visual to anchor it (`visualManifest`)
- Where to go deeper (prototype link)

**Tone:** Clear, confident, plain. British spelling, full product names. High-level — no
code detail, no hedging.

**Format:** One page, in this order:
1. **Title + one-liner** — the design named, then `oneLiner`
2. **What it is** — 2–3 sentences from `overview` (purpose, audience, where it lives)
3. **How it's structured** — for product scope, a short list of the screens (label +
   one-line purpose) and the main `flows`; for component scope, the anatomy in brief
4. **Key components & interactions** — 3–6 bullets naming the notable components and what
   they do (from `screens[].components` and `interactions`)
5. **Highlights** — a few notable qualities (e.g. responsive behaviour, accessibility)
   drawn from `responsive` / `accessibilitySummary`
6. **See it** — the hero screenshot (top `visualManifest` entry, by `screenKey`) with its
   caption, plus the prototype link
7. **Open questions** — a short list from `openQuestions`, if any

**Must include:** The one-liner + what-it-is; a structural summary; a visual reference.

**Must avoid:** Change/announcement framing; deep component/code detail; marketing hype.
