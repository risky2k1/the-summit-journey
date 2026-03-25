"use client";

import type { ChoiceCondition } from "@/generated/prisma/client";
import type { PlayerStats } from "@/lib/game/player-stats";
import { formatConditionLine } from "@/lib/game/stat-copy";
import { passConditions } from "@/lib/game/stats-helpers";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { describeBranching, describeChoiceDestination } from "./branch-copy";
import { formatEffectsLine, PlayerStatPanel } from "./player-stat-panel";
import { RunJourneyTimeline } from "./run-journey-timeline";

type ApiChoice = {
  id: number;
  content: string;
  next_event_id: number | null;
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

type HistoryStep = {
  step: number;
  event: { id: number; title: string; type: string };
  choice: { id: number; content: string };
};

type RunPayload = {
  run_id: number;
  player_name: string;
  stats: PlayerStats;
  current_event_id: number | null;
  event: ApiEvent | null;
  history?: HistoryStep[];
};

type ChoiceFeedback = {
  effects: { stat: string; delta: number }[];
  nextTitle: string | null;
  ended: boolean;
};

type TtsState = "idle" | "loading" | "playing";

export function PlayRun({ runId }: { runId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunPayload | null>(null);
  const [choosingId, setChoosingId] = useState<number | null>(null);
  const [statPulse, setStatPulse] = useState<Partial<Record<keyof PlayerStats, number>>>({});
  const [choiceFeedback, setChoiceFeedback] = useState<ChoiceFeedback | null>(null);
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  const clearPulseLater = useCallback(() => {
    const t = setTimeout(() => setStatPulse({}), 5200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const has = Object.keys(statPulse).length > 0;
    if (!has) return;
    return clearPulseLater();
  }, [statPulse, clearPulseLater]);

  const fetchRun = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
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
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  }, [runId]);

  useEffect(() => {
    void fetchRun();
  }, [fetchRun]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      audioRef.current = null;
    };
  }, []);

  const playEventAudio = useCallback(async () => {
    if (!run?.event) return;

    if (ttsState === "playing") {
      audioRef.current?.pause();
      audioRef.current = null;
      setTtsState("idle");
      return;
    }

    setError(null);
    setTtsState("loading");

    try {
      const text = `${run.event.title}. ${run.event.description}`.trim();
      const cacheKey = text;
      let audioUrl = audioCacheRef.current.get(cacheKey);

      if (!audioUrl) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, eventId: run.event.id }),
        });
        const payload = (await res.json()) as { audioUrl?: string; error?: string };
        if (!res.ok || !payload.audioUrl) {
          throw new Error(payload.error ?? "Không tạo được audio.");
        }
        audioUrl = payload.audioUrl;
        audioCacheRef.current.set(cacheKey, audioUrl);
      }

      const audio = new Audio(audioUrl);
      audioRef.current?.pause();
      audioRef.current = audio;
      audio.onended = () => setTtsState("idle");
      await audio.play();
      setTtsState("playing");
    } catch (e) {
      setTtsState("idle");
      setError(e instanceof Error ? e.message : "Không phát được audio.");
    }
  }, [run?.event, ttsState]);

  const branchNote = useMemo(() => {
    if (!run?.event) return null;
    return describeBranching(run.event.choices, run.event.type);
  }, [run?.event]);

  function mergePulse(effects: { stat: string; delta: number }[]) {
    const next: Partial<Record<keyof PlayerStats, number>> = {};
    const keys = new Set<keyof PlayerStats>(["tu_vi", "karma", "luck", "physical"]);
    for (const e of effects) {
      const k = e.stat as keyof PlayerStats;
      if (!keys.has(k)) continue;
      next[k] = (next[k] ?? 0) + e.delta;
    }
    setStatPulse(next);
  }

  async function pickChoice(choiceId: number) {
    setChoosingId(choiceId);
    setError(null);
    setChoiceFeedback(null);
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
        applied_effects?: { stat: string; delta: number }[];
        resolved_next_event_id?: number | null;
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

      const fx = data.applied_effects ?? [];
      mergePulse(fx);

      if (data.finished || !data.event) {
        setChoiceFeedback({
          effects: fx,
          nextTitle: null,
          ended: true,
        });
        await fetchRun({ silent: true });
        return;
      }

      setChoiceFeedback({
        effects: fx,
        nextTitle: data.event.title,
        ended: false,
      });
      setRun({
        run_id: Number(runId),
        player_name: run?.player_name ?? "",
        stats: data.stats,
        current_event_id: data.event.id,
        event: data.event,
        history: run?.history,
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

  const activeEvent = run.event;
  const finished = run.current_event_id == null || activeEvent == null;

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.1),transparent)]"
      />
      <div
        className={`relative z-10 w-full ${finished ? "max-w-2xl" : "max-w-lg"}`}
      >
        <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          {run.player_name} · Run #{run.run_id}
        </p>

        <div className="mt-6">
          <PlayerStatPanel stats={run.stats} pulse={statPulse} />
        </div>

        {!finished && choiceFeedback ? (
          <div
            className="mt-4 rounded-xl border border-amber-800/30 bg-amber-50/95 px-4 py-3 text-sm shadow-sm dark:border-amber-400/20 dark:bg-amber-950/40"
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100/90">
              Vừa áp dụng
            </p>
            <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
              {formatEffectsLine(choiceFeedback.effects)}
            </p>
            {choiceFeedback.ended ? (
              <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                Chặng khép — xem nhật ký bên dưới (nếu có) để soi lại toàn đường đi.
              </p>
            ) : choiceFeedback.nextTitle ? (
              <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                <span className="text-zinc-500 dark:text-zinc-500">Màn tiếp: </span>
                <span className="font-medium text-amber-950 dark:text-amber-100">
                  {choiceFeedback.nextTitle}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {finished ? (
          <div className="mt-10">
            <div className="text-center">
              <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {run.history && run.history.length > 0
                  ? "Nhật ký đã ghi"
                  : "Hành trình tạm dừng"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {run.history && run.history.length > 0
                  ? "Đường đi từng bước — kéo xem toàn bộ sơ đồ dọc bên dưới."
                  : "Ngươi đã hoàn thành chặng này — hoặc chưa có sự kiện kế tiếp."}
              </p>
            </div>

            {run.history && run.history.length > 0 ? (
              <div className="mt-8 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
                <RunJourneyTimeline steps={run.history} />
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 text-center">
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
        ) : activeEvent ? (
          <article className="mt-10 rounded-xl border border-amber-900/25 bg-amber-950/[0.05] px-5 py-6 dark:border-amber-200/15 dark:bg-amber-100/[0.05]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-zinc-200/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {activeEvent.type}
              </span>
              {activeEvent.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-amber-900/15 px-2 py-0.5 text-[10px] text-zinc-600 dark:border-amber-200/15 dark:text-zinc-400"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <h2 className="font-serif text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {activeEvent.title}
              </h2>
              <button
                type="button"
                onClick={() => void playEventAudio()}
                disabled={ttsState === "loading"}
                aria-label={ttsState === "playing" ? "Dừng phát audio" : "Phát audio sự kiện"}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-900/20 bg-white/85 text-amber-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-200/15 dark:bg-zinc-900 dark:text-amber-100"
              >
                {ttsState === "loading" ? (
                  <span className="text-xs font-semibold">…</span>
                ) : ttsState === "playing" ? (
                  <span className="text-sm font-semibold">■</span>
                ) : (
                  <span className="pl-0.5 text-sm">▶</span>
                )}
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {activeEvent.description}
            </p>

            {branchNote ? (
              <p className="mt-5 rounded-lg border border-amber-800/15 bg-amber-100/40 px-3 py-2.5 text-xs leading-relaxed text-zinc-700 dark:border-amber-200/10 dark:bg-zinc-900/50 dark:text-zinc-300">
                <span className="font-semibold text-amber-950 dark:text-amber-100/90">Cốt truyện &amp; nhánh: </span>
                {branchNote}
              </p>
            ) : null}

            <ul className="mt-8 space-y-5">
              {activeEvent.choices.map((c) => {
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
                      <span className="block">
                        {choosingId === c.id ? "… " : null}
                        {c.content}
                      </span>
                      <span className="mt-2 block text-[11px] text-amber-900/80 dark:text-amber-200/80">
                        {describeChoiceDestination(c, activeEvent.type)}
                      </span>
                      {c.conditions.length > 0 ? (
                        <span className="mt-1.5 block text-[11px] text-zinc-500">
                          Cần:{" "}
                          {c.conditions.map((x) => formatConditionLine(x)).join(" · ")}
                        </span>
                      ) : null}
                      {!ok ? (
                        <span className="mt-2 block text-xs font-medium text-rose-600 dark:text-rose-400">
                          Chưa đủ điều kiện để chọn
                        </span>
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
              onClick={() => void fetchRun()}
            >
              Thử lại
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
