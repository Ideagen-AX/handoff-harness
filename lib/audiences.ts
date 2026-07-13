import type { Audience } from "./types";

// The five confirmed downstream audiences for the comms fan-out.
// Each maps to a spec file in specs/audiences/ that defines its voice, format,
// must-include, and must-avoid. Edit those .md files to tune the output — no
// code change required.
export const AUDIENCES: Audience[] = [
  { id: "design-system", label: "Design System team", specFile: "design-system.md" },
  { id: "product-docs", label: "Product documentation", specFile: "product-docs.md" },
  { id: "support-summary", label: "Support & Technical Account Managers", specFile: "support-summary.md" },
  { id: "qa", label: "QA", specFile: "qa.md" },
  { id: "release-notes", label: "Release notes", specFile: "release-notes.md" },
  { id: "analytics-plan", label: "Analytics & success plan", specFile: "analytics-plan.md" },
  { id: "one-pager", label: "1-Pager", specFile: "one-pager.md" },
  { id: "slide", label: "Slide", specFile: "slide.md" },
  { id: "case-study", label: "Case study", specFile: "case-study.md" },
];
