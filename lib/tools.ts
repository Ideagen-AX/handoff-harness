import { tool } from "ai";
import { z } from "zod";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join, basename } from "node:path";
import { readReferenceDoc } from "./specs";
import { inspectClickables, exploreState } from "./capture";
import type { BrowserPool } from "./browserPool";
import { structuralSummary, summaryToPrompt } from "./extract";

// TOOL 1 — fetch the hosted prototype and return a compact STRUCTURAL summary.
// For a large/multi-page prototype, dumping 12k chars of tag-stripped text is both
// lossy (structure gone) and noisy (boilerplate copy eats the budget). A landmark/
// heading/control/component summary is far higher signal per token. We still keep a
// short readable excerpt inside the summary as a last-resort context.
export const fetchPrototype = tool({
  description:
    "Fetch a hosted prototype (or any web page) and return a compact structural summary of it — its title, landmarks, headings, interactive controls, and repeated component blocks. Call this first to understand what the change looks like.",
  inputSchema: z.object({
    url: z.string().describe("The full URL of the hosted prototype"),
  }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "handoff-harness/0.1" },
      });
      if (!res.ok) {
        return { url, ok: false, text: `Fetch failed with HTTP ${res.status}.` };
      }
      const summary = structuralSummary(await res.text());
      const text = summaryToPrompt(summary);
      // A client-rendered SPA serves almost no structure in its initial HTML.
      if (!summary.headings.length && !summary.controls.length && summary.textSample.length < 200) {
        return {
          url,
          ok: true,
          text,
          note: "Very little structure was found in the initial HTML — this page likely renders with JavaScript. Rely on inspectPrototype / explorePrototype and the designer's note, and flag gaps in openQuestions.",
        };
      }
      return { url, ok: true, text };
    } catch (err) {
      return { url, ok: false, text: `Could not fetch the URL: ${String(err)}` };
    }
  },
});

// TOOL 3 (dynamic) — explore the current application's source code (the "before"
// state). Created per-run and scoped to a single root directory so the agent can
// only read within the provided codebase. Enables a true prototype-vs-current diff.
const CODEBASE_IGNORE = new Set([
  "node_modules", ".git", ".next", "dist", "build", "coverage", ".vercel", ".turbo", ".cache",
]);

export function makeCodebaseTool(root: string) {
  const absRoot = resolve(root);
  return tool({
    description:
      "Explore the current application's source code — the 'before' state — to determine what the prototype actually changes. op 'list' returns a filtered file tree under a relative path; op 'read' returns a file's contents. Reads are confined to the codebase root.",
    inputSchema: z.object({
      op: z.enum(["list", "read"]),
      path: z.string().default(".").describe("path relative to the codebase root"),
    }),
    execute: async ({ op, path: rel }) => {
      const target = resolve(absRoot, rel);
      if (target !== absRoot && !target.startsWith(absRoot + "/")) {
        return { error: "path escapes the codebase root" };
      }
      try {
        if (op === "read") {
          if (basename(target).startsWith(".env")) {
            return { error: "refusing to read environment files" };
          }
          const content = await readFile(target, "utf8");
          return {
            path: rel,
            content: content.slice(0, 20000),
            truncated: content.length > 20000,
          };
        }
        if (!(await stat(target)).isDirectory()) {
          return { error: "path is a file; use op 'read'" };
        }
        const out: string[] = [];
        const cap = 400;
        async function walk(dir: string, depth: number) {
          if (out.length >= cap || depth > 6) return;
          for (const e of await readdir(dir, { withFileTypes: true })) {
            if (out.length >= cap) break;
            if (CODEBASE_IGNORE.has(e.name) || e.name.startsWith(".")) continue;
            const full = join(dir, e.name);
            const r = relative(absRoot, full);
            if (e.isDirectory()) {
              out.push(r + "/");
              await walk(full, depth + 1);
            } else {
              out.push(r);
            }
          }
        }
        await walk(target, 0);
        return { root: rel, entries: out, truncated: out.length >= cap };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

// TOOL 4 — inspect the live prototype's actual clickable control labels, so the
// change brief's visualManifest actions target real controls (not guesses). Built
// per run with the shared browser pool so the whole Understand loop drives ONE
// browser (avoids multiple concurrent Chromium instances on serverless).
export function makeInspectTool(pool?: BrowserPool) {
  return tool({
    description:
      "Inspect the live prototype and return its actual clickable control labels (buttons, tabs, toggles). Call this before authoring visualManifest actions, then use these EXACT labels as click targets so screenshots reach the right state. Returns a note if inspection isn't available (e.g. deployed environment).",
    inputSchema: z.object({
      url: z.string().describe("The full URL of the hosted prototype"),
    }),
    execute: async ({ url }) => {
      const { labels, note } = await inspectClickables(url, pool);
      return { url, labels, count: labels.length, note };
    },
  });
}

// TOOL 5 — interactively drive the prototype to reveal UI hidden behind a
// trigger (a drawer, modal, flyout menu, or inactive tab/toggle) and read the
// resulting markup. This is what lets the brief describe the drawer's actual
// contents instead of only the trigger button.
// Built per run (not a shared singleton) so the call cap is per-run. Each
// exploration is an expensive browser navigation, so we hard-cap how many the
// agent can make — this is the main guard against multi-minute Understand loops.
export function makeExploreTool(maxCalls = 3, pool?: BrowserPool) {
  let calls = 0;
  return tool({
    description:
      "Interactively DRIVE the live prototype into a state and read the RESULTING markup. Use this to open UI that is HIDDEN behind a trigger — a drawer, modal, flyout menu, or an inactive tab/toggle — so you can analyse its ACTUAL contents. Each call is a real browser navigation and is SLOW, so use it sparingly: prefer the already-fetched markup, and only open a state you genuinely cannot analyse otherwise. Give the ordered actions to reach the state (click a control by its visible label, set a viewport width, or wait). Returns the revealed region's markup, its control labels, and readable text.",
    inputSchema: z.object({
      url: z.string().describe("The full URL of the hosted prototype"),
      actions: z
        .array(
          z.object({
            do: z.enum(["click", "setViewport", "wait"]),
            target: z.string().optional().describe("For 'click': the control's EXACT visible label/text (e.g. 'Filters') or a CSS selector"),
            width: z.number().optional().describe("For 'setViewport': viewport width in px (e.g. 480, 1440)"),
            height: z.number().optional().describe("For 'setViewport': viewport height in px"),
            ms: z.number().optional().describe("For 'wait': milliseconds to wait"),
          }),
        )
        .describe("Ordered steps to reach the state, e.g. [{do:'click', target:'Filters'}] to open the filter drawer"),
      selector: z.string().optional().describe("Optional CSS selector scoping the read to the component/region"),
    }),
    execute: async ({ url, actions, selector }) => {
      if (calls >= maxCalls) {
        return { ok: false, note: `Exploration limit reached (${maxCalls} states). Analyse from what you already have and emit the change brief now — do not call more tools.` };
      }
      calls++;
      return exploreState(url, { actions, selector }, pool);
    },
  });
}

// TOOL 2 — read a reference document (e.g. the design-system reference).
export const readReference = tool({
  description:
    'Read a reference document by name to inform the change brief. Available names: "product" (EHSQ-E product context, modules, terminology) and "design-system" (real component library — components, tokens, patterns, gaps). Returns a note if the reference is unavailable.',
  inputSchema: z.object({
    name: z.string().describe('Reference name: "product" or "design-system"'),
  }),
  execute: async ({ name }) => {
    return { name, text: await readReferenceDoc(name) };
  },
});
