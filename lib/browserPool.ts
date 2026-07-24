// A pooled headless browser + a bounded-concurrency helper.
//
// The original capture path launched AND closed a whole browser for every single
// operation — one per screen, per inspect, per explore, per before/after pane.
// On a large multi-page prototype that is the dominant cost: cold browser launch
// (hundreds of ms to seconds) multiplied by dozens of screens, serially. This
// module launches ONE browser per run and hands out pages through a semaphore, so
// N screens capture concurrently (bounded) against a single warm browser. That
// turns capture from O(screens) cold launches into one launch + cheap page opens.
//
// The launch primitives (Chrome discovery, serverless Chromium) live here now and
// are re-exported by capture.ts for existing callers (export.ts, slide-pdf).

import { IS_SERVERLESS } from "./storage";

// Candidate system-Chrome locations (macOS first, then common Linux). We use the
// installed browser rather than downloading Chromium — lighter, local-first.
const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

async function firstExisting(paths: string[]): Promise<string | null> {
  const { stat } = await import("node:fs/promises");
  for (const p of paths) {
    try {
      await stat(p);
      return p;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

// Exposed so other browser features (PDF export) can reuse the same launcher.
export async function findChrome(): Promise<string | null> {
  return firstExisting(CHROME_PATHS);
}

// Records why the last serverless launch failed, so callers can surface it in
// their degradation note (aids diagnosing the Vercel Chromium path).
export let lastLaunchError: string | null = null;

/**
 * Launch a headless browser that works both locally and on serverless (Vercel).
 * On serverless we use the bundled @sparticuz/chromium build; locally we drive
 * the installed system Chrome/Edge. Returns null when no browser is available,
 * so every caller can degrade gracefully rather than throw.
 */
export async function launchBrowser(): Promise<import("puppeteer-core").Browser | null> {
  const { launch } = await import("puppeteer-core");
  if (IS_SERVERLESS) {
    try {
      // @sparticuz/chromium only unpacks its bundled shared libraries when it
      // detects an AWS-Lambda runtime. Vercel doesn't set those vars, so advertise
      // a Node 20/AL2023 runtime so the package extracts its libs to /tmp.
      process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs20.x";
      const chromium = (await import("@sparticuz/chromium")).default;
      const executablePath = await chromium.executablePath();
      return await launch({
        args: [...chromium.args, "--hide-scrollbars"],
        executablePath,
        headless: true,
      });
    } catch (e) {
      lastLaunchError = String((e as Error)?.message || e).slice(0, 300);
      console.error("[launchBrowser] serverless chromium failed:", lastLaunchError);
      return null;
    }
  }
  const executablePath = await firstExisting(CHROME_PATHS);
  if (!executablePath) return null;
  try {
    return await launch({ executablePath, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
  } catch {
    return null;
  }
}

// How many pages may be open against the shared browser at once. Kept modest —
// each page is a real tab doing layout + screenshots, and serverless memory is
// tight. Override with HARNESS_CAPTURE_CONCURRENCY.
export const CAPTURE_CONCURRENCY = (() => {
  const n = Number(process.env.HARNESS_CAPTURE_CONCURRENCY);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 4;
})();

/**
 * A single browser shared across a run, with a page-level concurrency gate.
 * Open one with `openPool()`, run work through `withPage()`, and `close()` once
 * at the end. `withPage` guarantees the page is closed and the slot released even
 * if the callback throws.
 */
export class BrowserPool {
  private queue: (() => void)[] = [];
  private active = 0;
  private constructor(
    public readonly browser: import("puppeteer-core").Browser,
    private readonly limit: number,
  ) {}

  static async open(limit = CAPTURE_CONCURRENCY): Promise<BrowserPool | null> {
    const browser = await launchBrowser();
    return browser ? new BrowserPool(browser, limit) : null;
  }

  private acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise<void>((res) => this.queue.push(res)).then(() => {
      this.active++;
    });
  }

  private release() {
    this.active--;
    this.queue.shift()?.();
  }

  // Run `fn` with a fresh page, bounded by the pool's concurrency. Always closes
  // the page and frees the slot.
  async withPage<T>(fn: (page: import("puppeteer-core").Page) => Promise<T>): Promise<T> {
    await this.acquire();
    let page: import("puppeteer-core").Page | null = null;
    try {
      page = await this.browser.newPage();
      return await fn(page);
    } finally {
      if (page) await page.close().catch(() => {});
      this.release();
    }
  }

  async close(): Promise<void> {
    await this.browser.close().catch(() => {});
  }
}

// Generic bounded-concurrency map: run `fn` over `items` with at most `limit` in
// flight, preserving input order in the result. A rejected item rejects the whole
// call, so callers that want per-item resilience should have `fn` catch and return
// a sentinel. Used for the capture fan-out and the per-screen analysis fan-out.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length || 1) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
