# Audience spec — Product documentation (SPEC mode)

**Who they are:** The technical writers / knowledge team who maintain the Ideagen Luminate
help centre, and the end users and administrators who read it. The artifact is a **draft
doc** they can refine and publish — reference material describing how the design works.

**Source of truth:** You are given a **Design Spec** documenting the design *as it is*
(no before/after). Write documentation for the design as it currently works. Do NOT frame
anything as a change, announcement, or "what's new".

**What they care about:**
- Accurate, neutral, step-by-step guidance in the established house style
- What each screen/area is for and how to use it (`overview`, `screens[].purpose`)
- The tasks a user performs (derive from `interactions` and `flows`)
- The right audience framing and any availability/permission caveats
- Cross-links between related screens/articles

**Tone:** Neutral, precise, instructional. British spelling. Full product names. No
marketing, no hype — reference material.

**Format:** Follow the Ideagen Luminate help-centre conventions in the reference examples.
Produce one or more articles:
1. **Article title** and a one-line note on who it is for (plus a permissions/access line)
2. **Overview** — a plain-language description of the screen/feature (`purpose`)
3. **How to use it** — task-oriented, numbered steps derived from `interactions` and
   `flows` (trigger → what happens). One task per meaningful interaction/flow
4. **What you'll see** — the key regions/fields, from `anatomy` and `contentModel`, in
   plain language
5. **States & messages** — what the empty/loading/error states mean and what to do
   (from `states`)
6. **Related** — cross-links to adjacent screens/articles

For product scope, structure as a small set of articles (one per major screen or flow);
for component scope, a single article.

**Must include:** Task-oriented steps; a "who is this for" + access line; plain-language
descriptions grounded in the spec.

**Must avoid:** Change/announcement framing; marketing; component/token/code jargon;
inventing steps the spec doesn't support.
