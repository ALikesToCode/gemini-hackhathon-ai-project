import { getJob } from "../../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJob(jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown, event?: string) => {
        const prefix = event ? `event: ${event}\n` : "";
        controller.enqueue(
          encoder.encode(`${prefix}data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      send(job);

      interval = setInterval(async () => {
        const latest = await getJob(jobId);
        if (!latest) {
          send({ error: "Job not found" }, "error");
          if (interval) clearInterval(interval);
          controller.close();
          return;
        }

        send(latest);
        if (latest.status === "completed" || latest.status === "failed") {
          send({ status: latest.status, packId: latest.packId }, "done");
          if (interval) clearInterval(interval);
          controller.close();
        }
      }, 1500);
    },
    cancel() {
      if (interval) clearInterval(interval);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
