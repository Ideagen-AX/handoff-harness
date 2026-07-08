import { tool } from "ai";
import { z } from "zod";
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

// TOOL 2 — read a reference document (e.g. the design-system reference).
export const readReference = tool({
  description:
    'Read a reference document by name to inform the change brief. Available names: "design-system" (component library reference). Returns a note if the reference is unavailable.',
  inputSchema: z.object({
    name: z.string().describe('Reference name, e.g. "design-system"'),
  }),
  execute: async ({ name }) => {
    return { name, text: await readReferenceDoc(name) };
  },
});
