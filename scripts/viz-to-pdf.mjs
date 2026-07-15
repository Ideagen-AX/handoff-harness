// One-off: render viz/index.html to a PDF via the installed system Chrome.
// Mirrors lib/capture.ts's Chrome detection so it "just works" locally.
import { launch } from "puppeteer-core";
import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

async function firstExisting(paths) {
  for (const p of paths) {
    try { await stat(p); return p; } catch {}
  }
  return null;
}

const src = resolve("viz/index.html");
const out = resolve("docs/handoff-harness-architecture.pdf");

const executablePath = await firstExisting(CHROME_PATHS);
if (!executablePath) {
  console.error("No system Chrome/Edge found — cannot render PDF.");
  process.exit(1);
}

const browser = await launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(pathToFileURL(src).href, { waitUntil: "networkidle0" });
// Honour the page's dark styling in the PDF instead of forcing print colours.
await page.emulateMediaType("screen");
await page.pdf({
  path: out,
  printBackground: true,
  width: "1260px",
  height: "1760px",
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();
console.log(`Wrote ${out}`);
