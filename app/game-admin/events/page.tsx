import Link from "next/link";
import { createEvent } from "@/app/game-admin/actions";
import { prisma } from "@/lib/db";

type EventNode = {
  id: number;
  title: string;
  type: string;
  isActive: boolean;
  choicesFromHere: Array<{
    id: number;
    content: string;
    nextEventId: number | null;
  }>;
};

const MAX_TREE_DEPTH = 12;

function EventBranchTree({
  event,
  byId,
  depth,
  path,
}: {
  event: EventNode;
  byId: Map<number, EventNode>;
  depth: number;
  path: Set<number>;
}) {
  const isCycle = path.has(event.id);

  if (isCycle) {
    return (
      <li className="space-y-1 rounded-md border border-rose-300/70 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-950/20 dark:text-rose-200">
        Vòng lặp phát hiện tại event #{event.id}. Dừng render để tránh lặp vô hạn.
      </li>
    );
  }

  if (depth > MAX_TREE_DEPTH) {
    return (
      <li className="space-y-1 rounded-md border border-amber-300/70 bg-amber-50/80 p-3 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-200">
        Đã đạt giới hạn độ sâu {MAX_TREE_DEPTH} tại event #{event.id}. Tiếp tục chỉnh sửa bằng nút Mở.
      </li>
    );
  }

  const nextPath = new Set(path);
  nextPath.add(event.id);

  return (
    <li className="space-y-3">
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-xs text-zinc-500">#{event.id}</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{event.title}</span>
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
            {event.type}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {event.isActive ? "Active" : "Inactive"}
          </span>
          <Link
            href={`/game-admin/events/${event.id}`}
            className="ml-auto text-amber-900 underline-offset-2 hover:underline dark:text-amber-200/90"
          >
            Mở
          </Link>
        </div>
      </div>

      {event.choicesFromHere.length > 0 ? (
        <ul className="space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-700">
          {event.choicesFromHere.map((choice) => {
            if (choice.nextEventId == null) {
              return (
                <li
                  key={choice.id}
                  className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/70 p-2.5 text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300"
                >
                  <p className="line-clamp-2">↳ {choice.content}</p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500">Kết thúc nhánh (next_event_id = null)</p>
                </li>
              );
            }

            const nextEvent = byId.get(choice.nextEventId);

            return (
              <li key={choice.id} className="space-y-2">
                <div className="rounded-md border border-zinc-200/80 bg-zinc-50/80 p-2.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                  <p className="line-clamp-2">↳ {choice.content}</p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500">next_event_id: {choice.nextEventId}</p>
                </div>

                {nextEvent ? (
                  <ul className="space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-700">
                    <EventBranchTree event={nextEvent} byId={byId} depth={depth + 1} path={nextPath} />
                  </ul>
                ) : (
                  <p className="text-xs text-rose-600 dark:text-rose-300">
                    Event #{choice.nextEventId} không tồn tại hoặc đã bị xoá.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Event này chưa có choices.</p>
      )}
    </li>
  );
}

export default async function GameAdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { id: "asc" },
    take: 500,
    select: {
      id: true,
      title: true,
      type: true,
      isActive: true,
      choicesFromHere: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          content: true,
          nextEventId: true,
        },
      },
    },
  });

  const byId = new Map(events.map((event) => [event.id, event]));

  const incomingCount = new Map<number, number>();
  for (const event of events) {
    incomingCount.set(event.id, 0);
  }

  for (const event of events) {
    for (const choice of event.choicesFromHere) {
      if (choice.nextEventId != null && incomingCount.has(choice.nextEventId)) {
        incomingCount.set(choice.nextEventId, (incomingCount.get(choice.nextEventId) ?? 0) + 1);
      }
    }
  }

  const roots = events.filter((event) => (incomingCount.get(event.id) ?? 0) === 0);
  const rootEvents = roots.length > 0 ? roots : events.slice(0, 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">Cây nhánh events</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Bấm <span className="font-medium">Mở</span> tại từng node để vào màn hình sửa chi tiết.
          </p>
        </div>

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
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hiển thị {events.length} event. Root nodes: {rootEvents.length}.
          </p>
          <ul className="space-y-4">
            {rootEvents.map((event) => (
              <EventBranchTree key={event.id} event={event} byId={byId} depth={0} path={new Set<number>()} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
