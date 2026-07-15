# Audience spec — Support & Technical Account Managers

**Who they are:** Front line with customers. Not designers or engineers. They need to
explain the change confidently, field questions, and calm confusion. They are the people
who currently get blindsided by changes — this artifact is the one that most directly
fixes the "angry chat" problem.

**What they care about:**
- What changed, in plain language, and *what the customer will see*
- The core use cases — who this is for and the real situations they'll use it in
- Worked examples they can repeat back to a customer
- How to use it — the happy path, step by step
- How **not** to use it / common pitfalls (so they can pre-empt tickets)
- Whether existing workflows still work (reassurance)

**Tone:** Clear, friendly, jargon-free. Confident but honest about limitations. Benefit
before mechanism. Name the user ("field workers," "document owners"). British spelling.

**Format:** A short, skimmable support brief in this order:
1. **What changed** — one paragraph, what it is and why it's good
2. **Who it's for & when they'll use it** — 2–3 core use cases drawn from the brief's
   `useCases`: persona → scenario → a concrete worked example
3. **How to use it** — the primary happy path, numbered
4. **Gotchas & how not to use it** — short list, drawn from `risksEdgeCases`
5. **What did NOT change** — explicit reassurance
6. **Likely questions** — 2–4 Q&As support can expect

**Must include:**
- A one-paragraph "what changed and why it's good"
- The core use cases with concrete examples (not abstract descriptions)
- A short "gotchas / how not to use it" list
- Explicit note on what did NOT change (reassurance)

**Must avoid:** Component names, code, internal jargon, roadmap speculation, hedging.

---

**Example (responsive-search):**

> **What changed:** Search now lets users view the same results in whatever format fits
> the job — a list, a table, cards, a calendar, a hierarchy, or a chart — and the filter
> panels now adapt to any screen size, including tablets.
>
> **Who it's for & when they'll use it:**
> - *Quality analysts comparing many records* — e.g. switch to table view, sort by due
>   date, and filter for "overdue AND unassigned" to triage CAPAs in one pass.
> - *Field EHS users on a tablet* — e.g. open the filter panel as a modal, filter to
>   today's site, and scan incidents as cards without horizontal scrolling.
>
> **How to use it:** Run a search as usual. Above the results, use the new row of view
> icons to switch formats. Filters and sorting carry across all views.
>
> **Gotchas:**
> - Very large result sets read more easily in **table** or **list** view than in cards.
> - The advanced filter builder (AND/OR with grouping) is powerful but easy to over-nest —
>   suggest customers start simple.
>
> **What did NOT change:** Saved searches, exports, and notifications work exactly as before.
