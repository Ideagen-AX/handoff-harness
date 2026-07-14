import { buildDeck } from "@/lib/deck";
import { SlideSpecSchema, type Capture } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Build and return a single-slide .pptx on the Ideagen master template.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slideSpec = SlideSpecSchema.parse(body.slideSpec);
    const captures: Capture[] = Array.isArray(body.captures) ? body.captures : [];

    const buffer = await buildDeck(slideSpec, captures);
    const filename = "slide.pptx";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
