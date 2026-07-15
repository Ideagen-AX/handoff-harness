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
};

export const DEMO_CASES: DemoCase[] = [
  {
    id: "toolbar",
    label: "Search toolbar — Praxis restyle",
    projectName: "Praxis Toolbar",
    url: "https://forge-demo-toolbar-after.vercel.app/",
    baselineUrl: "https://forge-demo-toolbar-before.vercel.app/",
    subject: "Search page toolbar",
    componentSelector: ".toolbar",
    designDescription:
      "The Search page toolbar, restyled to the Praxis design language: rounder, gradient-filled controls, refined icons, and a first-class dark mode. The control set and spacing are unchanged.",
    projectContext:
      "Part of the wider EHSQ-E reskin toward the Praxis design language. This toolbar appears on Search pages across multiple modules (Incidents, Audits, CAPA, MOC).",
    focusAreas:
      "Fidelity of the visual restyle to Praxis; the new dark-mode variant; accessibility (aria labels, visible focus); and the responsive collapse into Tools/Options menus.",
    designDecisions:
      "Kept the control set and spacing unchanged to avoid retraining users. Added a first-class dark variant. The selected display mode now uses a gradient + shadow to read as active.",
    designSource: "miramar",
    framework: "vue",
  },
  {
    id: "filter-drawer",
    label: "Search filter drawer — Praxis redesign",
    projectName: "Praxis Filters",
    url: "https://filter-drawer-after.vercel.app/",
    baselineUrl: "https://filter-drawer-before.vercel.app/",
    subject: "Search filter drawer",
    componentSelector: ".filter-drawer",
    designDescription:
      "The Search filter drawer, redesigned in the Praxis design language — the right-hand panel for building and applying filters, with restyled filter rows, date controls, and a 'more filters' section.",
    projectContext:
      "Part of the EHSQ-E reskin toward Praxis. The filter drawer opens from the Search toolbar across modules to refine result sets.",
    focusAreas:
      "Fidelity of the drawer restyle to Praxis; the filter-row and date interactions; the apply / clear affordances; and the drawer's responsive behaviour.",
    designDecisions:
      "Restyled to Praxis without changing the underlying filter model. (Edit to add the specific decisions and rationale for this redesign.)",
    designSource: "miramar",
    framework: "vue",
  },
  // Adam's calendar case was not found in the merged branch — add it here once its
  // before/after prototype URLs are available.
];

export const DEFAULT_DEMO_CASE = "toolbar";
