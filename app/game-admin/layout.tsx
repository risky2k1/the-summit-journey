import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export default async function GameAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.1),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.06),transparent)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-800/80 dark:text-amber-200/70">
            Game admin
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Quản trị nội dung
            </h1>
            <nav className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/game-admin"
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Tổng quan
              </Link>
              <Link
                href="/game-admin/events"
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Events
              </Link>
              <Link
                href="/dashboard"
                className="text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline dark:hover:text-zinc-300"
              >
                ← Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
