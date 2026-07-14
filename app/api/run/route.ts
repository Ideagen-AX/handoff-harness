import { runPipeline } from "@/lib/pipeline";
import type { PipelineEvent } from "@/lib/types";

// The Agent SDK friction we avoided (subprocess) doesn't apply here — this is
// pure in-process AI SDK. Still, generation is I/O heavy, so give it room.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { prototypeUrl, note, baselineUrl, codebasePath, framework, enabledOutputs } = await req.json();

  if (!prototypeUrl || typeof prototypeUrl !== "string") {
    return new Response(JSON.stringify({ error: "prototypeUrl is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PipelineEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        for await (const event of runPipeline({
          prototypeUrl,
          note: note ?? "",
          baselineUrl: baselineUrl || undefined,
          codebasePath: codebasePath || undefined,
          framework: framework || undefined,
          enabledOutputs: Array.isArray(enabledOutputs) ? enabledOutputs : undefined,
        })) {
          send(event);
        }
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  // Newline-delimited JSON: one PipelineEvent per line, streamed as produced.
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
