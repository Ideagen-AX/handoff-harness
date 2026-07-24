// A "design source" = the system the generated code should match: which reference
// doc grounds the design/DS analysis, which code-conventions spec the coded
// component follows, and how analytics instrumentation is attached. Selectable at
// setup so one harness can target multiple products/design systems.
export type DesignSource = {
  id: string;
  label: string;
  blurb: string;
  reference: string; // specs/references/<reference>.md — DS knowledge (components/tokens/conventions)
  codeSpec?: string; // specs/code/<codeSpec>.md — fixed code conventions; if absent, use the framework selector
  codeLabel?: string; // artifact label suffix when codeSpec is fixed (else the framework is shown)
  // How Gainsight/analytics instrumentation ids are attached in generated markup.
  analytics: { attr: string; directive: boolean };
};

export const DESIGN_SOURCES: DesignSource[] = [
  // The design team's own system is the primary/default source — listed first.
  {
    id: "ehsqe-ds",
    label: "EHSQ-E Design System (design-team resource)",
    blurb: "The design team's component library / POC reference. Uses the framework selector below; not necessarily matched to production code.",
    reference: "design-system",
    analytics: { attr: "data-id", directive: false },
  },
  {
    id: "miramar",
    label: "Miramar — EHSQ-E production Vue/Vuetify",
    blurb: "Matches the real EHSQ-E front end: Vue 3 Options API (plain JS), Vuetify 3, house conventions. Code a Miramar dev could merge.",
    reference: "frontend-conventions-ehsqe",
    codeSpec: "miramar",
    codeLabel: "Miramar Vue/Vuetify",
    analytics: { attr: "v-gs-id", directive: true }, // Miramar's native Gainsight PX directive
  },
  // Future: { id: "helix", ... } (React/MUI), or other portfolio products.
];

export const DEFAULT_DESIGN_SOURCE = "ehsqe-ds";

export function getDesignSource(id?: string): DesignSource {
  return (
    DESIGN_SOURCES.find((s) => s.id === id) ??
    DESIGN_SOURCES.find((s) => s.id === DEFAULT_DESIGN_SOURCE) ??
    DESIGN_SOURCES[0]
  );
}
