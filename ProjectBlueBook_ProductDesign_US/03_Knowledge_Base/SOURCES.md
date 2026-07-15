# 03 · Knowledge base

The source material the harness draws on. The files themselves are included in this
folder (sanitised) so another team can rebuild the harness's knowledge from here alone.
During a run they are delivered to the agent *on demand* via the `readReference` tool,
not crammed into the prompt.

| Source | What it is | Where it lives / access |
|---|---|---|
| `references/product.md` | Curated EHSQ-E product context — identity, modules, personas, regulatory reality, terminology & framing rules | in this folder (repo: `specs/references/product.md`) |
| `references/design-system.md` | The EHSQ-E Design System reference — components, tokens, patterns, known gaps; used to classify component impact | in this folder (repo: `specs/references/design-system.md`; distilled via the `sync-ehsqe-ds` skill) |
| `references/frontend-conventions-ehsqe.md` | The **Miramar** production front-end house style — Vue 3 Options API (plain JS), Vuetify 3, quote/semicolon/SCSS conventions distilled from the real repo; grounds generated code | in this folder (repo: `specs/references/frontend-conventions-ehsqe.md`) |
| `references/ideagen-ehsq-enterprise.brief.md` | The fuller EHSQ-E product/design brief the product knowledge is distilled from | in this folder |
| `examples/product-comms/…` | A **real Ideagen release newsletter** — house voice for comms | in this folder (repo: `specs/examples/`) |
| `examples/product-docs/…` | **Real EHSQ-E product-doc pages** — structure/register for the docs artifact | in this folder |
| `examples/release-notes/…` | A **real IQM release-notes page** — format for the release-notes artifact | in this folder |
| `examples/slide/…` | A worked slide example — structure for the executive slide | in this folder |
| Audience specs (`02_Harness/skills/draft-audience-artifact/spec/*.md`) | Per-audience voice/format/must-include/must-avoid — the "instructions" layer | in `02_Harness/` |
| Change-brief spec + schema (`02_Harness/skills/build-change-brief/spec/`) | The canonical hand-off contract every artifact is generated from | in `02_Harness/` |

## How the knowledge is used (and refreshed)

- **Product + DS references** are read by the Understand agent at the start of every run
  and the product context is injected into every generator, so all outputs stay accurate
  and on-terminology.
- **Examples** are matched for *voice and structure only* — never for content; the facts
  come solely from the Change Brief.
- **To refresh the design system:** re-run the `sync-ehsqe-ds` skill and re-distill into
  `design-system.md`. To retune an output's voice, edit its audience spec — no code change.

> **Sanitisation note:** these are internal Ideagen product/design references and real
> published examples; they contain no customer data or secrets. The Ideagen `.pptx`
> brand templates and any API keys are **excluded** (large/secret) — see the handover for
> how to obtain them.
