/**
 * Xóa nội dung story (events/choices/tags/campaign), reset sequence,
 * seed từ `.n8n/result.json` (mảng phần tử đầu có `campaign` + `validation`).
 *
 * `pnpm db:seed` — cần `DATABASE_URL` / `DIRECT_URL` trong `.env`.
 */
import "dotenv/config";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { EventType, PlayerStat } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type JsonEffect = { stat: string; value: number };
type JsonCondition = { stat: string; operator: string; value: number };
type JsonChoice = {
  content: string;
  weight?: number;
  effects: JsonEffect[];
  conditions: JsonCondition[];
  next_event_ref: string | null;
};
type JsonEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  tags: string[];
  pick_weight?: number;
  choices: JsonChoice[];
};
type JsonChapter = {
  chapter_index: number;
  chapter_title: string;
  summary_one_line: string;
  events: JsonEvent[];
};

function loadCampaignPayload(): {
  total_chapters: number;
  total_events: number;
  chapters: JsonChapter[];
} {
  const jsonPath = path.join(process.cwd(), ".n8n/result.json");
  const raw = readFileSync(jsonPath, "utf8");
  const root = JSON.parse(raw) as unknown;
  if (!Array.isArray(root) || root.length < 1) {
    throw new Error("result.json: expected non-empty array root");
  }
  const first = root[0] as { campaign?: unknown };
  const c = first.campaign as {
    total_chapters: number;
    total_events: number;
    chapters: JsonChapter[];
  };
  if (!c?.chapters?.length) {
    throw new Error("result.json: missing campaign.chapters");
  }
  return c;
}

function assertEventType(v: string): EventType {
  if (v === "normal" || v === "encounter" || v === "ending") return v;
  throw new Error(`Invalid event_type: ${v}`);
}

function assertPlayerStat(v: string): PlayerStat {
  if (v === "tu_vi" || v === "karma" || v === "luck" || v === "physical") return v;
  throw new Error(`Invalid stat: ${v}`);
}

async function resetSerialSequences(tables: readonly string[]) {
  for (const tbl of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${tbl}"', 'id'), 1, false)`,
    );
  }
}

async function wipeStoryTables() {
  await prisma.runHistory.deleteMany();
  await prisma.playerRun.updateMany({ data: { currentEventId: null } });
  await prisma.choice.updateMany({ data: { nextEventId: null } });
  await prisma.event.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.campaign.deleteMany();

  await resetSerialSequences([
    "run_history",
    "choice_conditions",
    "choice_effects",
    "choices",
    "event_tags",
    "events",
    "chapters",
    "campaigns",
  ]);
}

async function main() {
  const campaignJson = loadCampaignPayload();
  const startRef = campaignJson.chapters[0]?.events[0]?.id;
  if (!startRef) {
    throw new Error("Cannot derive startEventRef: chapter 1 has no events");
  }

  await wipeStoryTables();

  const campaign = await prisma.campaign.create({
    data: {
      slug: "main",
      totalChapters: campaignJson.total_chapters,
      totalEvents: campaignJson.total_events,
      startEventRef: startRef,
    },
  });

  await prisma.chapter.createMany({
    data: campaignJson.chapters.map((ch) => ({
      campaignId: campaign.id,
      chapterIndex: ch.chapter_index,
      title: ch.chapter_title,
      summaryOneLine: ch.summary_one_line,
    })),
  });

  const chapterRows = await prisma.chapter.findMany({
    where: { campaignId: campaign.id },
    orderBy: { chapterIndex: "asc" },
  });

  const chapterIdByIndex = new Map<number, number>();
  for (const row of chapterRows) {
    chapterIdByIndex.set(row.chapterIndex, row.id);
  }

  const refSet = new Set<string>();
  for (const ch of campaignJson.chapters) {
    for (const ev of ch.events) {
      if (refSet.has(ev.id)) throw new Error(`Duplicate event id: ${ev.id}`);
      refSet.add(ev.id);
    }
  }

  const eventCreateRows: {
    ref: string;
    title: string;
    description: string;
    type: EventType;
    pickWeight: number;
    chapterId: number;
  }[] = [];

  for (const ch of campaignJson.chapters) {
    const chapterId = chapterIdByIndex.get(ch.chapter_index);
    if (chapterId == null) throw new Error(`Missing chapter row for index ${ch.chapter_index}`);
    for (const ev of ch.events) {
      eventCreateRows.push({
        ref: ev.id,
        title: ev.title,
        description: ev.description,
        type: assertEventType(ev.event_type),
        pickWeight: Math.max(1, ev.pick_weight ?? 1),
        chapterId,
      });
    }
  }

  await prisma.event.createMany({ data: eventCreateRows });

  const events = await prisma.event.findMany({
    select: { id: true, ref: true },
  });
  const refToId = new Map<string, number>();
  for (const e of events) {
    if (e.ref) refToId.set(e.ref, e.id);
  }

  const tagRows: { eventId: number; tagName: string }[] = [];
  for (const ch of campaignJson.chapters) {
    for (const ev of ch.events) {
      const eventId = refToId.get(ev.id);
      if (eventId == null) throw new Error(`Missing event id for ref ${ev.id}`);
      for (const tagName of ev.tags ?? []) {
        tagRows.push({ eventId, tagName });
      }
    }
  }

  if (tagRows.length) {
    // 1) insert tags dictionary
    const uniqueTagNames = [...new Set(tagRows.map((x) => x.tagName))];
    await prisma.tag.createMany({
      data: uniqueTagNames.map((name) => ({ name })),
      skipDuplicates: true,
    });

    // 2) map name -> id
    const tags = await prisma.tag.findMany({
      where: { name: { in: uniqueTagNames } },
      select: { id: true, name: true },
    });
    const tagNameToId = new Map(tags.map((t) => [t.name, t.id]));

    // 3) insert links
    await prisma.eventTagLink.createMany({
      data: tagRows.map(({ eventId, tagName }) => {
        const tagId = tagNameToId.get(tagName);
        if (tagId == null) throw new Error(`Missing tag id for ${tagName}`);
        return { eventId, tagId };
      }),
      skipDuplicates: true,
    });
  }

  type FlatChoice = { eventId: number; payload: JsonChoice };
  const flatChoices: FlatChoice[] = [];
  for (const ch of campaignJson.chapters) {
    for (const ev of ch.events) {
      const eventId = refToId.get(ev.id);
      if (eventId == null) throw new Error(`Missing event id for ref ${ev.id}`);
      for (const choice of ev.choices ?? []) {
        flatChoices.push({ eventId, payload: choice });
      }
    }
  }

  if (flatChoices.length > 0) {
    const choiceInsertRows = flatChoices.map(({ eventId, payload: choice }) => {
      const nextRef = choice.next_event_ref;
      let nextEventId: number | null = null;
      if (nextRef != null && String(nextRef).trim() !== "") {
        const nid = refToId.get(nextRef);
        if (nid == null) {
          throw new Error(`next_event_ref not found: "${nextRef}"`);
        }
        nextEventId = nid;
      }
      return {
        eventId,
        content: choice.content,
        weight: Math.max(1, choice.weight ?? 1),
        nextEventId,
      };
    });

    await prisma.choice.createMany({ data: choiceInsertRows });

    const insertedChoices = await prisma.choice.findMany({
      orderBy: [{ eventId: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    if (insertedChoices.length !== flatChoices.length) {
      throw new Error(
        `Choice count mismatch: expected ${flatChoices.length}, got ${insertedChoices.length}`,
      );
    }

    const effectRows: { choiceId: number; stat: PlayerStat; value: number }[] = [];
    const conditionRows: {
      choiceId: number;
      stat: PlayerStat;
      operator: string;
      value: number;
    }[] = [];

    for (let i = 0; i < flatChoices.length; i++) {
      const choiceId = insertedChoices[i]!.id;
      const choice = flatChoices[i]!.payload;
      for (const ef of choice.effects ?? []) {
        effectRows.push({
          choiceId,
          stat: assertPlayerStat(ef.stat),
          value: ef.value,
        });
      }
      for (const co of choice.conditions ?? []) {
        conditionRows.push({
          choiceId,
          stat: assertPlayerStat(co.stat),
          operator: co.operator,
          value: co.value,
        });
      }
    }

    if (effectRows.length) {
      await prisma.choiceEffect.createMany({ data: effectRows });
    }
    if (conditionRows.length) {
      await prisma.choiceCondition.createMany({ data: conditionRows });
    }
  }

  const countEvents = await prisma.event.count();
  const countChoices = await prisma.choice.count();
  console.log(
    `Seed OK: campaign "${campaign.slug}", ${countEvents} events, ${countChoices} choices, start ref "${startRef}" → id ${refToId.get(startRef)}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
