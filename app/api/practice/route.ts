import { NextResponse } from "next/server";
import { getPack } from "../../../lib/store";
import { buildPracticeSet } from "../../../lib/practice";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packId = searchParams.get("packId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 5;

  if (!packId) {
    return NextResponse.json({ error: "Missing packId" }, { status: 400 });
  }

  const pack = await getPack(packId);
  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const plan = buildPracticeSet(pack, Number.isFinite(limit) ? Math.max(1, limit) : 5);
  return NextResponse.json({ packId: pack.id, ...plan });
}
