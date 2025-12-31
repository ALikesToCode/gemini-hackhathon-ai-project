import { NextResponse } from "next/server";
import { coachMessageSchema } from "../../../../../lib/schemas";
import { buildCoachPrompt } from "../../../../../lib/coach";
import { fetchResearchSources } from "../../../../../lib/research";
import { streamText } from "../../../../../lib/gemini";
import {
  deleteCoachSession,
  getCoachSession,
  getPack,
  updateCoachSession
} from "../../../../../lib/store";
import { makeId } from "../../../../../lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const traceId = makeId("trace");
  const session = await getCoachSession(params.sessionId);
  if (!session) {
    const response = NextResponse.json({ error: "Session not found" }, { status: 404 });
    response.headers.set("x-request-id", traceId);
    return response;
  }

  const response = NextResponse.json(session);
  response.headers.set("x-request-id", traceId);
  return response;
}

export async function DELETE(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const traceId = makeId("trace");
  const removed = await deleteCoachSession(params.sessionId);
  if (!removed) {
    const response = NextResponse.json({ error: "Session not found" }, { status: 404 });
    response.headers.set("x-request-id", traceId);
    return response;
  }
  const response = NextResponse.json({ ok: true });
  response.headers.set("x-request-id", traceId);
  return response;
}

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const traceId = makeId("trace");
  const body = await request.json().catch(() => null);
  const parsed = coachMessageSchema.safeParse({
    ...body,
    sessionId: params.sessionId
  });

  if (!parsed.success) {
    const response = NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
    response.headers.set("x-request-id", traceId);
    return response;
  }

  const session = await getCoachSession(parsed.data.sessionId);
  if (!session) {
    const response = NextResponse.json({ error: "Session not found" }, { status: 404 });
    response.headers.set("x-request-id", traceId);
    return response;
  }

  const pack = await getPack(session.packId);
  if (!pack) {
    const response = NextResponse.json({ error: "Pack not found" }, { status: 404 });
    response.headers.set("x-request-id", traceId);
    return response;
  }

  const history = session.history ?? [];
  const { system, prompt } = buildCoachPrompt(
    pack,
    parsed.data.message,
    history,
    session.mode
  );

  let enrichedPrompt = prompt;
  if (session.mode === "assist") {
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
  let assistantText = "";
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = textStream.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            assistantText += value;
            controller.enqueue(encoder.encode(value));
          }
        }
      } finally {
        await updateCoachSession(session.id, {
          history: [
            ...history,
            { role: "user", content: parsed.data.message },
            { role: "assistant", content: assistantText }
          ]
        });
        controller.close();
      }
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
