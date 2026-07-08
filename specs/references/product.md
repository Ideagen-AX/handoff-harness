# Product reference — Ideagen EHSQ Enterprise (EHSQ-E)

> Curated product knowledge for the harness. The Understand agent reads this so
> the change brief uses correct product framing and terminology; it is also
> injected into every artifact generator as shared product context so all
> communications stay accurate. Keep this concise and high-signal.

## Identity
- **Product:** Ideagen EHSQ Enterprise (EHSQ-E). Legacy internal name **DevonWay** (retired externally — do not use in customer-facing artifacts).
- **Parent:** Ideagen.
- **What it is:** A highly configurable, workflow-driven platform for managing Environment, Health, Safety & Quality programs in heavily regulated industries. Cloud-first, with on-prem and a mobile app. Includes a no-code workflow engine + form builder, and cross-module search/reporting/dashboards.
- **Mazlan:** the product's built-in **AI assistant**. If a prototype shows "Mazlan can make mistakes…" that is the AI assistant's disclaimer — real product surface, not stray text.

## Core modules (interconnected — an incident can spawn CAPA, trigger risk reassessment, require doc updates)
Incident Management · Audits & Inspections · CAPA (corrective/preventive actions) · Document Control · Training Management · Risk Assessment · Management of Change (MOC) · Permit to Work · Work Orders · Asset Management · Environmental Compliance · Observations.

## Personas (very different mental models — always name who an artifact serves)
- **Frontline worker** — mobile, field/PPE, needs fast low-friction capture.
- **Safety manager** — web, program oversight, trends, config, reporting.
- **Compliance officer** — web, audit readiness, regulatory tracking, evidence.
- **Plant/site manager** — web+mobile, dashboards, status, resourcing.
- **Executive** — web, KPIs, cross-site comparison, risk posture.
- **System administrator** — web, form builder, workflow config, integrations.

## Regulatory reality (shapes tone + what changes matter)
Customers: nuclear (NRC), pharma/life-sciences (FDA, GxP, 21 CFR Part 11), oil & gas, aviation (FAA SMS), construction (OSHA), national labs (DOE), federal, manufacturing.
- **Auditability** — actions need traceable records; undo/delete differ from consumer apps.
- **Accessibility is contractual** — many federal customers mandate WCAG (2.2). Not aspirational.
- **Conservative change tolerance** — these users are wary of UI change because errors carry safety/compliance consequences. UX-change communications should emphasize continuity, what did NOT change, and reassurance — not novelty for its own sake.

## Terminology & framing rules for artifacts
- Say "EHSQ-E" / "Ideagen EHSQ Enterprise", never "DevonWay" externally.
- Prefer the module names above verbatim (e.g. "Management of Change (MOC)", "CAPA").
- Frame value in terms of compliance, safety, auditability, and reduced friction — not consumer-style "delight."
- Prototypes are built as **Vue 3** components; forms are customer-configured (designs must tolerate variable form structures).
