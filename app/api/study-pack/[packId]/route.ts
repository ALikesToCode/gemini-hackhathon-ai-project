import { NextResponse } from "next/server";
import { deletePack, getPack } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  return NextResponse.json(pack);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;
  const removed = await deletePack(packId);
  if (!removed) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
