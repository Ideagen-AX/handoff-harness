# 02 · Harness — Connectors

## Live connector(s) wired in

- **Vercel AI Gateway → Claude** (the model connector). All reasoning and drafting
  routes through the gateway via plain `"anthropic/…"` model strings (no provider
  package). On Vercel it authenticates via OIDC automatically; locally via
  `AI_GATEWAY_API_KEY`. Verified live against `claude-sonnet-5` and `claude-opus-4.8`.
- **Hosted prototype (HTTP + headless browser) — read-only.** The harness fetches the
  prototype's readable text (`fetchPrototype`), inspects its real clickable controls
  (`inspectPrototype`), and screenshots each state with a local headless Chrome/Edge.
  It only navigates and reads; it never writes to the prototype.
- **Front-end codebase (local filesystem) — read-only, scoped.** When a `codebasePath`
  (e.g. the Miramar Search components folder) is supplied, the Understand agent reads it
  via a per-run `readCodebase` tool to compute a true before/after diff. Reads are
  confined to the given root (path-escape blocked), `.env*` files are refused, and
  `node_modules`/`.git`/build dirs are ignored. Local runs only — a deployed function
  can't see a local repo.

## What the harness reads through them

- **AI Gateway:** the Claude models that run the Understand agent and the fan-out.
- **Prototype connector:** the prototype's rendered HTML/CSS, real control labels, and
  screenshots of each meaningful state — plus the baseline prototype for a URL diff.
- **Codebase connector:** the current component source (the "before" state) and, where
  present, the repo's own conventions (`CLAUDE.md`/`CONTRIBUTING.md`/etc.) and its
  local ESLint binary, used to lint the generated component.

## Access needed to run this cold

- A **Vercel AI Gateway API key with a positive credit balance** in `.env.local`
  (`AI_GATEWAY_API_KEY=vck_…`). Get one from the Vercel dashboard → AI Gateway → API Keys.
- **Node.js 20+**.
- **A local Chrome or Edge** for screenshots and PDF export (optional — without it,
  screenshots degrade to placeholders and everything else still works).
- **Optional, for best accuracy:** a local clone of the target front-end repo, whose
  path is pasted into *Baseline → Current source codebase path* in the UI.
- **Optional, for the `.pptx` deck:** the two Ideagen brand templates dropped into
  `specs/templates/` (large + git-ignored — request from the project owner).

## Captured for later (requested in our process plan)

- **Microsoft 365 / Outlook (Graph)** — to actually *send* the per-audience email drafts.
  Sending is intentionally **stubbed** today; the harness composes a real `.eml` the user
  sends manually. Blocked on M365 auth being provisioned — a deliberate guardrail until
  then.
- **Microsoft Teams** — to post a release summary to the relevant channel (same auth gate).
- **Jira** — to open the developer-handoff ticket directly from the dev artifact.
- **Gainsight PX** — the harness already produces authoritative `data-id`s and an
  instrumentation plan; PX is the downstream consumer once a change ships. No write
  access is taken; the ids are handed to the team to wire.
