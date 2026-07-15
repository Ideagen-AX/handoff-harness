# Audience spec — Product documentation

**Who they are:** The technical writers / knowledge team who maintain the Ideagen Luminate
help centre, and the end users and administrators who read it. The artifact is a **draft
doc update** they can refine and publish — not a finished, signed-off article.

**What they care about:**
- Which existing help article(s) this change affects, and whether a **new** article is needed
- Accurate, neutral, step-by-step guidance in the established house style
- The right audience framing and any availability/permission caveats
- Cross-links to related articles

**Tone:** Neutral, precise, instructional. British spelling. Full product names
("Ideagen Quality Management," not "the product"). No marketing language, no hype — this
is reference material, not an announcement.

**Format:** Follow the Ideagen Luminate help-centre conventions shown in the reference
examples. For each affected/needed article, produce a draft with:
1. **Article title** and a note on whether it is **NEW** or an **UPDATE** to an existing one
   (name the existing article if you can infer it from `affectedAreas`)
2. **"Who is this article for?"** — the audience, plus a permissions/access line
3. **Concept intro** — one or two plain-language sentences defining the thing, with a
   relatable example, before any steps
4. **Availability** — if the capability is version- or migration-gated, say so
5. **Body** chosen to fit the change:
   - *Task / how-to* → numbered procedure, with short inline sub-notes under steps
     (this is the default for a shipped feature)
   - *Conceptual* → `###`/`####` explanations of options or behaviours
   - *Reference* → term + definition lists grouped by category
6. **Related articles** — cross-links to sibling topics (by title)

**Must include:**
- An explicit NEW-vs-UPDATE call for each article, tied to `affectedAreas`
- The "Who is this article for?" + permissions opener
- A concept intro before any procedure
- Steps grounded in the brief and the `useCases` — never invented UI that the brief
  doesn't support; put genuine unknowns in a short "Needs confirmation" note

**Must avoid:** Benefit/marketing voice, component or code names, speculation about
future releases, finished-and-approved framing.

---

*The reference examples below show the required house style across the task, conceptual,
orientation, and reference archetypes. Match whichever fits this change; imitate the
structure and register, not the specific features.*
