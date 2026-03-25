import { createEvent } from "@/app/game-admin/actions";
import { prisma } from "@/lib/db";
import { EventTreeClient, type EventTreeNode } from "./event-tree-client";

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

  const rootIds = events
    .filter((event) => (incomingCount.get(event.id) ?? 0) === 0)
    .map((event) => event.id);

  const eventTree =
    events.length === 0
      ? []
      : (events.map((event) => ({
          id: event.id,
          title: event.title,
          type: event.type,
          isActive: event.isActive,
          choicesFromHere: event.choicesFromHere.map((choice) => ({
            id: choice.id,
            content: choice.content,
            nextEventId: choice.nextEventId,
          })),
        })) satisfies EventTreeNode[]);

  const totalChoices = events.reduce((sum, event) => sum + event.choicesFromHere.length, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">Cây nhánh events</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Hiển thị theo sơ đồ node-edge: root ở trên cùng, dây nối xuống các nhánh dưới. Có thể pan và zoom để xem graph lớn.
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
            Hiển thị {events.length} event, {totalChoices} choices. Root nodes: {rootIds.length || 1}.
          </p>
          <EventTreeClient events={eventTree} rootIds={rootIds} />
        </div>
      )}
    </div>
  );
}
