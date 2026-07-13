# Audience spec — Case study

**Who they are:** Internal readers who want the *considered* story of the change — design
leadership, peers, portfolio reviews, an internal blog post. They want to understand not
just what changed but why, what was weighed, and what it produced. This is the longest
narrative artifact.

**What they care about:**
- The context and the real problem, told properly
- The change itself, narrated (not a bullet dump)
- **The decisions and tradeoffs** — the reasoning trail that shows this was considered,
  not accidental
- Before/after made visual
- The outcome we expect, and a way to see it for themselves

**Tone:** Reflective, honest, well-written prose. Confident but candid about tradeoffs and
what's still open. British spelling, full product names. Not promotional — earned, not sold.

**Format:** ~400–800 words, in this order:
1. **Title + one-liner**
2. **Context / the problem** — expand `why` into a proper opening; make the stakes real
3. **What we changed** — narrate the change (draw on `whatChanged`, `userVisible`), prose
   over bullets
4. **Decisions & tradeoffs** — the heart of the piece. Walk through the `decisionLog`:
   each notable decision, the alternatives weighed, and what was honestly given up. Do not
   flatten this into "we chose the best option" — show the tension.
5. **Before → after** — reference the paired `beforeAfter` states with the relevant
   `visualManifest` screenshots (by `screenKey`) as annotated before/after visuals
6. **Outcome & proof** — the `intendedOutcomes`; a prototype link placeholder and, where
   available, an embedded walkthrough video
7. **What's next / open questions** — the honest `openQuestions` and any deferred work
   (e.g. from decision tradeoffs)

**Must include:**
- A genuine decisions-and-tradeoffs section built from `decisionLog`, alternatives shown
- Before/after tied to specific visuals
- Intended outcomes and a way to view the work (prototype/video)
- Honest open questions

**Must avoid:** Marketing gloss, pretending there were no tradeoffs, burying uncertainty,
component/code minutiae that don't serve the story.

---

**Example (responsive-search) — abbreviated:**

> ## Search that fits the job
> *Six result views and viewport-adaptive filtering, across the record modules.*
>
> **The problem.** Search had one fixed layout. On a tablet it broke; for a quality analyst
> comparing dozens of CAPAs it showed the same list as for someone scheduling a single
> audit. One presentation, many jobs — and it served none of them well on smaller screens.
>
> **What we changed.** … *(narrative)* …
>
> **Decisions & tradeoffs.** We chose six fixed view modes over a configurable view builder.
> A builder would have been more powerful, but it carried a heavy design and QA surface and
> risked overwhelming the everyday user; six curated views cover the known jobs today — at
> the cost of power users not yet being able to compose a bespoke view. We also let panels
> change presentation by viewport rather than a single fluid reflow, accepting more states
> to test in exchange for keeping filters usable on small screens.
>
> **Before → after.** *[before: fixed list on a narrow screen] → [after: `filter-drawer-mobile`]* …
>
> **Outcome & proof.** We expect more searches to use a non-list view and small-screen
> filtering to rise. Prototype: [link]. Walkthrough: [video].
>
> **What's next.** View-mode persistence per user is unconfirmed; a configurable builder
> remains a possible future step.
