import { briefToMarkdown } from "@/lib/bundle";
import { toPdf, toDocx } from "@/lib/export";
import { ChangeBriefSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Export the Change Brief as Markdown, PDF, or Word. The brief is a structured
// object, so it's serialised to Markdown first (the same rendering used in the zip).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const format = body.format as string;
    const brief = ChangeBriefSchema.parse(body.brief);
    const md = briefToMarkdown(brief);
    const title = `Change brief — ${brief.title}`;

    if (format === "md") {
      return file(Buffer.from(md, "utf8"), "change-brief.md", "text/markdown; charset=utf-8");
    }
    if (format === "pdf") {
      return file(await toPdf(md, title), "change-brief.pdf", "application/pdf");
    }
    if (format === "docx") {
      return file(
        await toDocx(md, title),
        "change-brief.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    }
    return json({ error: "format must be 'md', 'pdf', or 'docx'" }, 400);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

function file(buf: Buffer, filename: string, type: string) {
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
