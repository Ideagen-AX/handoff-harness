---
product: Ideagen EHSQ Enterprise
abbreviation: EHSQ-E
aliases: [DevonWay, Ideagen EHS, Ideagen EHSQ, EHS Enterprise, EHS-E]
parent_company: Ideagen
category: Environment, Health, Safety & Quality (EHSQ) management platform
segment: Enterprise (regulated industries)
codename: Decani  # internal; platform built on the acquired DevonWay base (per NextGen brief)
owner: Brian Studwell
last_updated: 2026-07-14
status: draft — verified core + owner-confirmed net-new; open ⚠️/🔎 items remain
one_line: Configurable, workflow-driven EHSQ platform for enterprises in heavily regulated industries.
keywords:
  - EHS, EHSQ, health and safety, quality management, QMS
  - regulated industries, nuclear, pharma, GxP, aviation, construction, federal, manufacturing
  - incident management, CAPA, audits, MOC, permit to work, risk assessment, observations
  - configurable workflow engine, no-code form builder, audit trail, electronic signature
  - Mazlan (AI agent), NextGen initiative, Government Cloud (FedRAMP Moderate), Priya (mid-market)
  - WCAG 2.1 AA, Section 508, 21 CFR Part 11, ISO 9001/45001/14001/31000/27001, SOC 2 Type II
  - Decani (codename), DevonWay (platform base), Ideagen Hub, Miramar (Vue 3 UI)
related_skills: [what-is-ehsqe, what-is-workflow-builder]
---

# Ideagen EHSQ Enterprise — Product Brief

> **How to read the tags in this brief**
> - ✅ **verified** — sourced from the maintained `what-is-ehsqe` product-knowledge skill.
> - ⚠️ **needs confirmation** — net-new content that must be confirmed by a product owner before it is relied upon.
> - 🔎 **to research** — will be filled from an authoritative internal or public source, then re-tagged.
> - **(NG)** — sourced from the **Ideagen NextGen Platform** product-context brief (another team's
>   document). Treat as ⚠️ needs-confirmation: useful and often detailed, but portfolio-level or
>   pre-dating our owner-confirmed facts in places. Confirm before relying on it.
>
> Do not treat ⚠️, 🔎, or (NG) content as fact until it has been confirmed and re-tagged ✅.

---

## At a glance

| | |
|---|---|
| **What** | Enterprise EHSQ (Environment, Health, Safety & Quality) management platform |
| **For** | Enterprises in heavily regulated industries (nuclear, pharma/GxP, aviation, construction, federal, manufacturing) — **not** mid-market |
| **Key strength** | Deep configurability; unified EHS **and** Quality; audit trails, e-signatures, complex workflows baked in |
| **Deployment** | Cloud-first (AWS/Azure); on-premise option; mobile app; **Government Cloud** = FedRAMP **Moderate** variant (AI disabled there) |
| **Build target** | Vue 3 components, front-end codenamed **Miramar**; new emerging design language (**not** current Helix) |
| **AI** | **Mazlan** agent — aspirational today; one concrete foothold in config tooling; disabled in FedRAMP/GovCloud |
| **Certifications** | FedRAMP Moderate, ISO 27001, SOC 2 Type II (per NextGen brief — confirm) |
| **Strategic role** | The platform other Ideagen products are being ported onto (**NextGen**) |
| **Legacy name** | DevonWay (retired externally; public site may still say "Ideagen EHS") |

**Contents:**
[1. TL;DR](#1-tldr-) ·
[2. Positioning](#2-positioning--category-) ·
[3. Personas](#3-personas-) ·
[4. Modules](#4-core-modules-) ·
[5. Workflows](#5-key-end-to-end-workflows--stub--set-confirmed-detail-deferred) ·
[6. Regulatory](#6-regulatory--compliance-environment--with--expansion) ·
[7. Mazlan / AI](#7-ai--mazlan-) ·
[8. Integrations](#8-integrations--ecosystem) ·
[9. Design & Tech](#9-design-system--technical-context-) ·
[10. Glossary](#10-terminology--glossary--with--expansion) ·
[11. Metrics](#11-metrics--kpis-) ·
[12. Roadmap](#12-roadmap--strategic-direction-) ·
[13. Grounding rules](#13-grounding-rules-for-agents-) ·
[14. Sources](#14-authoritative-sources--links)

---

## 1. TL;DR ✅

Ideagen EHSQ Enterprise (**EHSQ-E**) is a highly configurable, workflow-driven platform used by
organizations in heavily regulated industries — nuclear, pharma/life sciences, energy, aviation,
construction, national laboratories, federal agencies, and manufacturing — to manage their
Environment, Health, Safety, and Quality programs. It is primarily cloud-based (with on-premise
and mobile options), spans dozens of interconnected modules, and includes a no-code workflow
engine and form builder so customers can tailor processes without development. It targets
**enterprise** customers only (other Ideagen products serve mid-market and below), and it is the
strategic platform other Ideagen products are being ported onto under the **NextGen** initiative.
Its UI is being **redesigned** around a new, emerging design language (not the earlier "adopting
Helix" plan — see §9), and it is beginning a longer transition toward an AI-native, agentic
experience powered by an agent called **Mazlan** (today largely aspirational — see §7).

---

## 2. Positioning & Category ✅

- **Category:** Enterprise EHSQ management platform for regulated industries. ✅
- **Positioning statement:** *For enterprises in regulated industries, Ideagen EHSQ Enterprise is
  the most capable and most customizable EHS **and** Quality platform on the market — offering
  unparalleled configuration to precisely match each customer's needs, with EHS and Quality
  solutions delivered in one seamless package.* ✅
- **Core value proposition:** Very **deep customization**, with **security, auditability, and
  complex workflow management** baked in. Unlike a cleaner-looking general-purpose tool, EHSQ-E is
  built for regulated environments where audit trails, electronic signatures, traceability, and
  configurable workflows are mandatory rather than optional. ✅

**Named competitors & differentiation** ✅ *(competitor names)* / ⚠️ *(differentiation lines are a
first draft from public positioning — confirm with product marketing before external use)*

The EHS software category has largely consolidated around a handful of enterprise platforms
(VelocityEHS, Cority, Intelex, Enablon, Sphera, Benchmark Gensuite). Against our named competitors:

- **Cority** — the closest true peer: a Canadian **enterprise EHSQ** suite with deep occupational
  health, industrial hygiene, and exposure management, plus mature analytics. *Our angle:* depth of
  **configurability/customization** and a single seamless EHS **and** Quality package. ⚠️
- **VelocityEHS** — strong in **chemical management (SDS)**, ergonomics, and US regulatory (OSHA
  PSM), positioned mid-market **and** enterprise. *Our angle:* enterprise-grade configurability and
  unified Quality, versus a more EHS-/compliance-point-solution footprint. ⚠️
- **MasterControl** — primarily a **QMS for life sciences** (FDA/GxP), not a full EHS platform.
  *Our angle:* EHS **and** Quality in one platform rather than quality-only. ⚠️

*(Also note **Intelex** positions as the unified-EHSQ specialist for food/pharma/medical
devices/aerospace — a comparison likely to come up even though it wasn't named. ⚠️)*

**Strategic angles (NG):**
- **Deployment speed is an open flank** — no competitor leads on deployment speed, so it is an
  available differentiator. (NG)
- **AI leadership is *contested*, not won** — the most actively fought position in the category;
  don't frame AI as a settled EHSQ-E advantage. (NG)
- **External proof point:** cited as a **Verdantix Green Quadrant EHS 2025 Leader** (and strong on
  Document Management). (NG — internal citation; verify against the primary Verdantix report.)
- Emerging competitor to watch: **ETQ / Octave** (ETQ's 2026 spin-out from Hexagon). (NG)

**Market boundaries:** EHSQ-E targets **enterprise** customers in regulated industries. It does
**not** focus on **mid-market and below** — other Ideagen products serve those segments. ✅
Concretely, the enterprise ICP is roughly **$1B+ revenue, 500+ employees, multi-site** (global,
not phased); deals below ~£50K ARR route to other Ideagen products rather than EHSQ-E. (NG —
confirm current thresholds; the source notes competing ICP definitions.)

**Product identity nuance (NG):** the NextGen brief frames "EHSQ Enterprise" specifically as the
**unified EHS + Quality SKU** (~25 solutions), distinct from an **EHS-only** SKU (~20 solutions)
and an **EHSQ Government** SKU; the shared platform carries the internal codename **Decani** and is
built on the acquired **DevonWay** platform as its technical base. This corroborates our
"unified EHS and Quality" positioning — but confirm the SKU taxonomy before asserting it. (NG)

---

## 3. Personas ✅

Six primary personas with fundamentally different mental models and working conditions. Design and
analysis should always be grounded in *which* persona is being served.

| Persona | Context | Key needs |
|---|---|---|
| **Frontline worker** | Mobile, field conditions, may be in PPE | Quick capture (voice, photo, video), minimal friction, clear task lists |
| **Safety manager** | Web, manages programs across sites | Oversight, trend analysis, workflow configuration, reporting |
| **Compliance officer** | Web, regulatory focus | Audit readiness, regulatory tracking, document control, evidence |
| **Plant/site manager** | Web + mobile, operational focus | Dashboards, status visibility, resource allocation |
| **Executive** | Web, strategic focus | KPIs, cross-site comparison, risk posture, automated reporting |
| **System administrator** | Web, configuration focus | Form builder, workflow config, user management, integrations |

> A frontline worker filing a report in the rain wearing gloves has nothing in common with an
> executive reviewing quarterly safety KPIs. Ground every decision in the persona's actual
> working conditions.

**Buyer / buying-committee layer (NG).** The six personas above are *users*. Enterprise EHSQ deals
are **committee-driven**, with a distinct set of *buyer* roles worth designing evaluation
materials and admin/security surfaces for: Economic Buyer (Chief EHS Officer), Champion (Corporate
EHS Director), Functional User, Power/End User, Operations Influencer, **Technical Evaluator**
(Group IT Director — validates FedRAMP/SOC 2/ISO 27001, SSO, data residency), and Gatekeeper
(Procurement). A deal won at Champion level but lost at IT Security or Procurement is still lost.
(NG — confirm before treating as canonical.)

---

## 4. Core Modules ✅ *(representative set — full mapping pending)*

The modules below are a **representative core set**, not an exhaustive catalog. The platform spans
**dozens** of modules across its EHS and Quality solutions.

> **🔎 Provisional — needs a full mapping of solutions and modules.** This list should be replaced
> with (or supplemented by) an authoritative inventory that organizes modules under their
> respective solutions/product areas. Treat the set below as illustrative until that mapping exists.

These modules are **deeply interconnected** — an incident investigation may spawn CAPA items,
trigger a risk reassessment, and require document updates, all in the same platform.

| Module | What it covers |
|---|---|
| **Incident Management** | Reporting, investigation, root cause analysis, follow-up |
| **Audits & Inspections** | Scheduling, execution, findings, corrective actions |
| **CAPA** | Tracking corrective & preventive actions through resolution |
| **Document Control** | Versioning, review/approval workflows, controlled distribution |
| **Training Management** | Assignments, completion tracking, compliance |
| **Risk Assessment** | Risk registers, scoring, mitigation tracking |
| **Management of Change (MOC)** | Change proposals, impact analysis, approval workflows |
| **Permit to Work** | Permit requests, authorization, closure |
| **Work Orders** | Work request submission, assignment, execution, completion |
| **Asset Management** | Equipment tracking, maintenance scheduling |
| **Environmental Compliance** | Monitoring, reporting, regulatory tracking |
| **Observations** | Safety observations, behavioral tracking, trending |

**Additional modules/solutions named in the NextGen brief (NG):** Behavior-Based Safety (BBS),
Occupational Health, SDS Registry, JSA/SWMS, Licenses & Permits, Claims Management, Critical
Controls Management, Event Management, KPI Management, Activity Management, Foundation. Reported
solution counts: **EHS-only ≈ 20 solutions, unified EHSQ ≈ 25**. Reported gaps: **Environmental
Management is only partial**, and Stakeholder/Meeting Management and Emergency Preparedness have no
solution across the EHS portfolio. (NG — fold into the full mapping when it's built.)

**Platform capabilities that span modules:** configurable workflow engine, no-code form builder,
and cross-module search, reporting, and dashboarding. ✅

> **Reality check on "no-code" (NG).** In practice, configuration is **not fully self-service** —
> standing up/changing configuration typically still involves the DevonWay/implementation team
> (see [[what-is-workflow-builder]]). Other reported constraints: **workflow steps are
> sequential-only** (no parallel steps), bulk delete lacks filtering, and there's no centralized
> notifications UI. Design realistically around these limits. (NG — confirm current state.)

---

## 5. Key End-to-End Workflows 🔎 *(stub — set confirmed, detail deferred)*

The **set** of canonical cross-module journeys below is confirmed as the right starting point; the
detailed step sequences are **deferred** and will be filled with SME input in a later pass. Agents
should treat these as the workflows that matter, but should **not** assume specific step-level
behavior until documented.

1. **Incident → Investigation → CAPA → Risk reassessment → Document update** ✅ *(set)*
2. **Audit/Inspection → Finding → Corrective action → Closure/evidence** ✅ *(set)*
3. **MOC proposal → Impact analysis → Approval → Downstream doc/training/risk changes** ✅ *(set)*
4. **Permit to Work request → Authorization → Execution → Closure** ✅ *(set)*
5. **Frontline observation → Trending → Program action** ✅ *(set)*

**When detailed later, each will capture:** trigger, persona(s) involved, module hops, key states
(including non-happy-path: reassignment, escalation, overdue, rejected), and regulatory
touchpoints. 🔎

> **Mazlan in these workflows is aspirational.** Mazlan's capabilities are still evolving and are
> not yet tied into most of the product, so agents should not assume AI assistance at any specific
> workflow step today. See §7. ✅

---

## 6. Regulatory & Compliance Environment ✅ (with 🔎 expansion)

Customers operate where **compliance, auditability, and traceability are non-negotiable.**

**Industries & frameworks:** ✅
- Nuclear energy — NRC
- Pharma / life sciences — FDA, GxP
- Oil & gas, energy, utilities
- Aviation — FAA, SMS
- Construction — OSHA
- National laboratories — DOE
- Federal government agencies
- Manufacturing

**Direct design implications:** ✅
- **Auditability** — every action may need a traceable record; undo/delete semantics differ from
  consumer software.
- **Compliance evidence** — users must *demonstrate* adherence, not just follow process.
- **Accessibility** — many federal customers have **contractual WCAG requirements**; mandatory,
  not aspirational.
- **Data integrity** — GxP environments require electronic records meeting **21 CFR Part 11**
  (electronic signatures, audit trails).
- **Conservative change tolerance** — users are cautious about UI change because mistakes can have
  safety consequences.

**Accessibility standard — specifics** 🔎 *(researched; product-specific target to confirm)*
- **Section 508** (Revised 508 Standards, 36 CFR Part 1194) legally incorporates **WCAG 2.0 Level
  A and AA** as the binding federal benchmark. In practice, most agencies and vendors now test
  against **WCAG 2.1 (or 2.2) AA** for better mobile/cognitive coverage.
- Vendor conformance is typically demonstrated with a **VPAT / ACR** (Accessibility Conformance
  Report).
- **EHSQ-E's committed target is WCAG 2.1 AA / Section 508** — a roadmap **certification target**
  framed as removing a key compliance barrier for government-sector deals (§12). (NG — this is a
  target, not evidence of a current VPAT/ACR.)

**Quality/EHS management standards** *(expanded from the NextGen brief)*
- The domain aligns to **ISO 9001** (Quality), **ISO 45001** (OH&S), and **ISO 14001**
  (Environmental) ✅, plus (NG) **ISO 31000** (risk) and OSHA specifics such as **300/300A/301 logs,
  ITA electronic reporting, PSM 1910.119, HazCom/GHS**; regionally **HSE (UK)**, **WHS Act
  (Australia, incl. 2022 psychosocial-risk update)**, **REACH/CLP**, plus **21 CFR Part 11** and
  **ISO 13485** for regulated verticals. (NG — confirm which EHSQ-E supports vs. ambient context.)

**Platform certifications (NG):** **FedRAMP Moderate ATO** (and reportedly the *only* Ideagen
product with a FedRAMP ATO — its edge for US Federal deals), **ISO 27001**, and **SOC 2 Type II**.
Security posture: TLS 1.2 in transit, AES-256 at rest. (NG — confirm currency of each.)

---

## 7. AI / Mazlan ✅

The product is transitioning to an **AI-native, agentic experience** via a proprietary agent,
**Mazlan**, intended to be incorporated across the product.

> **Maturity note (⚠️ confirmed with owner, 2026-07):** Mazlan is **largely aspirational today** —
> its capabilities are still evolving and are **not yet tied into most of the product**. The one
> concrete foothold is an **agentic pipeline in the configuration tools** for making configuration
> changes via an agent (early but real). Treat the "planned capabilities" below as direction, not
> shipped features, and do not assume AI assistance at any specific step of a live workflow. See
> §12 for the current → planned rollout sequence.

**Capabilities described in product knowledge** ⚠️ *(validate against the maturity note above —
some of these may be pilot/limited rather than broadly shipped):*
- Automated analysis and summarization at key workflow steps (e.g., suggesting risk severity from
  contextual factors).

**Planned capabilities:**
- **Chat experience** — form filling, data querying, report building via conversation.
- **Agentic incident triage** — guides frontline workers to the right record type using voice,
  image, video, or chat input.
- **Dynamic work management** — proactively generated views keeping frontline workers current on
  assigned work, trainings, and planning materials.
- **Proactive management tools** — for admins/supervisors/executives/compliance: dynamic
  visualization, automated reporting and notifications, program management.

**Design tenets:**
- Feels like a **knowledgeable colleague**, not a chatbot.
- **AI suggests, humans decide** — especially for safety-critical actions. *(The NextGen brief
  states this identically: "the AI never makes final decisions. It suggests, explains its
  reasoning, and waits for the user to confirm.")*
- **Multimodal input** — voice, photo, video, text (critical for field workers).
- **Transparent reasoning** — show *why* a recommendation was made.
- **Trust calibration** — help users know when to rely on AI vs. manual review.

**Architecture (NG):** a **three-layer RAG** design — public foundational models → domain
regulatory content (OSHA/ISO/CFR) → customer-specific data — on **AWS Bedrock + LangChain**, with
an **ISO 42001-aligned audit trail** and data-sovereignty options (on-prem / VPC / hybrid) for orgs
that can't send data to external AI APIs. (NG — confirm.)

> **Hard constraint (NG):** **AI/Mazlan features are disabled in FedRAMP / Government Cloud
> environments.** Any AI-dependent design must degrade gracefully to a fully manual path for
> government customers. (NG — confirm, but treat as a live design constraint.)

---

## 8. Integrations & Ecosystem

**Platform & deployment** ✅
- Primarily cloud-based (AWS/Azure), with on-premise deployment options.
- A mobile app exists and is **catching up** with the web experience.
- **Search** was recently re-architected onto **OpenSearch**. ✅ *(Note: the NextGen brief lists an
  older Solr + ElasticSearch stack — our OpenSearch fact is newer and takes precedence.)*
- Generates **emails and notifications** natively. ✅
- **Release cadence (NG):** platform ~every 3 weeks, mobile ~6–8 weeks; 3-tier support model. (NG)

**External systems** *(SSO/integrations detail added from the NextGen brief)*
- **SSO / identity:** supported via **SAML / Azure AD (Entra)**, and **Shibboleth** in at least one
  deployment. (NG — resolves our prior open item; confirm the full supported set.)
- **Analytics / customer success:** integrated with the company's **Gainsight** implementation. ✅
- **Real customer integrations (NG):** the University of Oxford deployment integrates **Microsoft
  Fabric** (data warehouse), **PeopleXD** (HR), **PlanOn** (Estates/EAM), and **Accessplanit**
  (Training) — so ERP/EAM/HR/LMS-type integrations *do* happen in practice (previously "no known
  connection"). (NG — these are deployment-specific, not necessarily productized connectors.)

**APIs (NG)**
- Today: a **generic REST API** and a **Search API**; productized/purpose-built APIs are a noted
  gap. Historically, external data exchange used **"DevonWay Connect"** (CSV over FTP).
- **Ideagen Hub** is the intended single **integration / orchestration gateway** (SSO,
  notifications, cross-product connectivity) rolling out across the portfolio. (NG — confirm scope
  and EHSQ-E's place in the rollout.)

**Portfolio relationships** ✅
- **NextGen initiative:** EHSQ-E is the **target tech stack** that many smaller Ideagen products
  are being **ported onto**. This makes EHSQ-E a strategic platform, not just a product.
- **Mid-market counterpart:** **Ideagen EHS Priya** (includes **ProcessMap**) serves the segments
  EHSQ-E does not target (see §2).
- **Government Cloud:** **Ideagen Government Cloud** is the **FedRAMP-authorized variant of
  EHSQ-E** for government clients — framed here as a deployment/authorization variant. Specifics
  (NG): the authorization is **FedRAMP *Moderate***, EHSQ-E is reportedly the **only Ideagen
  product with a FedRAMP ATO**, **AI/Mazlan is disabled** in these environments (§7), and there may
  be a distinct **"EHSQ Government" SKU** — confirm whether that is the same thing under a different
  name or a separate scope. (NG)
- **Adjacent / subordinate Ideagen products** (portfolio context): Ideagen Quality Management,
  Quality Control, Supplier Management, Supply Chain, Safe Food, Workforce Safety, Aviation Safety,
  Maritime, Machine Safety, Healthcare Guardian, Internal Audit, Risk Management, Audit Analytics,
  Disclose, Carbon Accounting, Audit Quality, Regulatory Intelligence, Procedure Management,
  Compliance, PleaseReview, Collaboration Portal, Mail Manager, Smartforms, Learning, Workplace
  Training, Policy Logic, Envirosuite, Wearable Safety, and Beakon. ✅
  *(🔎 exact relationship of each — integrated, adjacent, or being ported under NextGen — to be
  refined.)*

---

## 9. Design System & Technical Context ✅

- The current product front-end is built in **Vue 3, codenamed Miramar.** ✅
- Some customers still run the **legacy UI that predates Miramar**; they will be **forced to
  upgrade in 2027.** ✅
- UI is **mixed/evolving** — legacy areas coexist with modernized sections.
- This is the **second modernization effort**; the team is experienced with migration challenges.
- The **mobile app is catching up** with web.
- Prototypes are built as **Vue 3 components** (i.e., aligned with the Miramar front-end).
- Forms are **customer-configured** — designs must accommodate variable form structures.
- **Platform provenance (NG):** the platform carries the internal codename **Decani** and is built
  on the acquired **DevonWay** platform (acquired ~Sept 2023) — so "DevonWay" is not just a retired
  name but the actual technical base. (NG)
- **Stack (NG):** two web UIs coexist — **"Classic"** and **Miramar** (Vue.js); native apps on iOS
  (Swift), Android (Kotlin), Windows (C#); back-end services on **Java/Tomcat** with **RabbitMQ**
  messaging and a **Job Server** (imports, search indexing, thumbnails, record sync); **SQL Server**
  for module data; reporting via **SSRS + Highcharts**. Resilience targets **RPO 1hr / RTO 4hr**.
  (NG — the "Classic" UI here is likely the pre-Miramar legacy UI referenced above.)

> **Design-system direction (⚠️ supersedes the skill, confirmed with owner 2026-07):** The earlier
> "adopting Helix" framing is **out of date.** Helix adoption is **not** the current plan. The team
> is moving toward a **new, emerging design system** inspired by recent **Mazlan prototypes** and
> the internal **Praxis** project, and — with Claude Code now in the picture — Helix itself is
> being reinvented. EHSQ-E may **inform the next Helix** rather than conform to the current one.
> Until the new system is named and documented, do not assume Helix component parity is a goal.
> See §12.

**Design principles:** ✅
1. **Trust, safety, and reliability** — the UI must feel dependable; flashy/trendy choices that
   undermine perceived reliability are wrong for this context.
2. **Simplicity and clarity** — simplify the experience, not the capability.
3. **Accessibility first** — WCAG compliance is contractual.
4. **Progressive disclosure** — don't overwhelm newcomers; don't hide power from experts.
5. **Consistency** — align with the team's emerging design language (see the direction note above),
   not the current Helix, until the new system is documented.

---

## 10. Terminology / Glossary ✅ (with 🔎 expansion)

Standard EHS/quality terminology used across the product: ✅

- Incidents, events, occurrences
- Findings, observations
- Corrective actions, preventive actions, **CAPA**
- Audits, inspections, assessments
- Permits, work orders, work requests
- Risk assessments, risk registers
- **Management of Change (MOC)**
- Nonconformances, deviations
- **Root cause analysis (RCA)**
- **Key Performance Indicators (KPIs)** — leading/lagging indicators

**Product- & Ideagen-specific terms:**

| Term | Meaning |
|---|---|
| **EHSQ-E** | Ideagen EHSQ Enterprise (this product); the **unified EHS+Quality SKU** per the NextGen brief (NG) |
| **DevonWay** | Retired product name **and** the acquired platform that is EHSQ-E's technical base (§9) ✅/(NG) |
| **Decani** | Internal codename for the EHSQ-E / DevonWay platform (§9) (NG) |
| **Ideagen Hub** | Intended cross-product integration/SSO/orchestration gateway (§8) (NG) |
| **Mazlan** | Ideagen's proprietary AI agent being introduced across the product (§7) ✅ |
| **NextGen** | Initiative to port other Ideagen products onto the EHSQ-E platform (§8, §12) ✅ |
| **Government Cloud** | FedRAMP-authorized variant of EHSQ-E for government clients (§8) ✅ |
| **Priya** (Ideagen EHS Priya) | Mid-market EHS counterpart; includes **ProcessMap** (§8) ✅ |
| **Contextual Awareness** | The "concierge UI" project; future home of a Mazlan dashboarding agent (§12) ✅ |
| **Miramar** | Codename for the current **Vue 3 front-end**; legacy UI predates it (§9) ✅ |
| **Praxis** | Internal project informing the new emerging design language (§9, §12) ✅ |
| **SPC** | Statistical Process Control — quality-domain capability on the roadmap (§12) ✅ |
| **Helix** | Ideagen's design system; adoption is **no longer the plan** — see §9 ✅ |
| **VPAT / ACR** | Accessibility Conformance Report documenting WCAG/508 conformance (§6) ✅ |
| **21 CFR Part 11** | FDA rule for electronic records/signatures in GxP environments (§6) ✅ |

🔎 **Still to add:** what "Mazlan" refers to/stands for, and exact in-product module display names. ⚠️

---

## 11. Metrics & KPIs ✅

Distinguish, and always make actionable for the persona viewing them:
- **Leading indicators** — e.g., observations filed, training completion rates.
- **Lagging indicators** — e.g., incident rates, CAPA closure times.

**🔎 To add:** the specific KPIs surfaced in-product dashboards per persona, if we want the brief
to be prescriptive. ⚠️

---

## 12. Roadmap / Strategic Direction ✅

**Near-term priorities (next ~2–4 quarters):** ✅
- **Reporting Agents**
- **Unassigned records visibility**
- **Responsive layouts**
- **Contextual Awareness** — the "concierge UI" project (home for a Mazlan dashboarding agent)
- **SPC data** and **SPC real-time** (Statistical Process Control, quality domain)
- **Rich text support**
- **WCAG 2.1 AA / Section 508 conformance** — a certification target framed as removing a key
  compliance barrier for government-sector deals (§6) (NG)
- **Integration Framework** (ties to §8 — the maturing integration/API story)
- **Mobile Agents**

**Strategic themes:**
- **NextGen initiative** — EHSQ-E as the platform other Ideagen products are ported onto (§8) is a
  major, ongoing area of activity. Detailed sequencing/end-state: 🔎 to source.
- **Design-system redesign (supersedes prior "Helix adoption" narrative — see §9):** the team is
  pushing into a **new, emerging design system**, inspired by recent **Mazlan prototypes** and the
  internal **Praxis** project. Notably, EHSQ-E may **inform the next generation of Helix**
  rather than simply adopt it — Helix itself is being reinvented in light of Claude Code entering
  the picture. ✅
- **Mazlan trajectory (concrete → planned):** ✅
  - **Now (earliest foothold):** an agentic pipeline in the **configuration tools** for making
    configuration changes via an agent — early but real.
  - **Soon:** a **general chat UI** for exploring data, answering questions, and kicking off
    workflows.
  - **Concierge UI (Contextual Awareness project):** a **dashboarding agent**.
  - **Later this year:** Mazlan as a **search augment**.

---

## 13. Grounding Rules for Agents ✅

How agents (and humans) should apply this brief when doing work for EHSQ-E:

- **Prototyping** — ground designs in realistic EHSQ scenarios with realistic field names, data,
  and workflows. Cover the full lifecycle (reassignment, escalation, overdue actions, rejected
  submissions), not just the happy path. Consider offline/low-connectivity for mobile. Build as
  Vue 3 components. **Design within known limits (NG):** mobile currently syncs only ~50 assigned
  records, records can take >30s to open, and web↔mobile can desync; workflow steps are
  sequential-only; and **AI must degrade to a manual path for government/FedRAMP users** (§7).
- **Usability evaluation** — frame heuristics through this platform's constraints: regulatory
  auditability, mixed persona needs, configurable workflows, high cost of errors.
- **Journey mapping** — trace workflows across modules (see §5); include regulatory and emotional
  dimensions (a safety manager responding to a serious incident is under pressure to get it right).
- **Competitor analysis** — weigh regulated-industry requirements (audit trails, e-signatures,
  configurable workflows) that differentiate EHSQ-E from general-purpose tools. Use the named
  competitors and differentiation angles in §2 (Cority, VelocityEHS, MasterControl; Intelex as a
  likely comparison) as the starting frame. Remember (NG): **deployment speed** is an unclaimed
  differentiator, and **AI leadership is contested** — don't assume it as a settled advantage.
- **Metrics** — separate leading vs. lagging; make them actionable for the viewing persona.
- **Research synthesis** — connect findings back to specific personas and their working contexts.

**Hard rules:**
- Respect **auditability** — never design undo/delete like consumer software.
- Treat **WCAG compliance** as mandatory.
- **AI suggests, humans decide** for safety-critical actions.

---

## 14. Authoritative Sources & Links

*The brief is meant to be a hub, not a dead end. Internal links are confirmed; external links were
found via research and still need canonical-URL verification.*

**Internal / skills**
- Product-knowledge skill: `what-is-ehsqe` (this brief's verified source; to be regenerated *from*
  this brief). ✅
- Related internal project: **Workflow Builder** (`what-is-workflow-builder`; formerly Monaco AI
  Implementation Toolkit / Meridian) — the configuration/implementation tooling context, and the
  likely home of Mazlan's config-tools foothold (§7, §12). ⚠️ *(confirm relationship)*

**Public / external** 🔎 *(found via research; verify canonical URLs)*
- Product page (public): <https://www.ideagen.com/products/ideagen-ehs> and legacy
  <https://www.ideagen.com/products/devonway>. ⚠️
- Ideagen Luminate community — "Ideagen EHSQ Enterprise (formerly the DevonWay platform)":
  <https://community.ideagen.com/ideagen-ehsq-enterprise-formerly-the-devonway-platform-123>. ⚠️
- Mobile apps: Apple App Store & Google Play ("Ideagen EHSQ Enterprise"). ⚠️

> **⚠️ Naming inconsistency to resolve:** public Ideagen marketing currently refers to this product
> as **"Ideagen EHS"** (formerly DevonWay), while internal/current usage is **"Ideagen EHSQ
> Enterprise."** Confirm the canonical external name before this brief is shared beyond the team.

**Internal docs (NG)**
- Solution documentation (BBS, Event Management, Incident Management, Licenses & Permits, Risk
  Assessment, SDS Registry, …) lives in **Confluence, the "DEVON" space**:
  `ideagen.atlassian.net/wiki/spaces/DEVON`. (NG — verify access/scope.)
- Peer document: the **Ideagen NextGen Platform Product Context Brief** (source of the (NG)-tagged
  content in this brief).

**Still to source** 🔎
- The emerging design-system reference (post-Helix direction — §9). ⚠️
- Support / documentation portal. ⚠️

---

## Status & remaining work

**Done:** verified core ported; §2/§8/§12 owner-confirmed; §5 confirmed as a stub; research pass
folded in; agent-optimization layer added; Helix/Mazlan contradictions reconciled; **NextGen
Platform brief mined** — SSO, APIs/Ideagen Hub, certifications, ISO/WCAG specifics, tech stack,
Mazlan architecture, ICP, buyer committee, module expansion, and identity/SKU nuance folded in,
all tagged **(NG)** pending confirmation.

**Decisions locked:**
1. ✅ **Brief ↔ skill** — this brief is the **new source of truth**; `what-is-ehsqe` to be
   regenerated from it, and content reused elsewhere.
2. Confidential NextGen metrics (NPS, MAU, revenue-vs-plan, NRR) **deliberately excluded** from
   this company-wide brief.

**Open — needs a person, not more drafting:**
3. **Confirm the (NG) content** — it comes from another team's brief; verify against engineering/
   marketing before re-tagging ✅. Watch the flagged tensions: Solr/ElasticSearch vs. our
   OpenSearch (keep ours), any "Live" Mazlan claims vs. our "aspirational," and Government Cloud
   variant-vs-SKU.
4. **🔎 Still genuinely unknown** — full **solutions-and-modules mapping** (§4), §5 workflow step
   sequences, document-storage internals, current VPAT/ACR status, canonical external product name.

**Next mechanical step (when ready):** regenerate the `what-is-ehsqe` skill from this brief
(now that substantial (NG) content is in, worth a refresh once it's confirmed).
