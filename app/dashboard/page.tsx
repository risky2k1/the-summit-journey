import Link from "next/link";
import { redirect } from "next/navigation";
import { isSuperAdminUser } from "@/lib/auth/super-admin";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayerStats } from "@/lib/game/player-stats";
import { SignOutButton } from "./sign-out-button";

function statsPreview(stats: unknown): string {
  if (!stats || typeof stats !== "object") return "—";
  const s = stats as PlayerStats;
  if (typeof s.tu_vi !== "number") return "—";
  const ph = typeof s.physical === "number" ? s.physical : "—";
  return `Tu vi ${s.tu_vi} · Karma ${s.karma} · Luck ${s.luck} · Thể lực ${ph}`;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth/login?next=/dashboard");
  }

  const runs = await prisma.playerRun.findMany({
    where: { userId: user.id },
    orderBy: { id: "desc" },
    take: 50,
  });

  const showAdmin = isSuperAdminUser(user);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.08),transparent)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-lg">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Tiến trình của ngươi
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
          </div>
          <SignOutButton />
        </header>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/play"
            className="flex w-full items-center justify-center rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-amber-950/10 dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100"
          >
            Tạo run mới
          </Link>
          {showAdmin ? (
            <Link
              href="/game-admin"
              className="flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Quản trị game
            </Link>
          ) : null}
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Các lần chơi
          </h2>
          {runs.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
              Chưa có run nào. Bấm &quot;Tạo run mới&quot; để bắt đầu nhân vật.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {runs.map((run) => (
                <li key={run.id}>
                  <Link
                    href={`/play/${run.id}`}
                    className="group block rounded-lg border border-zinc-200 bg-white/80 px-4 py-3 transition hover:border-amber-800/35 hover:bg-amber-950/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:border-zinc-700 dark:bg-zinc-950/50 dark:hover:border-amber-200/25 dark:hover:bg-amber-100/[0.05]"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {run.playerName}
                      </span>
                      <span className="text-xs text-zinc-500">#{run.id}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {statsPreview(run.stats)}
                    </p>
                    {run.currentEventId != null ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Event hiện tại: {run.currentEventId}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500">
                        Đã kết thúc hoặc chưa vào chương
                      </p>
                    )}
                    <p className="mt-2 text-xs font-medium text-amber-800 group-hover:underline dark:text-amber-200/90">
                      {run.currentEventId != null
                        ? "Tiếp tục hành trình →"
                        : "Xem lại / màn kết →"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/"
          className="mt-10 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          ← Trang chủ
        </Link>
      </div>
    </div>
  );
}
