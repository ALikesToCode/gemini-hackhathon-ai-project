import { NextResponse } from "next/server";
import { coachSchema } from "../../../lib/schemas";
import { getPack } from "../../../lib/store";
import { buildCoachPrompt } from "../../../lib/coach";
import { fetchResearchSources } from "../../../lib/research";
import { streamText } from "../../../lib/gemini";
import { makeId } from "../../../lib/utils";

export async function POST(request: Request) {
  const traceId = makeId("trace");
  const body = await request.json().catch(() => null);
  const parsed = coachSchema.safeParse(body);

  if (!parsed.success) {
    const response = NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
    response.headers.set("x-request-id", traceId);
    return response;
  }

  const pack = await getPack(parsed.data.packId);
  if (!pack) {
    const response = NextResponse.json({ error: "Pack not found" }, { status: 404 });
    response.headers.set("x-request-id", traceId);
    return response;
  }

  const { system, prompt } = buildCoachPrompt(
    pack,
    parsed.data.message,
    parsed.data.history,
    parsed.data.mode
  );

  let enrichedPrompt = prompt;
  if (parsed.data.mode === "assist") {
    const urls = parsed.data.message.match(/https?:\/\/[^\s]+/g) ?? [];
    if (urls.length) {
      const sources = await fetchResearchSources(urls.slice(0, 2));
      const appendix = sources
        .map((source) => `URL: ${source.url}\nExcerpt: ${source.excerpt}`)
        .join("\n\n");
      enrichedPrompt = `${prompt}\n\nAdditional resources:\n${appendix}`;
    }
  }

  const textStream = await streamText({
    apiKey: parsed.data.geminiApiKey,
    model: parsed.data.model,
    prompt: enrichedPrompt,
    system,
    config: {
      temperature: 0.5,
      maxOutputTokens: 800,
      retry: { maxRetries: 1, baseDelayMs: 500 }
    }
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = textStream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        controller.enqueue(encoder.encode(value));
      }
      controller.close();
    }
  });

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
  response.headers.set("x-request-id", traceId);
  return response;
}
