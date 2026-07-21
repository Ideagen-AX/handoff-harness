// Structural extraction + fingerprints.
//
// The single biggest input problem for LARGE prototypes: the old path fed the
// model up to 12k chars of tag-stripped text per page (see the original
// fetchPrototype). For a full multi-page app that is simultaneously too lossy
// (structure is gone) and too noisy (boilerplate copy fills the budget). This
// module produces a compact STRUCTURAL summary instead — landmarks, headings,
// interactive controls, and repeated component signatures — which is far higher
// signal per token, plus cheap fingerprints used for change-detection (#1) and
// content-hash caching (#4).
//
// Deliberately dependency-free (no jsdom): a set of tolerant regexes over the
// served HTML. Good enough to feed a model and to compare two versions of a page.

import { createHash } from "node:crypto";

// A stable content hash of any string — used as a cache key for per-screen
// analysis and captures (#4). Short hex is plenty for keying.
export function contentHash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

const VOID = new Set(["br", "hr", "img", "input", "meta", "link", "source", "track", "wbr", "area", "base", "col", "embed", "param"]);

// Strip scripts/styles/comments once — shared by the extractors below.
function stripNoise(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " "); // icons add huge noise, no structure
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(fragment: string): string {
  return decode(fragment.replace(/<[^>]+>/g, " "));
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

// The distilled shape of a page — small, ordered by narrative importance, and
// safe to hand to a model as the "what's on this screen" input.
export type StructuralSummary = {
  title: string;
  headings: { level: number; text: string }[];
  landmarks: string[]; // header / nav / main / aside / footer / [role=…] present
  controls: string[]; // de-duped visible labels of buttons / tabs / links / inputs
  components: { tag: string; signature: string; count: number }[]; // repeated blocks
  forms: number;
  textSample: string; // a short readable excerpt, last resort context
};

// Pull the human-readable control label out of a control's inner HTML / attrs.
function controlLabel(openTag: string, inner: string): string | null {
  const txt = textOf(inner);
  const label =
    txt ||
    attr(openTag, "aria-label") ||
    attr(openTag, "title") ||
    attr(openTag, "placeholder") ||
    attr(openTag, "value") ||
    "";
  const clean = label
    .split(" ")
    // drop lowercase icon-ligature tokens (e.g. "cards_stack") the way
    // inspectClickables does — keep tokens with an uppercase or that are words
    .filter((tok) => tok.length > 1 && !/^[a-z_]+$/.test(tok))
    .join(" ")
    .trim();
  return clean && clean.length <= 40 ? clean : null;
}

// Build a compact structural summary of one HTML document.
export function structuralSummary(html: string, opts: { maxControls?: number; maxHeadings?: number } = {}): StructuralSummary {
  const maxControls = opts.maxControls ?? 40;
  const maxHeadings = opts.maxHeadings ?? 30;
  const clean = stripNoise(html);

  const title = (() => {
    const t = clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t) return textOf(t[1]);
    const h1 = clean.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return h1 ? textOf(h1[1]) : "(untitled)";
  })();

  const headings: { level: number; text: string }[] = [];
  for (const m of clean.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = textOf(m[2]);
    if (text) headings.push({ level: Number(m[1]), text: text.slice(0, 120) });
    if (headings.length >= maxHeadings) break;
  }

  const landmarks = new Set<string>();
  for (const tag of ["header", "nav", "main", "aside", "footer"]) {
    if (new RegExp(`<${tag}[\\s>]`, "i").test(clean)) landmarks.add(tag);
  }
  for (const m of clean.matchAll(/role\s*=\s*["']([a-z]+)["']/gi)) {
    if (["banner", "navigation", "main", "complementary", "contentinfo", "search", "dialog", "tablist"].includes(m[1].toLowerCase())) {
      landmarks.add(`role=${m[1].toLowerCase()}`);
    }
  }

  const controls: string[] = [];
  const seen = new Set<string>();
  const controlRe = /<(button|a|summary)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  for (const m of clean.matchAll(controlRe)) {
    const label = controlLabel(`<${m[1]}${m[2]}>`, m[3]);
    if (label && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());
      controls.push(label);
      if (controls.length >= maxControls) break;
    }
  }
  // Standalone inputs (self-closing) — surface by label/placeholder/type.
  if (controls.length < maxControls) {
    for (const m of clean.matchAll(/<input\b([^>]*)>/gi)) {
      const label = attr(`<input${m[1]}>`, "aria-label") || attr(`<input${m[1]}>`, "placeholder") || attr(`<input${m[1]}>`, "name");
      const type = attr(`<input${m[1]}>`, "type") || "text";
      const l = label ? `${label} (${type})` : `input (${type})`;
      if (!seen.has(l.toLowerCase())) {
        seen.add(l.toLowerCase());
        controls.push(l);
        if (controls.length >= maxControls) break;
      }
    }
  }

  // Repeated component signatures: class names that occur many times usually mark
  // a reused component (cards, rows, list items). Report the top few so the model
  // sees "this screen is a grid of N cards" without the full markup.
  const classCounts = new Map<string, number>();
  for (const m of clean.matchAll(/class\s*=\s*["']([^"']+)["']/gi)) {
    const first = m[1].trim().split(/\s+/)[0];
    if (first && first.length > 2) classCounts.set(first, (classCounts.get(first) ?? 0) + 1);
  }
  const components = [...classCounts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([signature, count]) => ({ tag: "block", signature, count }));

  const forms = (clean.match(/<form\b/gi) ?? []).length;
  const textSample = textOf(clean).slice(0, 1500);

  return { title, headings, landmarks: [...landmarks], controls, components, forms, textSample };
}

// Render a StructuralSummary as compact Markdown to drop into a model prompt —
// the replacement for "12k chars of stripped text".
export function summaryToPrompt(s: StructuralSummary): string {
  const lines: string[] = [`Title: ${s.title}`];
  if (s.landmarks.length) lines.push(`Landmarks: ${s.landmarks.join(", ")}`);
  if (s.headings.length) {
    lines.push("Headings:");
    for (const h of s.headings.slice(0, 20)) lines.push(`  ${"#".repeat(h.level)} ${h.text}`);
  }
  if (s.controls.length) lines.push(`Controls: ${s.controls.join(" · ")}`);
  if (s.components.length) lines.push(`Repeated blocks: ${s.components.map((c) => `${c.signature}×${c.count}`).join(", ")}`);
  if (s.forms) lines.push(`Forms: ${s.forms}`);
  if (s.textSample) lines.push(`Text sample: ${s.textSample}`);
  return lines.join("\n");
}

// A structural FINGERPRINT for change-detection (#1). Two versions of the same
// screen produce the same signature when their meaningful structure is
// unchanged, so we can cheaply decide "this screen didn't change, skip it"
// without a model call. Intentionally ignores volatile text content and focuses
// on shape: tag skeleton, control labels, headings, and component signatures.
export function structuralSignature(html: string): string {
  const s = structuralSummary(html, { maxControls: 60, maxHeadings: 40 });
  const skeleton = [
    ...s.landmarks,
    ...s.headings.map((h) => `h${h.level}:${h.text.toLowerCase()}`),
    ...s.controls.map((c) => `c:${c.toLowerCase()}`),
    ...s.components.map((c) => `b:${c.signature}:${c.count}`),
    `forms:${s.forms}`,
  ].join("|");
  return contentHash(skeleton);
}
