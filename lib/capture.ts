import type { ChangeBrief, Capture } from "./types";
import { IS_SERVERLESS, storeCapture } from "./storage";

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
// aria-label — so the agent can name "Cards" without knowing a selector. Runs
// against a Frame so it works whether the component lives in the main document
// or inside an embedded <iframe> (Page.mainFrame() is a Frame).
async function clickTarget(ctx: import("puppeteer-core").Frame, target: string): Promise<boolean> {
  if (!target) return false;
  try {
    const el = await ctx.$(target);
    if (el) {
      await el.click();
      return true;
    }
  } catch {
    /* not a valid selector — fall through to text matching */
  }
  return ctx.evaluate((t: string) => {
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

// Exposed so other browser features (PDF export) can reuse the same launcher.
export async function findChrome(): Promise<string | null> {
  return firstExisting(CHROME_PATHS);
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

/**
 * Launch a headless browser that works both locally and on serverless (Vercel).
 * On serverless we use the bundled @sparticuz/chromium build; locally we drive
 * the installed system Chrome/Edge. Returns null when no browser is available,
 * so every caller can degrade gracefully rather than throw.
 */
// Records why the last serverless launch failed, so callers can surface it in
// their degradation note (aids diagnosing the Vercel Chromium path).
export let lastLaunchError: string | null = null;

export async function launchBrowser(): Promise<import("puppeteer-core").Browser | null> {
  const { launch } = await import("puppeteer-core");
  if (IS_SERVERLESS) {
    try {
      // @sparticuz/chromium only unpacks its bundled shared libraries (libnss3,
      // etc.) when it detects an AWS-Lambda runtime via AWS_EXECUTION_ENV /
      // AWS_LAMBDA_JS_RUNTIME. Vercel doesn't set those, so the libs are never
      // extracted and Chromium fails with "libnss3.so: cannot open shared object
      // file". Vercel's runtime is Amazon Linux 2023 — advertise a Node 20/AL2023
      // runtime so the package extracts al2023.tar.br to /tmp/al2023/lib (already
      // on LD_LIBRARY_PATH).
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
      return null; // chromium binary unavailable
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

/**
 * Capture a prototype's state for a before/after diff: a viewport screenshot
 * (vision input) AND its rendered HTML/CSS markup (code-level input). One page
 * load. Prefers the system browser (captures SPA output + <style> blocks + inline
 * styles); falls back to a raw HTTP fetch of the source when no browser is
 * available (limited for SPAs, but better than nothing). Fields are null when
 * unavailable.
 */
export async function capturePrototypeState(url: string): Promise<{ image: string | null; html: string | null }> {
  const browser = await launchBrowser();
  if (browser) {
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 600));
      const buf = await page.screenshot({ type: "png" });
      const html = await page.content();
      return { image: `data:image/png;base64,${Buffer.from(buf).toString("base64")}`, html };
    } catch {
      /* fall through to raw fetch */
    } finally {
      await browser.close().catch(() => {});
    }
  }
  try {
    const res = await fetch(url, { headers: { "user-agent": "handoff-harness/0.1" } });
    if (res.ok) return { image: null, html: await res.text() };
  } catch {
    /* nothing */
  }
  return { image: null, html: null };
}

/**
 * Inspect the live prototype for its actual clickable control labels, so the
 * Understand agent can name real click targets (e.g. "Cards", "Custom Filter",
 * "Modal") instead of guessing. Cleans Material-icon ligatures by keeping only
 * tokens that contain an uppercase letter. Degrades gracefully off-browser.
 */
export async function inspectClickables(url: string): Promise<{ labels: string[]; note?: string }> {
  const browser = await launchBrowser();
  if (!browser) return { labels: [], note: "No browser available for DOM inspection." };
  try {
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
 * Drive the prototype into a state (open a drawer, switch a tab, toggle a mode)
 * and return the RESULTING rendered markup + now-visible control labels — so the
 * Understand agent can analyse UI that's hidden behind a trigger, not just the
 * initial screen. Reuses the same action-driving + iframe-resolution the capture
 * step uses. Degrades gracefully (returns ok:false) when no browser is available.
 */
export async function exploreState(
  url: string,
  opts: { actions?: Action[]; selector?: string },
): Promise<{ ok: boolean; markup?: string; text?: string; labels?: string[]; note?: string }> {
  const browser = await launchBrowser();
  if (!browser) {
    return { ok: false, note: lastLaunchError ? `No browser available: ${lastLaunchError}` : "No browser available for exploration." };
  }
  try {
    const page = await browser.newPage();
    const actions = (opts.actions ?? []) as Action[];
    const vp = actions.find((a) => a.do === "setViewport" && (a.width ?? 0) > 0);
    await page.setViewport({
      width: vp?.width ?? 1440,
      height: vp?.height && vp.height > 0 ? vp.height : 900,
      deviceScaleFactor: 1,
    });
    // Cap the wait: some SPAs never reach network idle and would burn the full
    // timeout on every exploration. 15s is plenty for these demos to render.
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 600));

    // Operate inside the frame that holds the component (demo pages embed it in
    // an <iframe>); navigate to the frame's own URL so its DOM is readable.
    const selector = (opts.selector || "").trim();
    let target = selector ? await resolveTarget(page, selector, "") : null;
    if (target && target.frame !== page.mainFrame()) {
      const frameUrl = target.frame.url();
      if (/^https?:/i.test(frameUrl)) {
        try {
          await page.goto(frameUrl, { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
          await new Promise((r) => setTimeout(r, 500));
          target = await resolveTarget(page, selector, "");
        } catch {
          /* keep the original in-frame target */
        }
      }
    }
    const ctx = target?.frame ?? page.mainFrame();

    // Drive into the state (best-effort; a failed step never sinks the read).
    for (const a of actions) {
      try {
        if (a.do === "click") await clickTarget(ctx, a.target ?? "");
        else if (a.do === "wait") await new Promise((r) => setTimeout(r, Math.min(a.ms ?? 0, 5000)));
      } catch {
        /* keep going */
      }
    }
    if (actions.some((a) => a.do === "click")) await new Promise((r) => setTimeout(r, 800));

    // Read the resulting markup. Prefer a newly-visible drawer/modal/menu/panel
    // (the revealed content the caller wants); else the component; else the body.
    const { markup, labels } = await ctx.evaluate((sel: string) => {
      const clean = (s: string) => (s || "").replace(/\s+/g, " ").trim();
      const root = (sel ? (document.querySelector(sel) as HTMLElement | null) : null) || document.body;
      const overlay = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"],[aria-modal="true"],[class*="drawer"],[class*="modal"],[role="menu"],[class*="flyout"],[class*="popover"],[class*="panel"]',
        ),
      ).find((e) => {
        const r = e.getBoundingClientRect();
        const st = getComputedStyle(e);
        return r.width > 40 && r.height > 40 && st.display !== "none" && st.visibility !== "hidden" && parseFloat(st.opacity || "1") > 0.01;
      });
      const el = overlay || root;
      const labels = new Set<string>();
      el.querySelectorAll<HTMLElement>("button,[role=button],[role=tab],a,label,input,select,[class*=toggle],[class*=tab]").forEach((e) => {
        const t = clean(e.textContent || "") || clean(e.getAttribute("aria-label") || "") || clean(e.getAttribute("placeholder") || "");
        if (t && t.length <= 40) labels.add(t);
      });
      return { markup: clean(el.outerHTML).slice(0, 6000), labels: Array.from(labels) };
    }, selector);

    const text = markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200);
    return { ok: true, markup, text, labels };
  } catch (err) {
    return { ok: false, note: `Exploration failed: ${String(err)}` };
  } finally {
    await browser?.close().catch(() => {});
  }
}

/**
 * Locate the frame that actually contains the component. Demo/embed pages often
 * render the real component inside an <iframe> (e.g. a before/after comparison
 * that loads `component.html?embed=1` in each pane), so the selector won't match
 * the top document — we have to search child frames, drive clicks inside the
 * matching one, and know its pixel offset to translate frame-local coordinates
 * into page coordinates for the screenshot clip.
 *
 * When several frames match (side-by-side light/dark or before/after panes) we
 * disambiguate with a keyword from the screen's key/caption that also appears in
 * a frame's URL; otherwise we take the first match.
 */
async function resolveTarget(
  page: import("puppeteer-core").Page,
  selector: string,
  hint: string,
): Promise<{ frame: import("puppeteer-core").Frame; offset: { x: number; y: number } } | null> {
  const matches: import("puppeteer-core").Frame[] = [];
  for (const f of page.frames()) {
    try {
      if (await f.$(selector)) matches.push(f);
    } catch {
      /* detached / cross-origin frame — skip */
    }
  }
  if (!matches.length) return null;

  let chosen = matches[0];
  const h = hint.toLowerCase();
  for (const kw of ["dark", "light", "before", "after", "mobile", "desktop"]) {
    if (!h.includes(kw)) continue;
    const m = matches.find((f) => f.url().toLowerCase().includes(kw));
    if (m) {
      chosen = m;
      break;
    }
  }

  if (chosen === page.mainFrame()) return { frame: chosen, offset: { x: 0, y: 0 } };
  try {
    const fe = await chosen.frameElement();
    if (!fe) return { frame: chosen, offset: { x: 0, y: 0 } };
    const box = await fe.boundingBox();
    const inset = await fe.evaluate((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return {
        x: (parseFloat(s.borderLeftWidth) || 0) + (parseFloat(s.paddingLeft) || 0),
        y: (parseFloat(s.borderTopWidth) || 0) + (parseFloat(s.paddingTop) || 0),
      };
    });
    return { frame: chosen, offset: { x: (box?.x ?? 0) + inset.x, y: (box?.y ?? 0) + inset.y } };
  } catch {
    return { frame: chosen, offset: { x: 0, y: 0 } };
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
  defaultSelector?: string; // scope shots to the component when an entry has no selector
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

  const browser = await launchBrowser();
  if (!browser) {
    return placeholder(
      lastLaunchError
        ? `No browser available for capture: ${lastLaunchError}`
        : "No browser available for capture; attach screenshots manually.",
    );
  }

  try {
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

        // Find the frame that holds the component (may be an embedded iframe), so
        // clicks land on the real controls and the aperture is measured where the
        // component actually lives. Retry once — iframes can settle a beat late.
        const selector = (m.selector || opts.defaultSelector || "").trim();
        const hint = `${m.screenKey} ${m.caption ?? ""} ${m.state ?? ""}`;
        let target: Awaited<ReturnType<typeof resolveTarget>> = null;
        if (selector) {
          target = await resolveTarget(page, selector, hint);
          if (!target) {
            await new Promise((r) => setTimeout(r, 600));
            target = await resolveTarget(page, selector, hint);
          }
        }

        // If the component is embedded in a child <iframe>, capture against the
        // frame's OWN url instead of through the parent. The parent iframe clips
        // anything that overflows its box — so a menu/flyout that pops out below
        // the component would be cut off. Loading the component page directly
        // (which the frame's src already points at, theme/variant included) lets
        // those overflow into the full viewport where they render and screenshot
        // correctly. Falls back to the in-frame path if the navigation fails.
        if (target && target.frame !== page.mainFrame()) {
          const frameUrl = target.frame.url();
          if (/^https?:/i.test(frameUrl)) {
            try {
              await page.goto(frameUrl, { waitUntil: "networkidle2", timeout: 30000 });
              await new Promise((r) => setTimeout(r, 600));
              const reResolved = await resolveTarget(page, selector, hint);
              if (reResolved) target = reResolved; // now the main frame, offset 0
            } catch {
              /* keep the original in-frame target */
            }
          }
        }
        const ctx = target?.frame ?? page.mainFrame();

        // Drive the prototype into this screen's state (best-effort; a failed step
        // never sinks the capture — we still shoot whatever's on screen).
        for (const a of actions) {
          try {
            if (a.do === "click") await clickTarget(ctx, a.target ?? "");
            else if (a.do === "wait") await new Promise((r) => setTimeout(r, Math.min(a.ms ?? 0, 5000)));
            // setViewport already applied pre-goto
          } catch {
            /* keep going */
          }
        }
        if (actions.some((a) => a.do === "click")) await new Promise((r) => setTimeout(r, 900));

        let shot = false;
        let url: string | undefined;
        if (target) {
          // Smart aperture: capture the component PLUS any menu/popover/flyout that
          // is currently open (a click may have opened one that renders outside the
          // component's own box), sized to whatever is actually visible. Full-screen
          // scrims and far-off elements are excluded so the frame stays tight.
          // Measured in the component frame's own coordinates.
          const clip = await ctx.evaluate((sel: string) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) return null;
            const sx = window.scrollX, sy = window.scrollY, vw = window.innerWidth, vh = window.innerHeight;
            const visible = (e: Element) => {
              const s = getComputedStyle(e as HTMLElement);
              const r = e.getBoundingClientRect();
              return r.width > 1 && r.height > 1 && s.display !== "none" && s.visibility !== "hidden" && parseFloat(s.opacity || "1") > 0.01;
            };
            const toBox = (r: DOMRect) => ({ left: r.left + sx, top: r.top + sy, right: r.right + sx, bottom: r.bottom + sy });
            const comp = el.getBoundingClientRect();
            const boxes = [toBox(comp)];
            // Proximity window around the component — a real flyout is near it.
            const near = { left: comp.left - 900, top: comp.top - 900, right: comp.right + 900, bottom: comp.bottom + 900 };
            const overlays = document.querySelectorAll(
              '[role="menu"],[role="listbox"],[role="dialog"],[aria-modal="true"],[class*="menu"],[class*="popover"],[class*="pop"],[class*="flyout"],[class*="dropdown"],[class*="panel"],[class*="overlay"]',
            );
            overlays.forEach((e) => {
              // Keep descendants of the component too: a menu/popover is often a
              // child of the component (e.g. `.toolbar__menu`) yet renders fixed/
              // absolute *outside* its box. Only skip the component itself and any
              // ancestor/wrapper that contains the whole component.
              if (e === el || e.contains(el) || !visible(e)) return;
              const r = e.getBoundingClientRect();
              if (r.width >= vw * 0.95 && r.height >= vh * 0.95) return; // scrim/backdrop
              if (r.right < near.left || r.left > near.right || r.bottom < near.top || r.top > near.bottom) return; // too far
              boxes.push(toBox(r));
            });
            const m = 16;
            const left = Math.max(0, Math.min(...boxes.map((b) => b.left)) - m);
            const top = Math.max(0, Math.min(...boxes.map((b) => b.top)) - m);
            const right = Math.min(document.documentElement.scrollWidth, Math.max(...boxes.map((b) => b.right)) + m);
            const bottom = Math.min(document.documentElement.scrollHeight, Math.max(...boxes.map((b) => b.bottom)) + m);
            return { x: Math.round(left), y: Math.round(top), width: Math.round(right - left), height: Math.round(bottom - top) };
          }, selector);
          if (clip && clip.width > 0 && clip.height > 0) {
            // Translate frame-local coords → page coords, then clamp to the live
            // viewport. We screenshot with captureBeyondViewport:false so that
            // position:fixed menus/flyouts actually render — the default (true)
            // re-lays-out the page for a full-document capture and silently drops
            // fixed-positioned content, which is exactly what open menus use.
            const dims = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
            const x = Math.max(0, clip.x + target.offset.x);
            const y = Math.max(0, clip.y + target.offset.y);
            const w = Math.min(clip.width, dims.w - x);
            const h = Math.min(clip.height, dims.h - y);
            if (w > 0 && h > 0) {
              const buf = await page.screenshot({ clip: { x, y, width: w, height: h }, captureBeyondViewport: false, type: "png" });
              url = await storeCapture(opts.runId, m.screenKey, Buffer.from(buf));
              shot = true;
            }
          }
        }
        if (!shot) {
          const buf = await page.screenshot({ fullPage: !selector, type: "png" });
          url = await storeCapture(opts.runId, m.screenKey, Buffer.from(buf));
        }
        await page.close();
        results.push({ ...base, ok: true, url });
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
