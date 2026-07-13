# Audience spec — Analytics & success plan

**Who they are:** The product manager and the analytics/insights team who will decide
whether this change worked. They will instrument it — most likely in **Gainsight PX** —
and review the numbers after release. They need a concrete, testable starting point, not
a finished measurement framework.

**What they care about:**
- A crisp definition of what success looks like for *this* change
- Testable hypotheses tied to observable behaviour
- Metrics that are realistically instrumentable (page/feature usage, adoption, funnels,
  retention) rather than aspirational ones we can't measure
- Guardrail metrics — what should NOT get worse
- Honesty about what we can't yet measure

**Tone:** Analytical, plain, structured. No hype. Hypotheses stated so they can be
proven false.

**Format:**
1. **What success looks like** — 2–4 sentences translating the brief's `intendedOutcomes`
   into plain success statements
2. **Hypotheses** — a numbered list. Each hypothesis in the form:
   *"Because we [change], we expect [persona] to [observable behaviour], measured by
   [signal], moving [direction] toward [target]."* Draw from `successMetrics`; mark any
   target as **TBD** where the brief can't justify a number.
3. **Metrics table** — `Metric | Signal / PX event to instrument | Direction | Baseline | Target | Type (primary / secondary / guardrail)`
4. **Instrumentation notes (Gainsight PX)** — the concrete events, features, or pages to
   tag; where a custom event is needed vs. what PX captures automatically
5. **Guardrails** — metrics that must hold steady (e.g. task-completion time, error rate,
   support ticket volume)
6. **Open measurement questions** — anything from `openQuestions` that blocks clean
   measurement, plus anything not currently instrumentable

**Must include:**
- Success stated in user/business terms before any metric
- Hypotheses that are falsifiable and tied to a specific signal
- At least one guardrail metric
- Explicit **TBD**s rather than invented targets

**Must avoid:** Vanity metrics with no decision attached, targets pulled from thin air,
implying certainty the data can't yet support.

---

**Example (responsive-search) — abbreviated:**

> **What success looks like:** Users complete search-and-filter tasks on small viewports
> without hidden controls, and increasingly pick the view mode that fits their task rather
> than defaulting to the list.
>
> **Hypotheses:**
> 1. Because we added six view modes, we expect analysts to adopt non-list views, measured
>    by the share of searches with a view-mode switch event, increasing from baseline
>    (**TBD**) within 90 days.
> 2. Because filter panels now adapt to the viewport, we expect small-screen users to
>    complete more filtered searches, measured by filter-apply events on <768px sessions,
>    increasing.
>
> **Metrics**
> | Metric | PX event | Direction | Baseline | Target | Type |
> |---|---|---|---|---|---|
> | Non-list view adoption | `view_mode_selected` | ↑ | TBD | TBD | Primary |
> | Small-screen filter completion | `filter_applied` (viewport<768) | ↑ | TBD | TBD | Primary |
> | Search task time | session duration to first result open | ↔ | TBD | no regression | Guardrail |
>
> **Guardrails:** Search task time and result-open rate must not regress for existing
> list-view users.
