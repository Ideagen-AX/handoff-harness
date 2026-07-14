import { getRun, deleteRun } from "@/lib/library";

export const runtime = "nodejs";

// Fetch one full stored run by project + id (query params).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || "";
  const id = searchParams.get("id") || "";
  const run = await getRun(project, id);
  if (!run) {
    return new Response(JSON.stringify({ error: "run not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return Response.json({ run });
}

// Delete one stored run.
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || "";
  const id = searchParams.get("id") || "";
  const ok = await deleteRun(project, id);
  return Response.json({ ok });
}
