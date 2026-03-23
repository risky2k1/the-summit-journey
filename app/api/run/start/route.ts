import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newRunSeed, rollInitialStats } from "@/lib/game/player-stats";
import { getEventForApi } from "@/lib/game/serialize-event";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Chương mở: bắt đầu tại event 1 (seed `20260320183100_seed_early_events`). */
const START_EVENT_ID = 1;

const NAME_MIN = 1;
const NAME_MAX = 32;

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.length < NAME_MIN || t.length > NAME_MAX) return null;
  return t;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    let name: string | null = null;
    if (typeof body === "object" && body !== null && "name" in body) {
      name = normalizeName((body as { name: unknown }).name);
    }

    if (name === null) {
      return NextResponse.json(
        {
          error: `Tên cần từ ${NAME_MIN}–${NAME_MAX} ký tự sau khi trim.`,
        },
        { status: 400 },
      );
    }

    const stats = rollInitialStats();
    const seed = newRunSeed();

    const run = await prisma.playerRun.create({
      data: {
        userId: user.id,
        playerName: name,
        stats,
        seed,
        currentEventId: START_EVENT_ID,
      },
    });

    const event = await getEventForApi(START_EVENT_ID);

    return NextResponse.json({
      run_id: run.id,
      player_name: name,
      stats,
      event: event ?? {},
    });
  } catch (err) {
    console.error("[POST /api/run/start]", err);
    const message =
      process.env.NODE_ENV === "production"
        ? "Không thể tạo nhân vật. Thử lại sau."
        : err instanceof Error
          ? err.message
          : "Không thể tạo nhân vật.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
