import type { EventType } from "@/generated/prisma/client";
import type { PlayerStats } from "@/lib/game/player-stats";
import { pickWeightedById } from "@/lib/game/weighted-pick";
import { prisma } from "@/lib/db";

/**
 * Khi `next_event_id` trống và không phải ending — chọn event kế theo karma + random có trọng số (`pick_weight`).
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

  const selectIdWeight = { id: true, pickWeight: true } as const;

  const tagged = tag
    ? await prisma.event.findMany({
        where: {
          ...baseWhere,
          tags: { some: { tag } },
        },
        select: selectIdWeight,
      })
    : [];

  const pool =
    tagged.length > 0
      ? tagged
      : await prisma.event.findMany({
          where: baseWhere,
          select: selectIdWeight,
        });

  return pickWeightedById(pool);
}
