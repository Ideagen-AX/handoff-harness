# 01 · Demo

Drop your recorded demo here as **`ProjectBlueBook_Demo.mp4`** (~5 minutes).

---

## Demo script — Project Blue Book · The Handoff Harness

**Runtime target:** ~5:00. Record at 1440-wide so the streaming artifacts are legible.
Do a **dry run first**: kick off one real generate so the AI Gateway prompt cache is
warm and the run lands in a few minutes on camera. Have the live app at
`localhost:3000` and the `/library` tab open in a second tab.

> Legend: **[SCREEN]** = what's on screen · **[SAY]** = voiceover.

---

### 0:00–0:30 — The process and the pain

- **[SCREEN]** Cold open on a finished prototype (the Praxis Search-toolbar "after"),
  then a fan of blank docs: release notes, QA cases, product docs, support summary, DS
  update, dev handoff, analytics plan, exec slide, case study.
- **[SAY]** "Every time we ship a UX change at Ideagen, one designer re-writes that same
  change up to a dozen times — release notes, QA cases, product docs, a support summary,
  a design-system update, a developer handoff, an analytics plan, an exec slide, a case
  study. Each one from scratch, in a different voice, from memory. For a change we
  communicate *properly*, that's around **104 hours** of work, and only the designer can
  do it. Our harness does the same handoff in **five and a half minutes** — and keeps a
  human in the loop."

### 0:30–1:30 — The harness tour

- **[SCREEN]** Split the `lib/` and `specs/` folders next to the running app.
- **[SAY]** "We didn't import an agent framework — we built the harness. Four pieces:"
  - **[SCREEN]** `specs/references/` → **[SAY]** "**Context** — real EHSQ-E product and
    design-system knowledge. The agent *fetches* this on demand rather than us cramming
    it into a prompt."
  - **[SCREEN]** `specs/audiences/*.md` → **[SAY]** "**Skills** — one spec per output that
    defines its voice and format, tuned against real Ideagen examples. Nine of them.
    Editing these retunes the output — no code change."
  - **[SCREEN]** `lib/pipeline.ts` → **[SAY]** "**Agents** — a tool-loop *Understand*
    agent that writes one canonical change brief, then a parallel fan-out that voices it
    for every audience."
  - **[SCREEN]** `lib/tools.ts` + the model string → **[SAY]** "**Connectors** — Claude
    through the Vercel AI Gateway, plus read-only tools onto the prototype and the
    front-end codebase."

### 1:30–4:00 — The agent, end to end, on real input

- **[SCREEN]** The generator form, pre-filled with the **Praxis Search-toolbar** demo
  case. Point at the before/after URLs, the structured note, and the design source
  (**Miramar — production Vue/Vuetify**).
- **[SAY]** "Real input: the Search toolbar, restyled to our Praxis design language.
  Before URL, after URL, a short structured note, and the design system to match. I click
  **Generate handoff**."
- **[SCREEN]** Click Generate. Narrate as each stage streams:
  - **[SAY]** "First it **diffs** the two prototypes — visually *and* at the code level —
    and writes the **change brief**. Notice the badge: **computed**, not guessed. It read
    the real before and after."
  - **[SCREEN]** Change brief appears — scroll the decision log, component impact, success
    metrics, open questions.
  - **[SAY]** "One structured understanding: what changed, the design decisions, how
    success would be measured, and — honestly — what it's *unsure* about, in open
    questions."
  - **[SCREEN]** Screenshots land. **[SAY]** "It captured the toolbar's distinct states
    itself — default, dark mode, the responsive collapse — by driving the real controls."
  - **[SCREEN]** Artifact cards stream in. Open **Release notes**, then **QA**, then the
    **coded component**.
  - **[SAY]** "Now the fan-out — nine artifacts in parallel, each in the right voice. QA
    test cases for QA. Release notes in our house style. And a **starting-point Vue
    component** in Miramar conventions, with the Gainsight analytics ids already wired in —
    the same ids documented in the analytics plan, and linted against the real repo."

### 4:00–4:45 — Guardrails, and the adoption weeks

- **[SCREEN]** Hover the **approve** control on a card; open the **email draft** export.
- **[SAY]** "Every capability has a guardrail. Nothing is sent — everything lands here for
  a human to edit and approve. The email is a *draft* the person sends; the code is a
  *starting point* a developer reviews; the codebase read is strictly read-only. And the
  agent never claims a change it couldn't verify."
- **[SCREEN]** The `/library` tab. **[SAY]** "Every run is archived and versioned, so the
  harness compounds a record of how we communicate change. In the adoption weeks we wire
  the distribution connectors we've already scoped — Outlook, Teams, Jira — behind that
  same human approval."

### 4:45–5:00 — Who we are, and Monday

- **[SCREEN]** Title card: **Project Blue Book** · Product & Design · US · Brian Studwell,
  Adam Main, Rob Stefanussen · Smith: Gavin Marchbank.
- **[SAY]** "We're **Project Blue Book**. On Monday we stop hand-writing the same change a
  dozen times over — we write it once, as a verifiable brief, and let the harness voice it
  for every audience, with a human in the loop to approve."

---

### Shot list / checklist
- [ ] Warm the cache with a throwaway run before recording.
- [ ] `localhost:3000` pre-filled with the toolbar demo case; `/library` open in tab 2.
- [ ] `lib/pipeline.ts`, `lib/tools.ts`, `specs/audiences/`, `specs/references/` ready to show.
- [ ] Capture the **computed** badge on the brief clearly.
- [ ] Show one comms artifact + the coded component + the email-draft/approve guardrail.
- [ ] End on the team title card.
