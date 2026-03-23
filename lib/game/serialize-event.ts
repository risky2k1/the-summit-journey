import type { EventType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type ApiChoicePayload = {
  id: number;
  content: string;
  effects: { stat: string; value: number }[];
  conditions: { stat: string; operator: string; value: number }[];
};

export type ApiEventPayload = {
  id: number;
  title: string;
  description: string;
  type: EventType;
  tags: string[];
  choices: ApiChoicePayload[];
};

const eventInclude = {
  choicesFromHere: {
    orderBy: { id: "asc" as const },
    include: { effects: true, conditions: true },
  },
  tags: { orderBy: { id: "asc" as const } },
} as const;

export async function getEventForApi(eventId: number): Promise<ApiEventPayload | null> {
  const row = await prisma.event.findFirst({
    where: { id: eventId, isActive: true },
    include: eventInclude,
  });
  if (!row) return null;
  return toApiEventPayload(row);
}

export function toApiEventPayload(row: {
  id: number;
  title: string;
  description: string;
  type: EventType;
  choicesFromHere: {
    id: number;
    content: string;
    effects: { stat: string; value: number }[];
    conditions: { stat: string; operator: string; value: number }[];
  }[];
  tags: { tag: string }[];
}): ApiEventPayload {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    tags: row.tags.map((t) => t.tag),
    choices: row.choicesFromHere.map((c) => ({
      id: c.id,
      content: c.content,
      effects: c.effects.map((e) => ({ stat: e.stat, value: e.value })),
      conditions: c.conditions.map((x) => ({
        stat: x.stat,
        operator: x.operator,
        value: x.value,
      })),
    })),
  };
}
