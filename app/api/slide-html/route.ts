import { renderSlideHtml } from "@/lib/slide-html";
import { SlideSpecSchema, type Capture } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Export the styled slide as a self-contained HTML document for web
// presentations — the same HTML the .pptx and PDF are built from, with
// screenshots inlined as data URIs so the file is fully portable.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slideSpec = SlideSpecSchema.parse(body.slideSpec);
    const captures: Capture[] = Array.isArray(body.captures) ? body.captures : [];

    const html = await renderSlideHtml(slideSpec, captures);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="slide.html"`,
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
