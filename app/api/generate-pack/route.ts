import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { generatePackSchema } from "../../../lib/schemas";
import {
  createJob,
  normalizeOptions,
  runPackPipeline
} from "../../../lib/pipeline";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = generatePackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const job = await createJob();
  const options = normalizeOptions(parsed.data.options ?? {});
  const models = {
    pro: parsed.data.models?.pro ?? "gemini-1.5-pro",
    flash: parsed.data.models?.flash ?? "gemini-1.5-flash"
  };

  const task = runPackPipeline(job.id, {
    input: parsed.data.input,
    youtubeApiKey: parsed.data.youtubeApiKey,
    geminiApiKey: parsed.data.geminiApiKey,
    models,
    examDate: parsed.data.examDate,
    vaultNotes: parsed.data.vaultNotes,
    vaultDocIds: parsed.data.vaultDocIds,
    researchSources: parsed.data.researchSources,
    options
  });

  if (typeof waitUntil === "function") {
    waitUntil(task);
  } else {
    void task;
  }

  return NextResponse.json({ jobId: job.id });
}
