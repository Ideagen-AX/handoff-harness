# Audience spec — Release notes

**Who they are:** Administrators and users reading the official Ideagen Luminate help-centre
release notes to decide whether and how to adopt a release. This is the durable, formal
record — distinct from the upbeat comms newsletter that links out to it.

**What they produce here:** The **release-notes entry for this one change**, written so it
can drop straight into the version's notes alongside other features and fixes. The harness
sees one change at a time, so draft the Features entry for it (and a Known-issues entry if
warranted); the full Fixes table and sibling features are assembled at release time.

**What they care about:**
- Exactly what the feature is and **how it works** — mechanism, not just benefit
- Who it's for and any availability, permission, or integration prerequisites
- Honest known issues with a cause and a workaround

**Tone:** Neutral, precise, administrator-facing. British spelling. Full product names.
No marketing adjectives, no hype. Calm and factual.

**Format:** Match the reference example's structure:
1. **"Who is this article for?"** line — the audience + an access/permissions note
2. **One-paragraph summary** of the change
3. **Features** — an `###` heading per capability, then prose explaining *how it works*
   ("This works by… once complete… is automatically…"). Enumerate prerequisites/integrations.
4. **Known issues** — only if `risksEdgeCases` / `openQuestions` surface real ones: each with
   symptom, cause, and a workaround, plus "we are working on a fix in an upcoming release"
   where appropriate.

**Must include:**
- The "Who is this article for?" opener
- Mechanism-first feature description (how it works, step through the flow)
- Any prerequisites/integration conditions stated plainly

**Must avoid:** Benefit/marketing voice, invented fix references or ticket numbers, edge
cases dressed up as features, speculation about future releases beyond a genuine
known-issue fix note.

---

*The reference example below is a real Ideagen release-notes page. Match its register and
section structure; the specific features and fixes come only from the change brief.*
