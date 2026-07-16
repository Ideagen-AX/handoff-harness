# 04 · Documentation — Cold-start handover

Everything another team needs to run this harness from zero, on Monday, with no
questions.

## 1. Prerequisites

- **Node.js 20+** (`node -v`).
- **A Vercel AI Gateway API key with a positive credit balance** — the app calls Claude
  through the gateway. Get one from the Vercel dashboard → **AI Gateway → API Keys**.
  Without credits, every run fails with a balance error.
- **Google Chrome or Microsoft Edge** installed locally — used headlessly for
  screenshots and PDF export. *Optional but recommended:* without it, screenshots become
  placeholders and PDF export returns a clear error; everything else still works.
- *Optional, for the best (computed) briefs:* a local clone of the target front-end repo
  (e.g. Miramar's Search components folder).
- *Optional, for the `.pptx` deck:* the two Ideagen brand templates
  (`ideagen-base.pptx`, `ideagen-master.pptx`) — large (~160 MB) and git-ignored, so
  **not** in the repo; request them from the project owner and drop them into
  `specs/templates/`.

## 2. Setup (empty environment → running harness)

```bash
git clone https://github.com/Ideagen-AX/handoff-harness.git
cd handoff-harness
npm install
cp .env.example .env.local          # then edit it:
# AI_GATEWAY_API_KEY=vck_your_key_here
npm run dev                          # dev server with hot reload
```

Open **http://localhost:3000**. (Production build: `npm run build && npm start`.
Type-check only: `npm run typecheck`.)

## 3. First run (sample input is built in)

The form is **pre-filled with a real demo case** — the *Nexus Search-toolbar restyle* —
so you can run it with zero typing:

1. Leave the demo case as **"Search toolbar — Nexus restyle"** (or pick
   *"Search filter drawer — Nexus redesign"* from the dropdown).
2. Leave every output enabled.
3. Click **Generate handoff**.

Both demo prototypes are hosted (before/after Vercel URLs baked into the case), so this
works on a fresh machine with only the API key. You'll watch the change brief, then the
captured screens, then the artifact drafts stream in.

## 4. What good output looks like

A successful run produces, in the review UI:

- **One Change Brief** with a **"computed" (url-diff)** badge — title, whatChanged,
  before/after, component impact, decision log, success metrics, use cases, open
  questions.
- **Captured screenshots** of the toolbar's distinct states (default, dark mode,
  responsive collapse, each display mode).
- **9 artifact cards** — DS update, product docs, support summary, QA cases, release
  notes, analytics plan, 1-pager, slide, case study — plus the **dev handoff spec** and a
  **coded Vue/Vuetify component** with Gainsight `data-id`s wired in and a lint report.
- Working **exports**: Markdown, `.docx`, `.pptx` (with templates), `.pdf`, `.eml`.

The run auto-saves to the local **Library** (`/library`), stamped with the tool version
and grouped under its project, for later reference and cross-run comparison.

> A frozen reference run (brief + artifacts) is archived in the Library from our own
> build; open `/library` after your first run to compare.

## 5. When it goes wrong (known limits & failure modes)

- **"No object generated" / brief truncation** — occasionally the tool-loop ends early;
  the pipeline already **auto-retries up to 4×**. If it still fails, re-run.
- **Balance error** — the AI Gateway key has no credits. Add credits.
- **Screenshots are placeholders / PDF errors** — no local Chrome/Edge found. Install one.
- **`.pptx` download errors** — the brand templates aren't in `specs/templates/`. Add them.
- **Codebase diff ignored on the deployed app** — a Vercel function can't see your local
  repo; the codebase-diff baseline is **local-only**. Use a baseline URL instead when
  deployed, or run locally.
- **Client-rendered prototype returns little text** — the agent falls back to the note +
  screenshots and flags gaps in `openQuestions`; supply a good structured note.
- **Who to ask:** Brian Studwell (build) — `brian.studwell@ideagen.com`.

## 6. Adoption & memory

- **Cadence:** run **per change**, on demand, the moment a prototype is ready for handoff.
- **How it learns / compounds:** every run is archived to the versioned **Library** with
  its brief, artifacts and screenshots — a growing record of how changes were
  communicated, and a corpus of house-style outputs to reuse. Output voice is tuned by
  editing the audience specs (`specs/audiences/*.md`); product/DS knowledge is refreshed
  by re-running the `sync-ehsqe-ds` skill and re-distilling the reference. No code change
  needed to retune.
- **What we add next (adoption weeks):**
  - **Phase 2:** richer dev-handoff + DS-component detection.
  - **Phase 3:** real distribution — wire the **M365/Outlook**, **Teams** and **Jira**
    connectors (currently stubbed) once auth is provisioned, keeping human approval.
  - Extend design sources beyond Miramar (e.g. Helix / React-MUI portfolio products) via
    `lib/designSources.ts`.
