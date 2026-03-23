import { NextResponse } from "next/server";
import { parsePlayerStats } from "@/lib/game/stats-helpers";
import { getRunHistoryForApi } from "@/lib/game/run-history";
import { getEventForApi } from "@/lib/game/serialize-event";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ runId: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
    }

    const raw = (await ctx.params).runId;
    const runId = Number.parseInt(raw, 10);
    if (!Number.isFinite(runId) || runId < 1) {
      return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
    }

    const run = await prisma.playerRun.findFirst({
      where: { id: runId, userId: user.id },
    });

    if (!run) {
      return NextResponse.json({ error: "Không tìm thấy run." }, { status: 404 });
    }

    let stats;
    try {
      stats = parsePlayerStats(run.stats);
    } catch {
      return NextResponse.json({ error: "Dữ liệu stats không hợp lệ." }, { status: 500 });
    }

    const event =
      run.currentEventId != null ? await getEventForApi(run.currentEventId) : null;

    const history = await getRunHistoryForApi(runId);

    return NextResponse.json({
      run_id: run.id,
      player_name: run.playerName,
      stats,
      current_event_id: run.currentEventId,
      event,
      history,
    });
  } catch (err) {
    console.error("[GET /api/run/[runId]]", err);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
