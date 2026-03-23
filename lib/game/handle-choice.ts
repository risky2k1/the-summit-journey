import type { PlayerStats } from "@/lib/game/player-stats";
import { findNextEventId } from "@/lib/game/find-next-event";
import {
  applyChoiceEffects,
  parsePlayerStats,
  passConditions,
} from "@/lib/game/stats-helpers";
import { getEventForApi, type ApiEventPayload } from "@/lib/game/serialize-event";
import { prisma } from "@/lib/db";

export type AppliedEffectDelta = { stat: string; delta: number };

export type HandleChoiceResult = {
  stats: PlayerStats;
  event: ApiEventPayload | null;
  finished: boolean;
  /** Chỉ số cộng trừ từ `choice_effects` (một dòng = một delta). */
  applied_effects: AppliedEffectDelta[];
  /** Event id thực tế sau khi resolve (có thể khác `choice.nextEventId` khi random). */
  resolved_next_event_id: number | null;
};

export async function handlePlayerChoice(input: {
  userId: string;
  runId: number;
  choiceId: number;
}): Promise<HandleChoiceResult> {
  const run = await prisma.playerRun.findFirst({
    where: { id: input.runId, userId: input.userId },
  });

  if (!run) {
    throw new Error("RUN_NOT_FOUND");
  }
  if (run.currentEventId == null) {
    throw new Error("RUN_NO_CURRENT_EVENT");
  }

  const choice = await prisma.choice.findFirst({
    where: { id: input.choiceId, eventId: run.currentEventId },
    include: {
      effects: true,
      conditions: true,
      event: true,
    },
  });

  if (!choice) {
    throw new Error("CHOICE_INVALID");
  }

  let stats = parsePlayerStats(run.stats);
  if (!passConditions(stats, choice.conditions)) {
    throw new Error("CHOICE_CONDITIONS_FAILED");
  }

  const applied_effects: AppliedEffectDelta[] = choice.effects.map((e) => ({
    stat: e.stat,
    delta: e.value,
  }));

  stats = applyChoiceEffects(stats, choice.effects);

  const fromEvent = choice.event;
  let nextEventId: number | null;

  if (choice.nextEventId != null) {
    nextEventId = choice.nextEventId;
  } else if (fromEvent.type === "ending") {
    nextEventId = null;
  } else {
    nextEventId = await findNextEventId(stats);
  }

  const resolved_next_event_id = nextEventId;

  const previousEventId = run.currentEventId;

  await prisma.$transaction([
    prisma.playerRun.update({
      where: { id: run.id },
      data: {
        stats,
        currentEventId: nextEventId,
      },
    }),
    prisma.runHistory.create({
      data: {
        runId: run.id,
        eventId: previousEventId,
        choiceId: choice.id,
      },
    }),
  ]);

  if (nextEventId == null) {
    return {
      stats,
      event: null,
      finished: true,
      applied_effects,
      resolved_next_event_id,
    };
  }

  const event = await getEventForApi(nextEventId);
  return {
    stats,
    event,
    finished: false,
    applied_effects,
    resolved_next_event_id,
  };
}
