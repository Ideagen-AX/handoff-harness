import { join, basename, dirname } from "node:path";
import Automizer, { ModifyTextHelper, ModifyImageHelper } from "pptx-automizer";
import type { ISlide } from "pptx-automizer/dist/interfaces/islide";
import type { ModificationCallback } from "pptx-automizer/dist/types/types";
import type { SlideSpec, Capture } from "./types";

const TEMPLATES_DIR = join(process.cwd(), "specs", "templates");

// Each branded content slide in the master maps to a sample slide number and the
// shape names to fill. Verified against Ideagen_MASTER-BLANK-Template_JUN26.
const SLIDE_TEMPLATES = {
  Teal: { slide: 12, title: "Title 14", subtitle: "Text Placeholder 6", attribution: "Text Placeholder 9", pic: "Picture Placeholder 21" },
  Pink: { slide: 11, title: "Title 10", subtitle: "Text Placeholder 16", attribution: "Text Placeholder 9", pic: "Picture Placeholder 7" },
} as const;

/**
 * Build a single-slide .pptx on the Ideagen master template from a SlideSpec.
 * Clones the chosen branded content slide, fills its title/subtitle/attribution,
 * and swaps its picture for the captured hero screenshot when one is available.
 */
export async function buildDeck(slideSpec: SlideSpec, captures: Capture[]): Promise<Buffer> {
  const map = SLIDE_TEMPLATES[slideSpec.template] ?? SLIDE_TEMPLATES.Teal;

  // Resolve the hero image (if the chosen screenKey was captured to disk).
  const hero = captures.find((c) => c.ok && c.url && c.screenKey === slideSpec.picScreenKey);
  const heroPath = hero?.url ? join(process.cwd(), "public", hero.url.replace(/^\//, "")) : null;

  const automizer = new Automizer({
    templateDir: TEMPLATES_DIR,
    // Media is loaded by absolute-ish path below, so mediaDir points at the hero's folder.
    mediaDir: heroPath ? dirname(heroPath) : TEMPLATES_DIR,
    removeExistingSlides: true,
  });

  automizer.loadRoot("ideagen-base.pptx").load("ideagen-master.pptx", "tmpl");
  if (heroPath) automizer.loadMedia([basename(heroPath)]);

  const pres = automizer.addSlide("tmpl", map.slide, (slide: ISlide) => {
    slide.modifyElement(map.title, [ModifyTextHelper.setText(slideSpec.title)]);
    slide.modifyElement(map.subtitle, [ModifyTextHelper.setText(slideSpec.subtitle)]);
    if (slideSpec.attribution) {
      slide.modifyElement(map.attribution, [ModifyTextHelper.setText(slideSpec.attribution)]);
    }
    if (heroPath) {
      // setRelationTarget's callback type differs from the chart-callback union
      // member; the cast reconciles a known automizer typing inconsistency.
      const swap = ModifyImageHelper.setRelationTarget(basename(heroPath)) as unknown as ModificationCallback;
      slide.modifyElement(map.pic, [swap]);
    }
  });

  const zip = await pres.getJSZip();
  return zip.generateAsync({ type: "nodebuffer" }) as Promise<Buffer>;
}
