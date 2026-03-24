"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type StartResponse = {
  run_id: number;
  player_name: string;
  stats: { tu_vi: number; karma: number; luck: number; physical: number };
  event?: unknown;
};

/** Thông điệp xoay vòng khi đợi OpenRouter — mỗi ~2,8s sang giai đoạn kế. */
const COMMENTARY_LOADING_LINES = [
  "Các lão phu đang họp bàn…",
  "Đang xem xét kĩ lưỡng…",
  "Có người gõ quẻ, có người soi mạch…",
  "Ghi lại vài nét lên ngọc giản…",
  "Còn tranh luận xem nên buông lời thế nào…",
  "Thiên cơ chưa chịu lộ — chờ thêm một nhịp…",
] as const;

const COMMENTARY_LINE_INTERVAL_MS = 2800;

/** Hiển thị tối thiểu để người chơi kịp thấy các bước soi căn cốt (ms). */
const EVALUATION_MIN_DISPLAY_MS = 1800;
const EVALUATION_STEP_INTERVAL_MS = 720;

const EVALUATION_STAT_ROWS = [
  { key: "tu_vi", label: "Tu vi", hint: "Soi mạch linh căn" },
  { key: "karma", label: "Karma", hint: "Ngắm vầng nhân quả" },
  { key: "luck", label: "Luck", hint: "Đo vận thế thiên thời" },
  { key: "physical", label: "Thể lực", hint: "Thử gân cốt huyết nhục" },
] as const;

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PlaySetup() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartResponse | null>(null);
  const [commentaryStatus, setCommentaryStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [commentaryText, setCommentaryText] = useState<string | null>(null);
  const [commentaryLoadingLineIndex, setCommentaryLoadingLineIndex] = useState(0);
  const [evaluationStepIndex, setEvaluationStepIndex] = useState(0);
  const evaluationStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (commentaryStatus !== "loading") {
      setCommentaryLoadingLineIndex(0);
      return;
    }
    setCommentaryLoadingLineIndex(0);
    const id = window.setInterval(() => {
      setCommentaryLoadingLineIndex((i) => (i + 1) % COMMENTARY_LOADING_LINES.length);
    }, COMMENTARY_LINE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [commentaryStatus]);

  useEffect(() => {
    if (!loading) {
      setEvaluationStepIndex(0);
      return;
    }
    setEvaluationStepIndex(0);
    const id = window.setInterval(() => {
      setEvaluationStepIndex((i) => (i + 1) % EVALUATION_STAT_ROWS.length);
    }, EVALUATION_STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!result?.run_id) return;
    let cancelled = false;
    const url = `/api/run/${result.run_id}/character-commentary`;
    setCommentaryStatus("loading");
    setCommentaryText(null);

    (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
        });
        const rawText = await res.text();
        if (cancelled) {
          return;
        }
        let data: { error?: string; character_commentary?: string | null } = {};
        try {
          data = rawText ? (JSON.parse(rawText) as typeof data) : {};
        } catch {
          setCommentaryStatus("error");
          return;
        }
        if (!res.ok) {
          setCommentaryStatus("error");
          return;
        }
        const t = data.character_commentary;
        const isStr = typeof t === "string";
        setCommentaryText(isStr ? t : null);
        setCommentaryStatus("done");
      } catch {
        if (!cancelled) {
          setCommentaryStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [result?.run_id]);

  async function handleReady(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    evaluationStartedAtRef.current = Date.now();
    try {
      const res = await fetch("/api/run/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const raw = await res.text();
      let data: (StartResponse & { error?: string }) | null = null;
      try {
        data = raw ? (JSON.parse(raw) as StartResponse & { error?: string }) : null;
      } catch {
        setError(
          res.ok
            ? "Phản hồi không hợp lệ từ máy chủ."
            : `Lỗi ${res.status}: ${raw.slice(0, 200) || res.statusText}`,
        );
        return;
      }
      if (res.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent("/play")}`;
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Không thể tạo nhân vật.");
        return;
      }
      if (!data?.run_id || !data.stats) {
        setError("Phản hồi thiếu dữ liệu.");
        return;
      }
      const started = evaluationStartedAtRef.current;
      if (started != null) {
        const wait = EVALUATION_MIN_DISPLAY_MS - (Date.now() - started);
        if (wait > 0) {
          await new Promise((r) => window.setTimeout(r, wait));
        }
      }
      setCommentaryStatus("loading");
      setCommentaryText(null);
      setCommentaryLoadingLineIndex(0);
      setResult({
        run_id: data.run_id,
        player_name: data.player_name,
        stats: data.stats,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(`Lỗi mạng: ${msg}`);
    } finally {
      evaluationStartedAtRef.current = null;
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.1),transparent)]"
        />
        <div className="relative z-10 w-full max-w-md">
          <h2 className="text-center font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Đang đánh giá căn cốt
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Các vị tiền bối đang lần lượt soi từng nhánh — xin chờ một nhịp.
          </p>

          <div
            className="mt-8 rounded-xl border border-amber-900/25 bg-amber-950/[0.05] px-4 py-5 dark:border-amber-200/15 dark:bg-amber-100/[0.05]"
            role="status"
            aria-live="polite"
            aria-label="Tiến trình đánh giá thông số"
          >
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Bảng soi mạch
            </p>
            <ul className="space-y-2">
              {EVALUATION_STAT_ROWS.map((row, i) => {
                const active = i === evaluationStepIndex;
                return (
                  <li
                    key={row.key}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-[border-color,background-color,box-shadow] duration-300 ${
                      active
                        ? "border-amber-700/45 bg-amber-100/90 shadow-sm dark:border-amber-400/35 dark:bg-amber-950/50"
                        : "border-amber-900/12 bg-white/50 dark:border-amber-200/10 dark:bg-zinc-950/30"
                    }`}
                  >
                    <div className="min-w-0 text-left">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.hint}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {active ? (
                        <>
                          <SpinnerIcon className="h-5 w-5 animate-spin text-amber-700 dark:text-amber-300" />
                          <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                            Đang đo…
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Chờ lượt…</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Đang gieo số phận lên máy chủ…
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="relative flex min-h-full w-full flex-1 shrink-0 flex-col items-center justify-start overflow-y-auto overscroll-y-contain px-6 pb-24 pt-10 sm:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.1),transparent)]"
        />
        <div className="relative z-10 w-full max-w-md">
          <h2 className="text-center font-serif text-2xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            Nhân vật của bạn đã được tạo
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Thiên cơ đã định — căn cốt như sau. Hành trình sẽ tùy vào từng lựa chọn của
            ngươi.
          </p>

          <div className="mt-8 rounded-xl border border-amber-900/25 bg-amber-950/[0.05] px-5 py-6 dark:border-amber-200/15 dark:bg-amber-100/[0.05]">
            <div className="border-b border-amber-900/15 pb-4 text-center dark:border-amber-200/10">
              <p className="text-lg font-medium text-amber-950 dark:text-amber-100">
                {result.player_name}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Hồ sơ tu hành · Run #{result.run_id}
              </p>
            </div>
            <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Thông số
            </p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4 rounded-md bg-white/60 px-3 py-2 dark:bg-zinc-950/40">
                <dt className="text-zinc-600 dark:text-zinc-400">Tu vi</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {result.stats.tu_vi}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-white/60 px-3 py-2 dark:bg-zinc-950/40">
                <dt className="text-zinc-600 dark:text-zinc-400">Karma</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {result.stats.karma}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-white/60 px-3 py-2 dark:bg-zinc-950/40">
                <dt className="text-zinc-600 dark:text-zinc-400">Luck</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {result.stats.luck}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-white/60 px-3 py-2 dark:bg-zinc-950/40">
                <dt className="text-zinc-600 dark:text-zinc-400">Thể lực</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {result.stats.physical}
                </dd>
              </div>
            </dl>

            {/* Cùng một thẻ hồ sơ — tránh tách khối khiến dễ “mất” dưới fold hoặc trùng nền */}
            <div className="mt-6 border-t border-amber-900/20 pt-6 dark:border-amber-200/15">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-amber-900/90 dark:text-amber-200/90">
                Lời thiên cơ
              </p>
              <div className="mt-3 min-h-[7rem] rounded-lg border border-amber-800/15 bg-amber-50/80 px-3 py-4 dark:border-amber-300/20 dark:bg-zinc-900/60">
                {commentaryStatus === "loading" ? (
                  <div className="flex flex-col items-center gap-3 py-1">
                    <SpinnerIcon className="h-8 w-8 animate-spin text-amber-700 dark:text-amber-300" />
                    <p
                      className="min-h-[2.5rem] text-center text-xs leading-relaxed text-zinc-700 dark:text-zinc-300"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {COMMENTARY_LOADING_LINES[commentaryLoadingLineIndex]}
                    </p>
                    <div
                      className="h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-amber-900/15 dark:bg-amber-200/15"
                      aria-hidden
                    >
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-amber-600/50 to-amber-500/80 dark:from-amber-400/60 dark:to-amber-200/70" />
                    </div>
                  </div>
                ) : commentaryStatus === "error" ? (
                  <p className="text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Thiên cơ chưa buông lời — có thể thử tải lại trang sau.
                  </p>
                ) : commentaryText ? (
                  <blockquote className="border-none p-0">
                    <p className="text-center text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {commentaryText}
                    </p>
                  </blockquote>
                ) : (
                  <p className="text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Thiên cơ giữ im — chưa có lời nhận xét (kiểm tra cấu hình OpenRouter nếu cần).
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Hành trình bắt đầu
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={`/play/${result.run_id}`}
              className="block rounded-lg border border-amber-900/25 bg-amber-950/[0.08] py-3 text-center text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-amber-950/12 dark:border-amber-200/15 dark:bg-amber-100/[0.08] dark:text-zinc-100 dark:hover:bg-amber-100/12"
            >
              Vào chương →
            </Link>
            <Link
              href="/dashboard"
              className="block text-center text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
            >
              Về tiến trình →
            </Link>
            <Link
              href="/"
              className="block text-center text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ← Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.1),transparent)]"
      />
      <div className="relative z-10 w-full max-w-md">
        <h2 className="text-center font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dựng nhân vật
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Đặt danh hiệu tu hành của ngươi.
        </p>

        <form onSubmit={handleReady} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="player-name"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Tên
            </label>
            <input
              id="player-name"
              name="name"
              type="text"
              autoComplete="off"
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Lý Thanh Minh"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none ring-amber-800/30 placeholder:text-zinc-400 focus:border-amber-800/40 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-amber-200/30"
              required
            />
          </div>

          {error ? (
            <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || name.trim().length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-6 py-3.5 text-base font-medium text-zinc-900 shadow-sm transition-[background-color,box-shadow,transform] hover:bg-amber-950/10 hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100 dark:hover:bg-amber-100/10"
          >
            {loading ? (
              <>
                <SpinnerIcon className="h-5 w-5 shrink-0 animate-spin text-amber-800 dark:text-amber-200" />
                <span>Đang gieo số phận…</span>
              </>
            ) : (
              "Sẵn sàng"
            )}
          </button>
        </form>

        <div className="mt-10 flex flex-col gap-2 text-center text-sm">
          <Link
            href="/dashboard"
            className="font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
          >
            Tiến trình của ngươi
          </Link>
          <Link href="/" className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
