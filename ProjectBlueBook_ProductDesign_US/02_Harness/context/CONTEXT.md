# 02 · Harness — Context base

The context base is the stable, high-signal knowledge the harness reasons from. We
deliberately **do not** cram it all into a prompt — it is delivered as reference
documents the agent *fetches on demand* via tools ("the right knowledge at the
right time"). This keeps every run grounded in real EHSQ-E facts, not the model's
guesses.

## What the harness knows

- **The product — Ideagen EHSQ Enterprise (EHSQ-E).** A configurable, workflow-driven
  platform for Environment, Health, Safety & Quality in heavily regulated industries
  (nuclear, pharma/GxP, oil & gas, aviation, construction, federal/DOE). The harness
  knows its modules (Incident Management, Audits & Inspections, CAPA, Document Control,
  Training, Risk Assessment, Management of Change, Permit to Work, Work Orders, Asset
  Management, Environmental Compliance, Observations), its six personas (frontline
  worker, safety manager, compliance officer, plant/site manager, executive, system
  administrator), and its regulatory reality — auditability, contractual WCAG 2.2
  accessibility, and a *conservative* change tolerance that shapes tone (emphasise
  continuity and what did **not** change, not novelty).
- **Terminology rules.** Say "EHSQ-E", never the retired internal name "DevonWay"
  externally; "Mazlan" is the product's built-in AI assistant; prototypes are Vue 3.
- **The design system.** The real EHSQ-E component library — components, tokens,
  patterns and known gaps — so the agent can classify a change's component impact as
  *used-as-is / extended / net-new* against what actually exists, rather than inventing
  components. Two design sources are selectable: **Miramar** (the production
  Vue 3 / Vuetify 3 front end, house conventions distilled from the real repo) and the
  **EHSQ-E Design System** (the design team's library reference).
- **How each audience should sound.** One spec per downstream audience defines its
  voice, structure, must-include and must-avoid — tuned against **real Ideagen
  examples** (an actual release newsletter, product-doc pages, a release-notes page,
  a slide) so drafts match house style.

## Where it lives (actual files, in this folder)

Engineering team → **7-layer model**. The context layers are shipped as real files:

| Layer | File(s) in the repo |
|---|---|
| Product context | `specs/references/product.md` |
| Design-system knowledge | `specs/references/design-system.md`, `specs/references/frontend-conventions-ehsqe.md` |
| Change-brief spec (the canonical schema the Understand agent fills) | `specs/change-brief.md` + `lib/types.ts` |
| Audience/output specs (instructions per artifact) | `specs/audiences/*.md` |
| Code-target conventions | `specs/code/miramar.md`, `specs/code/vue.md` |
| Reference examples (house style) | `specs/examples/**` |
| Repo-level agent instructions | `CLAUDE.md` (build/run conventions for this project) |

> These files are included in `02_Harness/` and `03_Knowledge_Base/`. The harness
> reads `product.md` and the chosen design-system reference through the `readReference`
> tool during the Understand stage, and injects the product context into every
> generator as shared context.

## Process map

The original hand-mapped lifecycle — our Miro board, codenamed **"Distro"** — is included
as **`process-map.pdf`** in this folder. It lays out the real design-handoff process end to
end: six stages, every manual step stickied under each, colour-coded **pink** (manual &
predictable), **grey** (needs human judgement), and **teal ★** (the strongest agent
candidates — the steps that eat the most hours). The harness automates the pink work and
keeps the grey judgement calls with a human.

> *Distro:* "an agent that facilitates broad distribution of finalized design work
> throughout the company, keeping various forms of documentation in sync, and ensuring
> that everyone who needs to talk about our products has the latest information."

**The six stages (from the board) → how the harness covers them:**

| Stage | Manual steps on the board | Harness output |
|---|---|---|
| 1 · Design Complete | Develop analytics plan & define success; add analytics hooks to markup; *(working group judges design complete — human)* | Analytics & success plan + Gainsight `data-id`s wired into the coded component |
| 2 · Design System Review | Check WCAG 2.2; identify/reuse DS primitives & tokens; isolate new styles; create/modify DS component; PR to DS team; *(decide new vs update — human)* | DS update artifact + a net-new component spec per genuine gap (component-impact classification) |
| 3 · Dev Handoff | Translate component to target frameworks; meet code standards & patterns; PR to front-end repo; *(share with Dev — human)* | Developer handoff spec + a Miramar-conventions starting-point component, linted against the real repo |
| 4 · Quality Assurance | Map all journeys & states; provide test cases; *(share with QA — human)* | QA test cases artifact |
| 5 · Customer Support | Summary of changes; core use cases with examples; where found in product; version history; file docs to Luminate; *(approve docs — human)* | Support & TAM summary + product docs |
| 6 · Internal Comms | Summary/feature description; shareable presentation with prototype link; the problem solved + numbers | Release notes · executive 1-pager · slide (`.pptx`) · case study |

**Runtime flow the harness executes:**
`Understand → Capture → Fan-out generate → Review & approve (human) → Export/distribute`

- **Understand** — a tool-loop agent fetches the prototype, reads the product +
  design-system references, inspects the prototype's real control labels, establishes
  a baseline (codebase diff → URL diff → inferred), and emits one structured change brief.
- **Capture** — headless Chrome screenshots each view the brief flags as worth showing.
- **Fan-out generate** — 9 artifacts drafted in parallel from that one brief.
- **Review & approve** — everything streams into a UI; a human edits and approves.
- **Export/distribute** — Markdown / `.docx` / `.pptx` / `.pdf` / `.eml`; sending is
  manual by design.

A rendered architecture diagram of the runtime flow is also included at
`docs/handoff-harness-architecture.pdf` in the repo.
