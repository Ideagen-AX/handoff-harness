import { composeDraft, toEml, type EmailAttachment } from "@/lib/email";
import { buildDeck } from "@/lib/deck";
import type { Artifact, Capture, SlideSpec } from "@/lib/types";

export const runtime = "nodejs";

// STUB: real Outlook/Graph sending is intentionally not wired (blocked on M365
// auth). This composes the draft and returns it as a downloadable .eml the user
// opens in Outlook and sends manually. For the slide, the generated .pptx is
// attached to the draft. Swap this for a Graph send-mail call once auth is available.
export async function POST(req: Request) {
  try {
    const { artifact, changeTitle, slideSpec, captures } = (await req.json()) as {
      artifact: Artifact;
      changeTitle?: string;
      slideSpec?: SlideSpec;
      captures?: Capture[];
    };
    if (!artifact?.content) {
      return new Response(JSON.stringify({ error: "artifact is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For the slide, attach the branded .pptx to the draft.
    const attachments: EmailAttachment[] = [];
    if (artifact.audienceId === "slide" && slideSpec) {
      try {
        const deck = await buildDeck(slideSpec, Array.isArray(captures) ? captures : []);
        attachments.push({
          filename: "slide.pptx",
          contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          base64: deck.toString("base64"),
        });
      } catch {
        /* deck build unavailable (e.g. on Vercel) — send the draft without it */
      }
    }

    const draft = composeDraft(artifact, changeTitle);
    const eml = toEml(draft, new Date().toUTCString(), attachments);
    const slug = artifact.audienceId.replace(/[^a-z0-9]+/gi, "-");

    return new Response(eml, {
      headers: {
        "Content-Type": "message/rfc822",
        "Content-Disposition": `attachment; filename="${slug}-draft.eml"`,
        "X-Email-Stubbed": "true", // sending not wired; draft only
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
