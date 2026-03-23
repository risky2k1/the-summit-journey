import { NextResponse } from "next/server";
import { handlePlayerChoice } from "@/lib/game/handle-choice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function mapError(code: string): { status: number; message: string } {
  switch (code) {
    case "RUN_NOT_FOUND":
      return { status: 404, message: "Không tìm thấy run." };
    case "RUN_NO_CURRENT_EVENT":
      return { status: 400, message: "Run đã kết thúc hoặc chưa có sự kiện hiện tại." };
    case "CHOICE_INVALID":
      return { status: 400, message: "Lựa chọn không hợp lệ cho sự kiện này." };
    case "CHOICE_CONDITIONS_FAILED":
      return { status: 400, message: "Chưa đủ điều kiện để chọn hành động này." };
    default:
      return { status: 500, message: "Không xử lý được lựa chọn." };
  }
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

    if (typeof body !== "object" || body === null || !("run_id" in body) || !("choice_id" in body)) {
      return NextResponse.json({ error: "Thiếu run_id hoặc choice_id." }, { status: 400 });
    }

    const runId = Number((body as { run_id: unknown }).run_id);
    const choiceId = Number((body as { choice_id: unknown }).choice_id);
    if (!Number.isFinite(runId) || !Number.isFinite(choiceId)) {
      return NextResponse.json({ error: "run_id hoặc choice_id không hợp lệ." }, { status: 400 });
    }

    try {
      const result = await handlePlayerChoice({
        userId: user.id,
        runId,
        choiceId,
      });
      return NextResponse.json({
        event: result.event,
        stats: result.stats,
        finished: result.finished,
        applied_effects: result.applied_effects,
        resolved_next_event_id: result.resolved_next_event_id,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const mapped = mapError(code);
      if (mapped.status === 500) {
        console.error("[POST /api/run/choice]", err);
      }
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "production"
              ? mapped.message
              : mapped.message + (code ? ` (${code})` : ""),
        },
        { status: mapped.status },
      );
    }
  } catch (err) {
    console.error("[POST /api/run/choice]", err);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
