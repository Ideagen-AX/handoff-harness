import { toPdf, toDocx } from "@/lib/export";

export const runtime = "nodejs";
export const maxDuration = 60;

// Convert one artifact's Markdown to PDF or Word (.docx).
export async function POST(req: Request) {
  try {
    const { format, title, content } = await req.json();
    if (!content || typeof content !== "string") {
      return json({ error: "content is required" }, 400);
    }
    const safeTitle = (title || "artifact").toString();
    const slug = safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artifact";

    if (format === "pdf") {
      const buf = await toPdf(content, safeTitle);
      return file(buf, `${slug}.pdf`, "application/pdf");
    }
    if (format === "docx") {
      const buf = await toDocx(content, safeTitle);
      return file(
        buf,
        `${slug}.docx`,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    }
    return json({ error: "format must be 'pdf' or 'docx'" }, 400);
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
