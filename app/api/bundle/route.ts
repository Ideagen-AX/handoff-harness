import { buildBundle } from "@/lib/bundle";

export const runtime = "nodejs";
export const maxDuration = 60;

// Package a whole run (brief + artifacts + screenshots + deck) into a .zip.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.brief && !(Array.isArray(body?.artifacts) && body.artifacts.length)) {
      return json({ error: "nothing to bundle" }, 400);
    }
    const buffer = await buildBundle({
      title: body.title,
      meta: body.meta,
      brief: body.brief ?? null,
      artifacts: Array.isArray(body.artifacts) ? body.artifacts : [],
      captures: Array.isArray(body.captures) ? body.captures : [],
    });
    const name = `handoff-${(body.title || "run").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "run"}.zip`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
