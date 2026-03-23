import type { EventType } from "@/generated/prisma/client";
import type { PlayerStats } from "@/lib/game/player-stats";
import { prisma } from "@/lib/db";

/**
 * Khi `next_event_id` trống và không phải ending — chọn event kế theo karma + random có trọng số.
 * Khớp hướng dẫn trong `.cursor/docs/game-engine.md`.
 */
export async function findNextEventId(stats: PlayerStats): Promise<number | null> {
  const karma = stats.karma;
  let tag: string | undefined;
  if (karma < -20) tag = "ma_dao";
  else if (karma > 20) tag = "chinh_dao";

  const baseWhere = {
    isActive: true,
    type: { not: "ending" as EventType },
  };

  const tagged = tag
    ? await prisma.event.findMany({
        where: {
          ...baseWhere,
          tags: { some: { tag } },
        },
        select: { id: true },
      })
    : [];

  const pool =
    tagged.length > 0
      ? tagged
      : await prisma.event.findMany({
          where: baseWhere,
          select: { id: true },
        });

  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}
