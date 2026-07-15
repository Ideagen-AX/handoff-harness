# 04 · Documentation — Guardrails register

**Every capability claim pairs with a guardrail claim — non-negotiable.**

| # | Capability | Guardrail |
|---|---|---|
| 1 | Works out "what changed" from the prototype and diff | Every brief carries a `changeBasis` badge — **computed** (codebase/URL diff) vs **inferred**. The agent will **not** claim a codebase diff it couldn't actually perform; inferred deltas are labelled *unverified* and listed in `openQuestions`. |
| 2 | Distinguishes an *enhanced* existing feature from a *new* one | Without a confirming baseline it must describe a change as an enhancement, never "new/added", and record the assumption in `openQuestions`. |
| 3 | Drafts 9 downstream artifacts in the right voice | Nothing is auto-used: every draft streams into a **review UI** for a human to edit and approve before it goes anywhere. |
| 4 | Composes per-audience distribution emails | **Sending is stubbed.** It produces a draft `.eml` the human sends manually; the label marks it "please review before acting". No autonomous send. |
| 5 | Generates a starting-point coded component | Labelled a **developer starting point, not shippable code**; grounded in the DS reference so it can't invent components/tokens; linted against the target repo's own ESLint where available; a developer reviews before merge. |
| 6 | Reads the current codebase to diff it | **Read-only and confined** to the supplied root — path-escape blocked, `.env*` refused, `node_modules`/`.git`/build dirs ignored. Local runs only. |
| 7 | Screenshots the live prototype | Read-only navigation via a **local** headless browser; degrades to placeholders if none present; never writes to the prototype. |
| 8 | Assigns Gainsight PX `data-id`s and wires them into code | One authoritative instrumentation plan feeds **both** the analytics doc and the coded component, so ids always match; ids are handed to the team to wire — the harness takes **no** PX write access. |
| 9 | Classifies design-system component impact | Prefers *used-as-is / extended*; reserves *net-new* for genuine gaps, and every net-new component triggers a spec routed to the **Design-System team** for review. |
| 10 | Uses real Ideagen house-style examples | Examples are matched for **voice/structure only**; facts come solely from the Change Brief — examples' products/features are never copied. |

## Human-in-the-loop points

- The **Change Brief** is reviewable before any artifact is generated from it.
- **Every artifact** is edited and approved per-card in the review UI before use.
- **All distribution is manual** — the human sends the email / posts to Teams / opens the
  Jira ticket. No channel is authorised for autonomous send.

## Access limits

- **Read-only everywhere:** prototype (HTTP + browser navigation), codebase (scoped
  filesystem read), references. No write scopes are held on any external system.
- Model access is via the **Vercel AI Gateway** with a credit-limited key.
- Codebase reads are rooted to one directory; secret files are refused.

## What it must never do

- Send, publish, post, or file anything without explicit human action.
- State an unverified change as fact, or claim a diff it didn't perform.
- Invent design-system components, tokens, or screenshot URLs.
- Read secrets/environment files or reach outside the provided codebase root.
- Use the retired internal product name "DevonWay" in any customer-facing artifact.
