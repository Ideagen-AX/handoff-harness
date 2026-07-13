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
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
        await page.goto(opts.prototypeUrl, { waitUntil: "networkidle2", timeout: 30000 });
        // Let late layout/animation settle.
        await new Promise((r) => setTimeout(r, 600));

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
