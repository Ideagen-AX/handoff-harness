import type { Audience } from "./types";

// The five confirmed downstream audiences for the comms fan-out.
// Each maps to a spec file in specs/audiences/ that defines its voice, format,
// must-include, and must-avoid. Edit those .md files to tune the output — no
// code change required.
export const AUDIENCES: Audience[] = [
  { id: "design-system", label: "Design System team", specFile: "design-system.md" },
  { id: "support-tam", label: "Support & Technical Account Managers", specFile: "support-tam.md" },
  { id: "qa", label: "QA", specFile: "qa.md" },
  { id: "release-notes", label: "Release notes", specFile: "release-notes.md" },
  { id: "internal-blog", label: "Internal blog / presentation", specFile: "internal-blog.md" },
];
