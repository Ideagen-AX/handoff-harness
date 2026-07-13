# Handoff Harness

A purpose-built **agent harness** for design handoff. Point it at a completed
prototype and it produces one canonical *change brief*, then fans that out into
a tailored draft for every downstream audience — for a human to review, edit,
and approve before anything is sent.

Built for the AI-fluency hackathon. The whole point is that **we built the
harness** — the loop, the tools, the guardrail — rather than importing one.

---

## What a "harness" is (in this project)

The model only turns text into text. The harness is everything around it that
turns that into useful work:

| Harness piece | Where it lives |
|---|---|
| **Loop** | `lib/pipeline.ts` — understand → fan-out generate → (review in UI) |
| **Instructions** | `specs/audiences/*.md` + `specs/change-brief.md` (edit these to tune output) |
| **Context** | `specs/` files, fetched via tools, not crammed in up front |
| **Tools** | `lib/tools.ts` — `fetch_prototype`, `read_reference` |
| **Guardrails** | The review UI — nothing "sends" without human approval (sending is stubbed) |

## Architecture

```
Browser (app/page.tsx)  ──POST──►  /api/run (route.ts)  ──►  runPipeline() (pipeline.ts)
      ▲                                                          │
      └──────────── NDJSON event stream ◄────────────────────────┘
                                                          Understand  ─ ToolLoopAgent + tools
                                                          Fan-out     ─ 5 parallel generateText calls
```

- **Engine:** Vercel AI SDK (`ai` v6), in-process — no subprocess, deploys clean.
- **Models:** routed through the Vercel AI Gateway via `"anthropic/…"` strings
  (`lib/model.ts`). Verified live: `claude-sonnet-5`, `claude-opus-4.8`.

## Getting started (clone & run)

### Prerequisites
- **Node.js 20+** (Next.js 15). Check with `node -v`.
- **Google Chrome** (or Edge) installed — used headlessly for screenshots and PDF
  export. Optional but recommended (see *What needs what* below).
- **A Vercel AI Gateway API key** with a positive credit balance — the app calls
  Claude through the gateway.

### Steps
1. **Clone and enter the project**
   ```bash
   git clone https://github.com/Ideagen-AX/handoff-harness.git
   cd handoff-harness
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Add your API key.** Copy the example env file and paste your key in:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local`:
   ```
   AI_GATEWAY_API_KEY=vck_your_key_here
   ```
   - Get a key from the Vercel dashboard → **AI Gateway → API Keys**.
   - It needs **credits** on the gateway or every run fails with a balance error.
   - `.env.local` is **git-ignored — it is not in the repo**, so each developer
     supplies their own key.
4. **Start the dev server**
   ```bash
   npm run dev
   ```
5. **Open** http://localhost:3000. It's pre-filled with a demo prototype + note —
   click **Generate handoff** and watch the change brief, captured screens, and the
   grouped review packages stream in.

### What needs what (this app is local-first by design)
| Feature | Requirement |
|---|---|
| AI pipeline · all text artifacts · **Word (.docx)** export · **email draft** (.eml) | Just the API key above |
| **Screenshots** of the prototype · **PDF** export | A local **Chrome/Edge**. Without one, screenshots become placeholders and PDF returns a clear error — everything else still works. |
| **PowerPoint (.pptx)** deck on the Ideagen template | The two brand templates at `specs/templates/ideagen-base.pptx` and `ideagen-master.pptx`. These are **large (~160 MB) and git-ignored, so they are NOT in the repo** — ask the project owner for the files and drop them into `specs/templates/`. Without them the `.pptx` download errors; nothing else is affected. |
| **Codebase-diff baseline** (most accurate briefs) | Optional. Clone the current front-end repo locally and paste its path (e.g. the Search components folder) into **Baseline → Current source codebase path** in the UI. Without it, the change is inferred from your note and labelled *unverified*. |

### Handy commands
- `npm run dev` — dev server with hot reload
- `npm run build` && `npm start` — production build and serve
- `npm run typecheck` — TypeScript check (no emit)

## The build phases

- **Phase 0 (spine)** — one prototype → change brief → one artifact → review. ✅
- **Phase 1** — fan out to all five audiences in parallel. ✅ *(this build)*
- **Phase 2** — add the dev-handoff stage + richer DS-component detection.
- **Phase 3** — real distribution (email/Teams/Jira) once a channel is authorized.

## How it determines what changed

The prototype is only the *after* state. To evaluate the *change*, the Understand
agent establishes a baseline, in this order of preference:

1. **Codebase diff** — pass a `codebasePath` (the current app source). The agent
   reads it via the `read_codebase` tool and diffs it against the prototype.
   Local runs only (a deployed function can't see your local repo).
2. **Baseline-URL diff** — pass a `baselineUrl` (the current live screen). Works
   anywhere, including the deployed app.
3. **Inferred** — with no baseline, it reconstructs the delta from your note +
   product/DS knowledge and **labels it unverified**.

Every brief reports its `changeBasis` (shown as a badge in the UI) so a reviewer
always knows whether "what changed" was *computed* or *inferred*. The agent will
not claim a codebase diff it couldn't actually perform.

## Tuning the output

You almost never need to touch code. To change how an audience's artifact reads,
edit its spec in `specs/audiences/`. To change what the brief captures, edit
`specs/change-brief.md` and the schema in `lib/types.ts`.

**Knowledge layer** (`specs/references/`) — the stable, high-signal context the
harness reasons from:
- `product.md` — EHSQ-E product context, modules, terminology. Read by the
  Understand agent and injected into every generator for accurate framing.
- `design-system.md` — the real EHSQ-E component library (components, tokens,
  patterns, gaps), distilled via the `sync-ehsqe-ds` skill. Lets the Understand
  agent classify component impact as used-as-is / extended / net-new against
  what actually exists. Re-run `sync-ehsqe-ds` and re-distill to refresh.

Both are delivered as tools the agent calls (`read_reference`) — the "right
knowledge at the right time" principle, rather than cramming everything into the
prompt.

## The five audiences

Design System team · Support & Technical Account Managers · QA · Release notes ·
Internal blog / presentation. (Dev handoff is Phase 2.)
