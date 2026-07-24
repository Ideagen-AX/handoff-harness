// Pre-built demo cases that populate the generator's setup fields, so someone can
// pick one and watch a full run without typing anything. Selecting a case is
// optional; "Custom" leaves the fields as-is. Add new cases here.
export type DemoCase = {
  id: string;
  label: string;
  projectName: string;
  url: string;
  baselineUrl: string;
  subject: string;
  componentSelector: string;
  designDescription: string;
  projectContext: string;
  focusAreas: string;
  designDecisions: string;
  designSource: string;
  framework: string;
  mode?: "compare" | "spec"; // absent = compare
  specScope?: "component" | "product"; // spec mode only
};

export const DEMO_CASES: DemoCase[] = [
  {
    id: "toolbar",
    label: "Search toolbar — Nexus restyle",
    projectName: "Nexus Toolbar",
    url: "https://forge-demo-toolbar-after.vercel.app/",
    baselineUrl: "https://forge-demo-toolbar-before.vercel.app/",
    subject: "Search page toolbar",
    componentSelector: ".toolbar",
    designDescription:
      "The Search page toolbar, restyled to the Nexus design language: rounder, gradient-filled controls, refined icons, and a first-class dark mode. The control set and spacing are unchanged.",
    projectContext:
      "Part of the wider EHSQ-E reskin toward the Nexus design language. This toolbar appears on Search pages across multiple modules (Incidents, Audits, CAPA, MOC).",
    focusAreas:
      "Fidelity of the visual restyle to Nexus; the new dark-mode variant; accessibility (aria labels, visible focus); and the responsive collapse into Tools/Options menus.",
    designDecisions:
      "Kept the control set and spacing unchanged to avoid retraining users. Added a first-class dark variant. The selected display mode now uses a gradient + shadow to read as active.",
    designSource: "ehsqe-ds",
    framework: "vue",
  },
  {
    id: "filter-drawer",
    label: "Search filter drawer — Nexus redesign",
    projectName: "Nexus Filters",
    url: "https://filter-drawer-after.vercel.app/",
    baselineUrl: "https://filter-drawer-before.vercel.app/",
    subject: "Search filter drawer",
    componentSelector: ".filter-drawer",
    designDescription:
      "The Search filter drawer, redesigned in the Nexus design language — the right-hand panel for building and applying filters, with restyled filter rows, date controls, and a 'more filters' section.",
    projectContext:
      "Part of the EHSQ-E reskin toward Nexus. The filter drawer opens from the Search toolbar across modules to refine result sets.",
    focusAreas:
      "Fidelity of the drawer restyle to Nexus; the filter-row and date interactions; the apply / clear affordances; and the drawer's responsive behaviour.",
    designDecisions:
      "Restyled to Nexus without changing the underlying filter model. (Edit to add the specific decisions and rationale for this redesign.)",
    designSource: "ehsqe-ds",
    framework: "vue",
  },
  {
    id: "calendar",
    label: "Search results calendar — Nexus redesign",
    projectName: "Nexus Calendar",
    url: "https://ehsq-e-calendar-prototype.vercel.app",
    baselineUrl: "https://calendar-search-recreation.vercel.app",
    subject: "Search results calendar view",
    componentSelector: ".results-card",
    designDescription:
      "The CAPA Search results, redesigned to present matching records as a monthly calendar — a month grid (.cal-month) with records placed on their due/scheduled dates — as an alternative to the list/table output, in the Nexus design language. Covers the results card, the month grid, and per-day record chips.",
    projectContext:
      "Part of the EHSQ-E reskin toward Nexus. Search results across modules (Incidents, Audits, CAPA, MOC) gain a calendar view alongside the existing list/table, so date-bound work can be seen in time. This prototype shows the CAPA Search page.",
    focusAreas:
      "Fidelity of the calendar view to Nexus; the month grid and how records/chips render on their dates; empty vs dense days; responsive behaviour; and accessibility (keyboard navigation of the grid, aria labels).",
    designDecisions:
      "Presented date-bound search results on a month grid rather than only a list, so scheduling and clustering are visible at a glance, without changing the underlying search/filter model. (Edit to add Adam's specific decisions and rationale.)",
    designSource: "ehsqe-ds",
    framework: "vue",
  },
  {
    id: "toolbar-spec",
    label: "Search toolbar — full spec (spec mode)",
    projectName: "Nexus Toolbar Spec",
    url: "https://forge-demo-toolbar-after.vercel.app/",
    baselineUrl: "",
    subject: "Search page toolbar",
    componentSelector: ".toolbar",
    designDescription:
      "The Search page toolbar in the Nexus design language — its controls, display modes, and the Tools/Options overflow menus.",
    projectContext:
      "Part of the EHSQ-E reskin toward Nexus. This toolbar appears on Search pages across modules (Incidents, Audits, CAPA, MOC).",
    focusAreas:
      "Complete documentation of every control and state, responsive collapse into Tools/Options menus, and accessibility.",
    designDecisions: "",
    designSource: "ehsqe-ds",
    framework: "vue",
    mode: "spec",
    specScope: "component",
  },
];

export const DEFAULT_DEMO_CASE = "toolbar";
