import JSZip from "jszip";
import type { Capture } from "@/lib/types";
import { readAsset } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "screen";
}

// Zip up all captured screenshots (PNGs) for a one-click "download all" of the
// captured screens — separate from the full run bundle.
export async function POST(req: Request) {
  try {
    const { captures } = (await req.json()) as { captures: Capture[] };
    const shots = (Array.isArray(captures) ? captures : []).filter((c) => c.ok && c.url);
    if (!shots.length) {
      return new Response(JSON.stringify({ error: "no captured screenshots" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const zip = new JSZip();
    const seen = new Map<string, number>();
    for (const c of shots) {
      try {
        const buf = await readAsset(c.url!);
        let name = slug(c.screenKey);
        const n = (seen.get(name) ?? 0) + 1;
        seen.set(name, n);
        if (n > 1) name = `${name}-${n}`;
        zip.file(`${name}.png`, buf);
      } catch {
        /* skip missing */
      }
    }
    const buf = (await zip.generateAsync({ type: "nodebuffer" })) as Buffer;
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="screenshots.zip"`,
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
