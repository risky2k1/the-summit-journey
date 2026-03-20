import Link from "next/link";

export default function GameAdminHomePage() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Chỉnh sửa sự kiện, loại (normal / encounter / ending) và các lựa chọn kèm hiệu ứng stat.
      </p>
      <ul className="space-y-3">
        <li>
          <Link
            href="/game-admin/events"
            className="inline-flex rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-amber-950/10 dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100"
          >
            Quản lý events &amp; choices
          </Link>
        </li>
      </ul>
    </div>
  );
}
