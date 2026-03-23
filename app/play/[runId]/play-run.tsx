"use client";

import type { ChoiceCondition } from "@/generated/prisma/client";
import type { PlayerStats } from "@/lib/game/player-stats";
import { passConditions } from "@/lib/game/stats-helpers";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ApiChoice = {
  id: number;
  content: string;
  effects: { stat: string; value: number }[];
  conditions: { stat: string; operator: string; value: number }[];
};

type ApiEvent = {
  id: number;
  title: string;
  description: string;
  type: string;
  tags: string[];
  choices: ApiChoice[];
};

type RunPayload = {
  run_id: number;
  player_name: string;
  stats: PlayerStats;
  current_event_id: number | null;
  event: ApiEvent | null;
};

export function PlayRun({ runId }: { runId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunPayload | null>(null);
  const [choosingId, setChoosingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/run/${runId}`);
      const raw = await res.text();
      let data: (RunPayload & { error?: string }) | null = null;
      try {
        data = raw ? (JSON.parse(raw) as RunPayload & { error?: string }) : null;
      } catch {
        setError(`Lỗi ${res.status}: phản hồi không phải JSON.`);
        return;
      }
      if (res.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent(`/play/${runId}`)}`;
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Không tải được run.");
        return;
      }
      if (!data?.run_id) {
        setError("Thiếu dữ liệu run.");
        return;
      }
      setRun(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi mạng.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pickChoice(choiceId: number) {
    setChoosingId(choiceId);
    setError(null);
    try {
      const res = await fetch("/api/run/choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: Number(runId), choice_id: choiceId }),
      });
      const raw = await res.text();
      let data: {
        event: ApiEvent | null;
        stats: PlayerStats;
        finished?: boolean;
        error?: string;
      } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        setError(res.ok ? "Phản hồi không hợp lệ." : `Lỗi ${res.status}`);
        return;
      }
      if (res.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent(`/play/${runId}`)}`;
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Không áp dụng được lựa chọn.");
        return;
      }
      if (!data?.stats) {
        setError("Phản hồi thiếu stats.");
        return;
      }
      if (data.finished || !data.event) {
        setRun({
          run_id: Number(runId),
          player_name: run?.player_name ?? "",
          stats: data.stats,
          current_event_id: null,
          event: null,
        });
        return;
      }
      setRun({
        run_id: Number(runId),
        player_name: run?.player_name ?? "",
        stats: data.stats,
        current_event_id: data.event.id,
        event: data.event,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi mạng.");
    } finally {
      setChoosingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Đang tải hành trình…</p>
      </div>
    );
  }

  if (error && !run) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
        <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
        <Link href="/dashboard" className="text-sm text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90">
          Về tiến trình
        </Link>
      </div>
    );
  }

  if (!run) return null;

  const finished = run.current_event_id == null || run.event == null;

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.1),transparent)]"
      />
      <div className="relative z-10 w-full max-w-lg">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          {run.player_name} · Run #{run.run_id}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {(
            [
              ["Tu vi", run.stats.tu_vi],
              ["Karma", run.stats.karma],
              ["Luck", run.stats.luck],
              ["Thể lực", run.stats.physical],
            ] as const
          ).map(([label, v]) => (
            <div
              key={label}
              className="rounded-lg border border-amber-900/20 bg-white/60 px-3 py-2 text-center dark:border-amber-200/10 dark:bg-zinc-950/40"
            >
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
              <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{v}</dd>
            </div>
          ))}
        </dl>

        {error ? (
          <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {finished ? (
          <div className="mt-10 text-center">
            <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Hành trình tạm dừng
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Ngươi đã hoàn thành chặng này — hoặc chưa có sự kiện kế tiếp.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/play"
                className="text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
              >
                Tạo nhân vật mới →
              </Link>
              <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                Tiến trình
              </Link>
            </div>
          </div>
        ) : run.event ? (
          <article className="mt-10 rounded-xl border border-amber-900/25 bg-amber-950/[0.05] px-5 py-6 dark:border-amber-200/15 dark:bg-amber-100/[0.05]">
            <h2 className="font-serif text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {run.event.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {run.event.description}
            </p>
            <ul className="mt-8 space-y-3">
              {run.event.choices.map((c) => {
                const ok = passConditions(run.stats, c.conditions as ChoiceCondition[]);
                const disabled = !ok || choosingId !== null;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void pickChoice(c.id)}
                      className="w-full rounded-lg border border-amber-900/20 bg-white/70 px-4 py-3 text-left text-sm leading-relaxed text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 dark:border-amber-200/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-900/80"
                    >
                      {choosingId === c.id ? "…" : null}
                      {c.content}
                      {!ok ? (
                        <span className="mt-1 block text-xs text-zinc-500">Chưa đủ điều kiện</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        ) : (
          <p className="mt-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Chưa tải được nội dung chương.{" "}
            <button
              type="button"
              className="font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
              onClick={() => void load()}
            >
              Thử lại
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
