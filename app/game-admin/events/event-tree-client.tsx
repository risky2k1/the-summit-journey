"use client";

import dynamic from "next/dynamic";

export type EventTreeNode = {
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

const EventTreeFlow = dynamic(
  () => import("./event-tree-flow").then((mod) => mod.EventTreeFlow),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Đang dựng sơ đồ events...
      </div>
    ),
  },
);

export function EventTreeClient({
  events,
  rootIds,
}: {
  events: EventTreeNode[];
  rootIds: number[];
}) {
  return <EventTreeFlow events={events} rootIds={rootIds} />;
}
