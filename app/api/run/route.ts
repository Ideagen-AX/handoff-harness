import { runPipeline } from "@/lib/pipeline";
import type { PipelineEvent } from "@/lib/types";

// The Agent SDK friction we avoided (subprocess) doesn't apply here — this is
// pure in-process AI SDK. Still, generation is I/O heavy, so give it room.
export const runtime = "nodejs";
// Pro-tier ceiling. The full fan-out (understand + serverless capture + ~9
// artifacts, the heaviest being the 16k coded component) can exceed the old
// 300s default on a cold run — which killed the stream mid-generation, dropping
// the last artifact and skipping the library save. 800s gives it room.
export const maxDuration = 800;

export async function POST(req: Request) {
  const {
    prototypeUrl, note, baselineUrl, baselineImage, codebasePath, codebaseScope, framework, enabledOutputs, subject, componentSelector,
    projectName, designDescription, projectContext, focusAreas, designDecisions, designSource,
  } = await req.json();

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
          baselineImage: typeof baselineImage === "string" && baselineImage.startsWith("data:image/") ? baselineImage : undefined,
          codebasePath: codebasePath || undefined,
          codebaseScope: codebaseScope || undefined,
          framework: framework || undefined,
          enabledOutputs: Array.isArray(enabledOutputs) ? enabledOutputs : undefined,
          subject: subject || undefined,
          componentSelector: componentSelector || undefined,
          projectName: projectName || undefined,
          designDescription: designDescription || undefined,
          projectContext: projectContext || undefined,
          focusAreas: focusAreas || undefined,
          designDecisions: designDecisions || undefined,
          designSource: designSource || undefined,
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
