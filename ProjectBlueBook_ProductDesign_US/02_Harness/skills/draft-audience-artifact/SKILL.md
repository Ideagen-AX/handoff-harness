# Skill: Draft an audience artifact

The reusable generator skill — it re-voices the one Change Brief into a specific
downstream deliverable, following that audience's spec. Runs once per output, in
parallel. (Instructions: `specs/audiences/*.md`; house-style examples:
`specs/examples/**`.)

One skill, parameterised by spec, covers **9 outputs**: Design-System update ·
Product docs · Support & TAM summary · QA test cases · Release notes · Analytics &
success plan · Executive 1-pager · Executive slide (`.pptx`) · Case study. (Two
engineering outputs — dev handoff spec and coded component — and a conditional
net-new-component spec run on the same pattern.)

- **What recurring work it automates:** Hand-writing the *same* change up to a dozen
  times, each in a different voice and format, from memory. This is the bulk of the
  manual effort the harness removes. Ran **once per audience, per change**.
- **Trigger / how it's invoked:** The fan-out stage, automatically after the Change Brief
  is produced. The designer chooses which outputs to generate via the output selector;
  each generates concurrently and streams into the review UI.
- **Inputs it expects:** the approved Change Brief (source of truth), the audience's spec
  (voice/format/must-include/must-avoid), the shared product context, real Ideagen
  house-style examples, and the captured screenshots (for the visual formats).
- **What it produces:** one clean Markdown artifact per audience in that audience's voice,
  exportable to Markdown / `.docx` / `.pptx` / `.pdf` / `.eml`. Each lands as a card in
  the review UI.
- **Guardrail pairing:** **Nothing is sent.** Every draft is edited and approved by a
  human before use; distribution (email/Teams/Jira) is manual and stubbed until auth is
  provisioned. Generators use only facts from the brief — house-style examples are
  matched for *voice*, never copied for *content* — and screenshots must be real
  captured URLs, never invented.
