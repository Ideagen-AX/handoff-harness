import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

// Environment probes. On Vercel the filesystem is read-only (except /tmp) and
// captures can't be written under public/, so we store to Vercel Blob instead.
// Locally (no Blob token) we keep the served public/ path.
export const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
export const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

const PUBLIC_DIR = join(process.cwd(), "public");

// Store a capture PNG and return a URL usable by the client (<img src>) AND by
// downstream readers (deck, bundle, slide PDF). Blob → a public https URL;
// local → a Next-served /captures path.
export async function storeCapture(runId: string, key: string, buf: Buffer): Promise<string> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`captures/${runId}/${key}.png`, buf, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
    });
    return url;
  }
  const dir = join(PUBLIC_DIR, "captures", runId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${key}.png`), buf);
  return `/captures/${runId}/${key}.png`;
}

// Read an asset by the URL storeCapture returned: http(s) → fetch; otherwise a
// local served path under public/. Lets deck/bundle/slide code stay agnostic to
// where the screenshots actually live.
export async function readAsset(url: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(join(PUBLIC_DIR, url.replace(/^\//, "")));
}
