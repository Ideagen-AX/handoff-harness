// Screen discovery + delta scoping — the front of the "large prototype" path.
//
// Two ideas, in order of leverage:
//
//  #1 Process the DELTA, not the app. The harness's whole premise is "a completed
//     change". On a 30-screen app, most screens didn't change. Given a baseline we
//     compare each screen's structural signature against its before-state and keep
//     ONLY the screens that actually changed — so cost tracks the size of the
//     change, not the size of the app.
//
//  #2 Decompose into a screen MAP. Instead of one giant "understand everything"
//     pass, enumerate the screens (explicit list → bounded crawl → single-screen
//     fallback) so the rest of the pipeline can map over them independently and in
//     parallel.
//
// Dependency-free: link discovery is regex over served HTML, change detection uses
// the structural signatures from extract.ts. A prototype that renders entirely in
// JS (no links in initial HTML) simply yields the single root screen — the exact
// behaviour the old pipeline had, so nothing regresses for the demo case.

import { structuralSignature } from "./extract";
import type { BrowserPool } from "./browserPool";
import { mapWithConcurrency } from "./browserPool";
import { capturePrototypeState } from "./capture";

export type Screen = {
  key: string; // stable slug used for capture folders + screenKeys
  url: string; // the AFTER url
  label: string; // human label
  baselineUrl?: string; // the BEFORE url, when a baseline origin was supplied
};

export type ScreenMap = {
  screens: Screen[];
  method: "explicit" | "crawl" | "single";
  discovered: number; // how many screens discovery found
  scoped: number; // how many survived delta-scoping (== screens.length)
  note: string;
};

// Turn a URL path into a short stable key: "/incidents/new" → "incidents-new".
function keyFromUrl(u: string, fallback: string): string {
  try {
    const p = new URL(u).pathname.replace(/\/+$/g, "");
    const slug = p.replace(/^\/+/, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
    return slug || fallback;
  } catch {
    return fallback;
  }
}

function labelFromUrl(u: string): string {
  try {
    const p = new URL(u).pathname.replace(/\/+$/g, "");
    if (!p || p === "") return "Home";
    return p
      .split("/")
      .filter(Boolean)
      .map((s) => s.replace(/[-_]+/g, " "))
      .join(" › ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return u;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "handoff-harness/0.1" } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|ico|css|js|mjs|json|pdf|zip|woff2?|ttf|mp4|webm|map)(\?|#|$)/i;

// Extract same-origin, navigable links from a page's HTML. Resolves relative
// hrefs against the base, drops fragments/assets/mailto, dedupes by pathname.
function extractLinks(html: string, baseUrl: string): string[] {
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const raw = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(raw)) continue;
    let abs: URL;
    try {
      abs = new URL(raw, baseUrl);
    } catch {
      continue;
    }
    if (abs.origin !== origin) continue; // same-origin only
    if (ASSET_RE.test(abs.pathname)) continue;
    abs.hash = "";
    const norm = abs.pathname.replace(/\/+$/g, "") + abs.search;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(abs.toString());
  }
  return out;
}

// Re-root a prototype screen URL onto the baseline origin so we can fetch the
// matching BEFORE state (same path, different host).
function reRoot(screenUrl: string, baselineOrigin: string): string | undefined {
  try {
    const s = new URL(screenUrl);
    const b = new URL(baselineOrigin);
    return new URL(s.pathname + s.search, b.origin).toString();
  } catch {
    return undefined;
  }
}

/**
 * Enumerate the screens of a prototype.
 *
 * Sources, in order of trust:
 *   1. explicit — the designer supplied an exact list of screen URLs.
 *   2. crawl — follow same-origin <a> links from the entry page (one hop),
 *      bounded by maxScreens, always including the entry itself.
 *   3. single — no links found (e.g. a JS-rendered SPA or an isolated component
 *      demo): just the entry URL. This is the legacy single-screen behaviour.
 */
export async function discoverScreens(input: {
  prototypeUrl: string;
  baselineUrl?: string;
  screens?: Array<string | { url: string; label?: string }>;
  crawl?: boolean;
  maxScreens?: number;
}): Promise<{ screens: Screen[]; method: ScreenMap["method"] }> {
  const maxScreens = input.maxScreens && input.maxScreens > 0 ? input.maxScreens : 12;
  const baselineOrigin = input.baselineUrl;
  const toScreen = (url: string, label?: string, i = 0): Screen => ({
    key: keyFromUrl(url, `screen-${i + 1}`),
    url,
    label: label || labelFromUrl(url),
    baselineUrl: baselineOrigin ? reRoot(url, baselineOrigin) : undefined,
  });

  // 1 — explicit list.
  if (input.screens?.length) {
    const screens = input.screens.map((s, i) =>
      typeof s === "string" ? toScreen(s, undefined, i) : toScreen(s.url, s.label, i),
    );
    return { screens: dedupeByKey(screens).slice(0, maxScreens), method: "explicit" };
  }

  // 2 — crawl one hop from the entry page.
  if (input.crawl) {
    const html = await fetchHtml(input.prototypeUrl);
    const links = html ? extractLinks(html, input.prototypeUrl) : [];
    if (links.length) {
      const urls = [input.prototypeUrl, ...links];
      const screens = dedupeByKey(urls.map((u, i) => toScreen(u, undefined, i))).slice(0, maxScreens);
      return { screens, method: "crawl" };
    }
  }

  // 3 — single-screen fallback (legacy behaviour).
  return { screens: [toScreen(input.prototypeUrl, "Prototype", 0)], method: "single" };
}

function dedupeByKey(screens: Screen[]): Screen[] {
  const seen = new Set<string>();
  return screens.filter((s) => (seen.has(s.key) ? false : (seen.add(s.key), true)));
}

/**
 * #1 — keep only the screens that actually CHANGED versus the baseline.
 *
 * For each screen with a known baselineUrl we render both states (through the
 * shared pool) and compare structural signatures; identical signatures mean the
 * screen's meaningful structure is unchanged, so we drop it. Screens with no
 * baseline are always kept (we can't prove they're unchanged) and flagged.
 *
 * Returns the full ScreenMap so the caller can report "N of M screens changed".
 */
export async function scopeToChanged(
  screens: Screen[],
  opts: { pool?: BrowserPool; hasBaseline: boolean; concurrency?: number },
): Promise<ScreenMap> {
  const discovered = screens.length;
  // No baseline, or only one screen: nothing to scope — process everything.
  if (!opts.hasBaseline || screens.length <= 1 || screens.every((s) => !s.baselineUrl)) {
    return {
      screens,
      method: "single",
      discovered,
      scoped: screens.length,
      note: opts.hasBaseline
        ? "Delta-scoping skipped (single screen or no per-screen baseline)."
        : "No baseline — every discovered screen is processed and marked unverified.",
    };
  }

  const verdicts = await mapWithConcurrency(screens, opts.concurrency ?? 4, async (s) => {
    if (!s.baselineUrl) return { screen: s, changed: true }; // can't compare → keep
    const [after, before] = await Promise.all([
      capturePrototypeState(s.url, opts.pool),
      capturePrototypeState(s.baselineUrl, opts.pool),
    ]);
    // If either side is unreadable, keep the screen (fail open — better to over-
    // process than to silently drop a real change).
    if (!after.html || !before.html) return { screen: s, changed: true };
    const changed = structuralSignature(after.html) !== structuralSignature(before.html);
    return { screen: s, changed };
  });

  const changed = verdicts.filter((v) => v.changed).map((v) => v.screen);
  return {
    screens: changed,
    method: "crawl",
    discovered,
    scoped: changed.length,
    note: `Delta-scoped: ${changed.length} of ${discovered} screens changed vs. baseline; unchanged screens skipped.`,
  };
}
