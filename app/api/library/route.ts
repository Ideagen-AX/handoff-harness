import { listProjects } from "@/lib/library";

export const runtime = "nodejs";

// List every stored run, grouped by design project (metadata only).
export async function GET() {
  const projects = await listProjects();
  return Response.json({ projects });
}
