import { tool } from "ai";
import { z } from "zod";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join, basename } from "node:path";
import { readReferenceDoc } from "./specs";

// Crude but dependency-free HTML → readable text. Good enough to feed a model.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// TOOL 1 — fetch the hosted prototype and return its readable text.
export const fetchPrototype = tool({
  description:
    "Fetch a hosted prototype (or any web page) and return its readable text content. Call this first to understand what the change looks like.",
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
      const text = htmlToText(await res.text()).slice(0, 12000);
      if (text.length < 200) {
        // Likely a client-rendered SPA whose content isn't in the initial HTML.
        return {
          url,
          ok: true,
          text,
          note: "Very little readable text was found — this page may render its content with JavaScript. Rely on the designer's note and flag gaps in openQuestions.",
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
