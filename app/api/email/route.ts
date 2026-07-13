import { composeDraft, toEml } from "@/lib/email";
import type { Artifact } from "@/lib/types";

export const runtime = "nodejs";

// STUB: real Outlook/Graph sending is intentionally not wired (blocked on M365
// auth). This composes the draft and returns it as a downloadable .eml the user
// opens in Outlook and sends manually. Swap this for a Graph send-mail call once
// auth is available.
export async function POST(req: Request) {
  try {
    const { artifact, changeTitle } = (await req.json()) as { artifact: Artifact; changeTitle?: string };
    if (!artifact?.content) {
      return new Response(JSON.stringify({ error: "artifact is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const draft = composeDraft(artifact, changeTitle);
    const eml = toEml(draft, new Date().toUTCString());
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
