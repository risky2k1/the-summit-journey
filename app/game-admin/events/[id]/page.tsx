import Link from "next/link";
import { notFound } from "next/navigation";
import { EventType, PlayerStat } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { EventDetailClient } from "./event-detail-client";

export default async function GameAdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      choicesFromHere: {
        orderBy: { id: "asc" },
        include: {
          effects: { orderBy: { id: "asc" } },
        },
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/game-admin/events"
          className="text-zinc-500 hover:text-zinc-800 hover:underline dark:hover:text-zinc-300"
        >
          ← Danh sách events
        </Link>
        <span className="text-zinc-400">·</span>
        <span className="font-mono text-zinc-500">#{event.id}</span>
      </div>

      <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sửa event
      </h2>

      <EventDetailClient
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          isActive: event.isActive,
          pickWeight: event.pickWeight,
          choicesFromHere: event.choicesFromHere.map((c) => ({
            id: c.id,
            content: c.content,
            weight: c.weight,
            nextEventId: c.nextEventId,
            effects: c.effects.map((e) => ({
              id: e.id,
              stat: e.stat,
              value: e.value,
            })),
          })),
        }}
        eventTypeOptions={Object.values(EventType)}
        playerStatOptions={Object.values(PlayerStat)}
      />
    </div>
  );
}
