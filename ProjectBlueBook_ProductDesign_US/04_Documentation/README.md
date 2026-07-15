# 04 · Documentation — README

**The two-minute read for someone who has never seen this harness.**

- **What it is:** The **Handoff Harness** — a purpose-built agent harness that takes one finished design prototype and produces a single canonical *change brief*, then fans that out into a tailored, review-ready draft for every downstream audience a UX change touches.

- **The process it automates:**
  - **Before →** After every UX change, a designer hand-writes the same change up to a dozen times — release notes, QA test cases, product docs, a support summary, a design-system update, a developer handoff, an analytics plan, an exec slide/one-pager, a case study. Each is re-explained from scratch, in a different voice, from memory. It takes hours per change, only the designer can do it, and the versions drift apart.
  - **After →** The designer points the harness at the prototype (plus an optional baseline), adds a short structured note, and clicks **Generate**. The harness diffs the change, writes one change brief, captures the screens, and drafts all the artifacts in parallel — each in the right voice, grounded in real EHSQ-E product and design-system knowledge. The designer reviews, edits, and approves. Nothing leaves the room without a human.

- **The floor, evidenced:** context base ✓ · **9 skills** (audience/artifact generators) + a tool-loop Understand agent ✓ · **Vercel AI Gateway → Claude** live ✓ · **read-only codebase + prototype connectors** live ✓ · end-to-end run streaming into a **human review-and-approve UI** with a guardrails register ✓

- **How to run it (happy path):**
  1. `npm install`, add a Vercel AI Gateway key to `.env.local`, `npm run dev`, open `http://localhost:3000`.
  2. The form is pre-filled with a real demo case (the Praxis Search-toolbar restyle). Pick a demo case from the dropdown, or paste your own prototype URL + baseline + note.
  3. Click **Generate handoff**. Watch the change brief, captured screens, and the grouped artifact drafts stream in.
  4. Review each artifact, edit inline, approve, and export (Markdown, `.docx`, `.pptx`, `.pdf`, `.eml`).

- **Who owns it:** Built by **Project Blue Book** (Product & Design, US hub) — Brian Studwell (build) and Adam Main (front-end). Runs per-change, on demand, whenever a prototype is ready for handoff.
