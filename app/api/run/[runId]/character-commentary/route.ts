import { NextResponse } from "next/server";
import { generateCharacterCommentary } from "@/lib/ai/character-commentary";
import { prisma } from "@/lib/db";
import { parsePlayerStats } from "@/lib/game/stats-helpers";
import { resolvePlayApiUserId } from "@/lib/dev-play-bypass";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
/** Cho phép OpenRouter trả lời đủ; tránh cắt giữa chừng do giới hạn function. */
export const maxDuration = 60;

export async function POST(_request: Request, ctx: { params: Promise<{ runId: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = resolvePlayApiUserId(user?.id);
    if (!userId) {
      return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
    }

    const raw = (await ctx.params).runId;
    const runId = Number.parseInt(raw, 10);
    if (!Number.isFinite(runId) || runId < 1) {
      return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
    }

    const run = await prisma.playerRun.findFirst({
      where: { id: runId, userId },
      select: {
        id: true,
        playerName: true,
        stats: true,
        characterCommentary: true,
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Không tìm thấy run." }, { status: 404 });
    }

    if (run.characterCommentary != null && run.characterCommentary.length > 0) {
      return NextResponse.json({ character_commentary: run.characterCommentary });
    }

    let stats;
    try {
      stats = parsePlayerStats(run.stats);
    } catch {
      return NextResponse.json({ error: "Dữ liệu stats không hợp lệ." }, { status: 500 });
    }

    const text = await generateCharacterCommentary({
      playerName: run.playerName,
      stats,
    });

    if (text != null) {
      await prisma.playerRun.update({
        where: { id: run.id },
        data: { characterCommentary: text },
      });
    }

    return NextResponse.json({ character_commentary: text });
  } catch (err) {
    console.error("[character-commentary]", err);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
