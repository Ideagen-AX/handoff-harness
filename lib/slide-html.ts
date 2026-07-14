import { join } from "node:path";
import { readFile } from "node:fs/promises";
import type { SlideSpec, Capture } from "./types";

// Renders the Blanks-Blank-1 slide as a self-contained HTML page at the exact
// slide canvas (1280×720 px = 13.333in × 7.5in). Used for the slide PDF export
// so the PDF shows the actual styled slide, not the Markdown preview. Mirrors the
// pptxgenjs layout in lib/deck.ts, with the background and screenshots inlined as
// data URIs so it renders with no server/network dependency.
const BG_IMAGE = join(process.cwd(), "specs", "templates", "blank1-bg.png");

async function dataUri(absPath: string, mime = "image/png"): Promise<string | null> {
  try {
    const buf = await readFile(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return (s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

export async function renderSlideHtml(slideSpec: SlideSpec, captures: Capture[]): Promise<string> {
  const bg = await dataUri(BG_IMAGE);

  // Resolve up to 3 images to inline data URIs, in order.
  const imgs: { src: string; label: string }[] = [];
  for (const img of (slideSpec.images ?? []).slice(0, 3)) {
    const cap = captures.find((c) => c.ok && c.url && c.screenKey === img.screenKey);
    if (!cap?.url) continue;
    const src = await dataUri(join(process.cwd(), "public", cap.url.replace(/^\//, "")));
    if (src) imgs.push({ src, label: (img.label ?? "").trim() });
  }

  // Right column geometry (px @ 96dpi) — matches deck.ts.
  const RX = 571, RW = 643, RY = 149, RH = 523;
  const n = imgs.length;
  const rowH = n ? RH / n : RH;
  const imageBlocks = imgs
    .map((im, i) => {
      const top = RY + i * rowH;
      const labelH = im.label ? 31 : 0;
      const label = im.label
        ? `<div class="lbl" style="left:${RX}px;top:${top}px">${esc(im.label.toUpperCase())}</div>`
        : "";
      const imgTop = top + labelH;
      const imgH = rowH - labelH - 17;
      return `${label}<img class="shot" src="${im.src}" style="left:${RX}px;top:${imgTop}px;width:${RW}px;height:${imgH}px">`;
    })
    .join("\n");

  const callouts = (slideSpec.callouts ?? [])
    .filter((c) => c.trim())
    .map((c) => `<div class="row"><span class="b">•</span><span>${esc(c.trim())}</span></div>`)
    .join("\n");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: 13.333in 7.5in; margin: 0; }
  html,body{margin:0;padding:0}
  #c{position:relative;width:1280px;height:720px;overflow:hidden;color:#fff;
     font-family:'Gilroy','Helvetica Neue',Arial,sans-serif;
     ${bg ? `background-image:url('${bg}');` : "background:#0A1022;"}background-size:cover}
  .t{position:absolute}
  #title{left:59px;top:40px;width:1037px;font-size:45px;font-weight:700;line-height:1.05}
  #sub{left:59px;top:144px;width:480px;font-size:24px;line-height:1.14;font-weight:400}
  #bul{left:59px;top:264px;width:451px;font-size:19px;line-height:1.4}
  #bul .row{margin-bottom:12px;display:flex;gap:10px}
  #bul .b{color:#F90185;font-weight:700}
  .lbl{position:absolute;font-size:13px;font-weight:700;letter-spacing:2px;color:#AEB4C2}
  .shot{position:absolute;object-fit:contain;object-position:left top}
</style></head><body>
  <div id="c">
    <div class="t" id="title">${esc(slideSpec.title)}</div>
    <div class="t" id="sub">${esc(slideSpec.subtitle)}</div>
    <div class="t" id="bul">${callouts}</div>
    ${imageBlocks}
  </div>
</body></html>`;
}
