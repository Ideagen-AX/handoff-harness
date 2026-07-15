import { join } from "node:path";
import { access } from "node:fs/promises";
import PptxGenJS from "pptxgenjs";
import type { SlideSpec, Capture } from "./types";
import { readAsset } from "./storage";

// One slide format only: the Ideagen "Blanks - Blank 1" layout, rebuilt from
// scratch so we don't carry the 65 MB master deck. The brand furniture (navy
// gradient, magenta glow, corner dot pattern, Ideagen logo) is a single
// pre-composited background image; text and showcase images are placed on top.
const BG_IMAGE = join(process.cwd(), "specs", "templates", "blank1-bg.png");

// 16:9 widescreen canvas — matches the master (13.333in × 7.5in).
const CANVAS = { w: 13.333, h: 7.5 };

// Ideagen brand — see specs/references/slide-template.md.
const WHITE = "FFFFFF";
const MAGENTA = "F90185"; // accent1 — bullet marks
const LABEL_GREY = "AEB4C2"; // muted caption grey for image labels
const FONT = "Gilroy"; // headings + body; PowerPoint substitutes if absent

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a single-slide .pptx on the Ideagen Blank-1 layout from a SlideSpec.
 * Title + subtitle top-left, magenta-bulleted callouts down the left column,
 * and 1–3 showcase screenshots down the right column (each with an optional
 * label), mirroring the worked example. Returns the .pptx as a Buffer.
 */
export async function buildDeck(slideSpec: SlideSpec, captures: Capture[]): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "IDG_WIDE", width: CANVAS.w, height: CANVAS.h });
  pptx.layout = "IDG_WIDE";
  pptx.author = "Design Handoff Harness";
  pptx.title = slideSpec.title;

  const slide = pptx.addSlide();
  if (await exists(BG_IMAGE)) slide.background = { path: BG_IMAGE };
  else slide.background = { color: "0A1022" }; // navy fallback if asset missing

  // ── Title ──────────────────────────────────────────────────────────────
  slide.addText(slideSpec.title, {
    x: 0.62, y: 0.42, w: 10.8, h: 0.95,
    fontFace: FONT, fontSize: 34, bold: true, color: WHITE,
    align: "left", valign: "top", fit: "shrink",
  });

  // ── Subtitle (kept in the left ~40% so it never runs under the images) ──
  slide.addText(slideSpec.subtitle, {
    x: 0.62, y: 1.5, w: 5.0, h: 1.15,
    fontFace: FONT, fontSize: 18, color: WHITE,
    align: "left", valign: "top", lineSpacingMultiple: 1.08, fit: "shrink",
  });

  // ── Callouts (left column, magenta bullet marks + white text) ───────────
  const callouts = (slideSpec.callouts ?? []).filter((c) => c.trim());
  if (callouts.length) {
    const runs = callouts.flatMap((c) => [
      { text: "•  ", options: { color: MAGENTA, bold: true, breakLine: false } },
      { text: c.trim(), options: { color: WHITE, breakLine: true, paraSpaceAfter: 10 } },
    ]);
    slide.addText(runs, {
      x: 0.62, y: 2.75, w: 4.7, h: 4.4,
      fontFace: FONT, fontSize: 14.5, align: "left", valign: "top",
      lineSpacingMultiple: 1.05,
    });
  }

  // ── Showcase images (right column, stacked, contain-fit, optional label) ─
  // Resolve each capture to base64 via readAsset so it works whether the image
  // lives on local disk or in Vercel Blob (https URL).
  const usable: { data: string; label: string }[] = [];
  for (const img of (slideSpec.images ?? []).slice(0, 3)) {
    const cap = captures.find((c) => c.ok && c.url && c.screenKey === img.screenKey);
    if (!cap?.url) continue;
    try {
      const buf = await readAsset(cap.url);
      usable.push({ data: `image/png;base64,${buf.toString("base64")}`, label: img.label?.trim() ?? "" });
    } catch {
      /* skip an image we can't fetch */
    }
  }

  const RX = 5.95, RW = 6.7, RY = 1.55, RH = 5.45; // right-column box
  const n = usable.length;
  for (let i = 0; i < n; i++) {
    const { data, label } = usable[i];
    const rowH = RH / n;
    const rowTop = RY + i * rowH;
    const labelH = label ? 0.32 : 0;
    if (label) {
      slide.addText(label.toUpperCase(), {
        x: RX, y: rowTop, w: RW, h: labelH,
        fontFace: FONT, fontSize: 10, bold: true, color: LABEL_GREY,
        charSpacing: 2, align: "left", valign: "middle",
      });
    }
    slide.addImage({
      data,
      x: RX, y: rowTop + labelH,
      sizing: { type: "contain", w: RW, h: rowH - labelH - 0.18 },
    });
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
