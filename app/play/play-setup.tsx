"use client";

import Link from "next/link";
import { useState } from "react";

type StartResponse = {
  run_id: number;
  player_name: string;
  stats: { tu_vi: number; karma: number; luck: number };
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
      const data = (await res.json()) as StartResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Không thể tạo nhân vật.");
        return;
      }
      setResult({
        run_id: data.run_id,
        player_name: data.player_name,
        stats: data.stats,
      });
    } catch {
      setError("Lỗi mạng. Thử lại sau.");
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
        <div className="relative z-10 w-full max-w-md text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            Run #{result.run_id}
          </p>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Hành trình bắt đầu
          </h2>
          <p className="mt-2 text-lg text-amber-900/90 dark:text-amber-200/90">
            {result.player_name}
          </p>
          <dl className="mt-10 space-y-3 rounded-lg border border-amber-900/20 bg-amber-950/[0.04] px-6 py-5 text-left text-sm dark:border-amber-200/15 dark:bg-amber-100/[0.04]">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Tu vi</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {result.stats.tu_vi}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Karma</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {result.stats.karma}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Luck</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {result.stats.luck}
              </dd>
            </div>
          </dl>
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
            Số phận đã gieo — đường tuỳ ngươi bước tiếp.
          </p>
          <Link
            href="/"
            className="mt-10 inline-block text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
          >
            ← Về trang chủ
          </Link>
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

        <Link
          href="/"
          className="mt-10 block text-center text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
