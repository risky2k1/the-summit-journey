import Link from "next/link";
import { prisma } from "@/lib/db";
import { createEvent } from "@/app/game-admin/actions";

export default async function GameAdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { id: "asc" },
    take: 500,
    select: {
      id: true,
      title: true,
      type: true,
      isActive: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Danh sách events
        </h2>
        <form action={createEvent}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            + Tạo event mới
          </button>
        </form>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
          Chưa có event. Bấm &quot;Tạo event mới&quot; để bắt đầu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-950/50">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/50">
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  ID
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Type
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Active
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Sửa
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-2.5 font-mono tabular-nums text-zinc-500">
                    {e.id}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-2.5 text-zinc-900 dark:text-zinc-100">
                    {e.title}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {e.type}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {e.isActive ? "Có" : "Không"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/game-admin/events/${e.id}`}
                      className="text-amber-900 underline-offset-2 hover:underline dark:text-amber-200/90"
                    >
                      Mở
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
