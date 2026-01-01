import { NextResponse } from "next/server";
import { coachSessionSchema } from "../../../../lib/schemas";
import { getPack, setCoachSession } from "../../../../lib/store";
import { makeId } from "../../../../lib/utils";
import { CoachSession } from "../../../../lib/types";

export async function POST(request: Request) {
  const traceId = makeId("trace");
  const json = (body: unknown, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    response.headers.set("x-request-id", traceId);
    return response;
  };

  const body = await request.json().catch(() => null);
  const parsed = coachSessionSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const pack = await getPack(parsed.data.packId);
  if (!pack) {
    return json({ error: "Pack not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const session: CoachSession = {
    id: makeId("coach"),
    packId: pack.id,
    mode: parsed.data.mode ?? "coach",
    history: [],
    researchApiKey: parsed.data.researchApiKey,
    researchQuery: parsed.data.researchQuery,
    browserUseApiKey: parsed.data.browserUseApiKey,
    useBrowserUse: parsed.data.useBrowserUse,
    createdAt: now,
    updatedAt: now
  };

  await setCoachSession(session);

  return json({ sessionId: session.id });
}
