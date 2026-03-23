"use client";

import Link from "next/link";
import { useState } from "react";

type StartResponse = {
  run_id: number;
  player_name: string;
  stats: { tu_vi: number; karma: number; luck: number; physical: number };
  event?: unknown;
};

export function PlaySetup() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartResponse | null>(null);

  async function handleReady(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
      setResult({
        run_id: data.run_id,
        player_name: data.player_name,
        stats: data.stats,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(`Lỗi mạng: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
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
            className="flex w-full items-center justify-center rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-6 py-3.5 text-base font-medium text-zinc-900 shadow-sm transition-[background-color,box-shadow,transform] hover:bg-amber-950/10 hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100 dark:hover:bg-amber-100/10"
          >
            {loading ? "Đang gieo số phận…" : "Sẵn sàng"}
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
