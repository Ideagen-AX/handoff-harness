import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChangeBrief, Capture } from "./types";

// Candidate system-Chrome locations (macOS first, then common Linux). We use the
// installed browser rather than downloading Chromium — lighter, and this stage is
// local-first anyway.
const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

type Action = { do: "click" | "setViewport" | "wait"; target?: string; width?: number; height?: number; ms?: number };

// Click by CSS selector, falling back to matching a control's visible text /
// aria-label — so the agent can name "Cards" without knowing a selector.
async function clickTarget(page: import("puppeteer-core").Page, target: string): Promise<boolean> {
  if (!target) return false;
  try {
    const el = await page.$(target);
    if (el) {
      await el.click();
      return true;
    }
  } catch {
    /* not a valid selector — fall through to text matching */
  }
  return page.evaluate((t: string) => {
    const norm = (s: string | null) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const want = norm(t);
    const cands = Array.from(
      document.querySelectorAll<HTMLElement>(
        "button,[role=button],[role=tab],a,li,label,[class*=toggle],[class*=view],[class*=tab]",
      ),
    );
    const el =
      cands.find((e) => norm(e.textContent) === want) ||
      cands.find((e) => norm(e.getAttribute("aria-label")) === want) ||
      cands.find((e) => norm(e.getAttribute("title")) === want) ||
      cands.find((e) => norm(e.textContent).includes(want) && want.length > 1);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }, target);
}

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

// Screenshots live under public/captures/<runId>/ so Next serves them at
// /captures/<runId>/… in local dev. Ignored by git; ephemeral by design.
const PUBLIC_CAPTURES = join(process.cwd(), "public", "captures");

/**
 * Inspect the live prototype for its actual clickable control labels, so the
 * Understand agent can name real click targets (e.g. "Cards", "Custom Filter",
 * "Modal") instead of guessing. Cleans Material-icon ligatures by keeping only
 * tokens that contain an uppercase letter. Degrades gracefully off-browser.
 */
export async function inspectClickables(url: string): Promise<{ labels: string[]; note?: string }> {
  if (process.env.VERCEL) return { labels: [], note: "DOM inspection skipped on Vercel." };
  const executablePath = await firstExisting(CHROME_PATHS);
  if (!executablePath) return { labels: [], note: "No system browser for DOM inspection." };

  let browser: import("puppeteer-core").Browser | null = null;
  try {
    const { launch } = await import("puppeteer-core");
    browser = await launch({ executablePath, headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 700));
    const labels: string[] = await page.evaluate(() => {
      const clean = (s: string) =>
        (s || "")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .filter((tok) => /[A-Z]/.test(tok)) // drop lowercase icon ligatures (cards_stack, instant_mix…)
          .join(" ")
          .trim();
      const out = new Set<string>();
      document
        .querySelectorAll<HTMLElement>("button,[role=button],[role=tab],a,[class*=toggle],[class*=tab]")
        .forEach((e) => {
          const t = clean(e.textContent || "") || clean(e.getAttribute("aria-label") || "");
          if (t && t.length <= 30) out.add(t);
        });
      return Array.from(out);
    });
    return { labels };
  } catch (err) {
    return { labels: [], note: `DOM inspection failed: ${String(err)}` };
  } finally {
    await browser?.close().catch(() => {});
  }
}

/**
 * Capture one screenshot per visualManifest entry from the live prototype.
 *
 * Local-first: drives the system Chrome via puppeteer-core. Degrades gracefully
 * — on Vercel, with no browser found, or on any per-screen failure it returns a
 * Capture with ok:false and a note, so the pipeline keeps running and downstream
 * artifacts fall back to captions/annotations text.
 */
export async function captureScreens(opts: {
  prototypeUrl: string;
  manifest: ChangeBrief["visualManifest"];
  runId: string;
}): Promise<Capture[]> {
  const manifest = opts.manifest ?? [];
  const placeholder = (reason: string): Capture[] =>
    manifest.map((m) => ({
      screenKey: m.screenKey,
      caption: m.caption,
      annotations: m.annotations ?? [],
      ok: false,
      note: reason,
    }));

  if (!manifest.length) return [];
  if (process.env.VERCEL) {
    return placeholder("Screenshot capture is skipped on Vercel; run locally to capture real screens.");
  }

  const executablePath = await firstExisting(CHROME_PATHS);
  if (!executablePath) {
    return placeholder("No system Chrome/Edge found for capture; attach screenshots manually.");
  }

  let browser: import("puppeteer-core").Browser | null = null;
  try {
    const { launch } = await import("puppeteer-core");
    browser = await launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--hide-scrollbars"],
    });
    const outDir = join(PUBLIC_CAPTURES, opts.runId);
    await mkdir(outDir, { recursive: true });

    const results: Capture[] = [];
    for (const m of manifest) {
      const base: Capture = {
        screenKey: m.screenKey,
        caption: m.caption,
        annotations: m.annotations ?? [],
        ok: false,
      };
      try {
        const page = await browser.newPage();
        // Apply any viewport action up front so the page renders at that size from
        // load (correct for responsive/size-dependent states like a mobile drawer).
        const actions = (m.actions ?? []) as Action[];
        const vp = actions.find((a) => a.do === "setViewport" && (a.width ?? 0) > 0);
        await page.setViewport({
          width: vp?.width ?? 1440,
          height: vp?.height && vp.height > 0 ? vp.height : 900,
          deviceScaleFactor: 2,
        });
        await page.goto(opts.prototypeUrl, { waitUntil: "networkidle2", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 600));

        // Drive the prototype into this screen's state (best-effort; a failed step
        // never sinks the capture — we still shoot whatever's on screen).
        for (const a of actions) {
          try {
            if (a.do === "click") await clickTarget(page, a.target ?? "");
            else if (a.do === "wait") await new Promise((r) => setTimeout(r, Math.min(a.ms ?? 0, 5000)));
            // setViewport already applied pre-goto
          } catch {
            /* keep going */
          }
        }
        if (actions.some((a) => a.do === "click")) await new Promise((r) => setTimeout(r, 500));

        const file = join(outDir, `${m.screenKey}.png`);
        const selector = (m.selector ?? "").trim();
        let shot = false;
        if (selector) {
          const el = await page.$(selector);
          if (el) {
            await el.screenshot({ path: file as `${string}.png` });
            shot = true;
          }
        }
        if (!shot) {
          await page.screenshot({ path: file as `${string}.png`, fullPage: !selector });
        }
        await page.close();
        results.push({ ...base, ok: true, url: `/captures/${opts.runId}/${m.screenKey}.png` });
      } catch (err) {
        results.push({ ...base, note: `Capture failed: ${String(err)}` });
      }
    }
    return results;
  } catch (err) {
    return placeholder(`Browser launch failed: ${String(err)}`);
  } finally {
    await browser?.close().catch(() => {});
  }
}
