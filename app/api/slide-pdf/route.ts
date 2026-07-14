import { renderSlideHtml } from "@/lib/slide-html";
import { slideHtmlToPdf } from "@/lib/export";
import { SlideSpecSchema, type Capture } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Export the actual styled slide (Blanks-Blank-1 layout) as a single-page PDF —
// not the Markdown preview. Renders the same HTML the .pptx is built from.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slideSpec = SlideSpecSchema.parse(body.slideSpec);
    const captures: Capture[] = Array.isArray(body.captures) ? body.captures : [];

    const html = await renderSlideHtml(slideSpec, captures);
    const pdf = await slideHtmlToPdf(html);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="slide.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
