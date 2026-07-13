import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";
import { findChrome } from "./capture";

// Wrap rendered Markdown in a clean, print-ready HTML document. Neutral and
// professional with a subtle Ideagen-magenta accent on headings.
function renderHtml(markdown: string, title: string): string {
  const body = marked.parse(markdown, { async: false }) as string;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 15px/1.6 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1f2b; margin: 0; padding: 48px 56px; }
  h1, h2, h3, h4 { color: #0E1324; line-height: 1.25; margin: 1.4em 0 0.5em; }
  h1 { font-size: 26px; border-bottom: 3px solid #F90185; padding-bottom: 8px; }
  h2 { font-size: 20px; } h3 { font-size: 16px; }
  a { color: #BB0164; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #f2f3f5; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #0E1324; color: #EDEEF0; padding: 14px 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; color: inherit; padding: 0; }
  blockquote { margin: 1em 0; padding: 8px 16px; border-left: 3px solid #29D2D7; background: #f7fbfb; color: #24303C; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #d7dbe0; padding: 8px 10px; text-align: left; font-size: 14px; }
  th { background: #EDEEF0; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  ul, ol { padding-left: 22px; }
</style></head><body>${body}</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// Markdown → PDF using the system Chrome (local-first, like capture). Throws a
// clear error off-browser so the API can report it rather than hanging.
export async function toPdf(markdown: string, title: string): Promise<Buffer> {
  const executablePath = await findChrome();
  if (!executablePath) {
    throw new Error("PDF export needs a local Chrome/Edge; none found (run locally).");
  }
  const { launch } = await import("puppeteer-core");
  const browser = await launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(renderHtml(markdown, title), { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}

// Markdown → Word (.docx) via html-to-docx. Pure JS — works anywhere.
export async function toDocx(markdown: string, title: string): Promise<Buffer> {
  const html = renderHtml(markdown, title);
  const out = await HTMLtoDOCX(html, undefined, { title, footer: false, pageNumber: false });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
