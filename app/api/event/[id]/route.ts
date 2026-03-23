import { NextResponse } from "next/server";
import { getEventForApi } from "@/lib/game/serialize-event";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const raw = (await ctx.params).id;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  }

  const event = await getEventForApi(id);
  if (!event) {
    return NextResponse.json({ error: "Không tìm thấy sự kiện." }, { status: 404 });
  }

  return NextResponse.json(event);
}
