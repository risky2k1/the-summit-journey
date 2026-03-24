/**
 * Chạy thử luồng engine trên DB (không HTTP): tạo run tạm, luôn chọn choice id nhỏ nhất mỗi event,
 * xóa run + history sau cùng.
 *
 * Usage: `pnpm game:dry-run` (cần `DATABASE_URL` / `DIRECT_URL` trong `.env`)
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import { handlePlayerChoice } from "@/lib/game/handle-choice";
import { newRunSeed, rollInitialStats } from "@/lib/game/player-stats";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

async function resolveStartEventId(): Promise<number> {
  const campaign = await prisma.campaign.findUnique({ where: { slug: "main" } });
  if (!campaign) throw new Error("Chạy `pnpm db:seed` trước (thiếu campaign main).");
  const ev = await prisma.event.findFirst({
    where: { ref: campaign.startEventRef, isActive: true },
    select: { id: true },
  });
  if (!ev) throw new Error(`Không tìm thấy event ref "${campaign.startEventRef}".`);
  return ev.id;
}

async function main() {
  const startEventId = await resolveStartEventId();
  const run = await prisma.playerRun.create({
    data: {
      userId: TEST_USER_ID,
      playerName: "DryRun",
      stats: rollInitialStats(),
      seed: newRunSeed(),
      currentEventId: startEventId,
    },
  });

  console.log("Dry-run run id:", run.id);

  for (let step = 1; step <= 40; step++) {
    const current = await prisma.playerRun.findUnique({ where: { id: run.id } });
    if (!current?.currentEventId) {
      console.log("No current event — stop step", step);
      break;
    }

    const firstChoice = await prisma.choice.findFirst({
      where: { eventId: current.currentEventId },
      orderBy: { id: "asc" },
    });
    if (!firstChoice) {
      console.log("No choices for event", current.currentEventId);
      break;
    }

    console.log(
      `Step ${step}: event ${current.currentEventId} → choice ${firstChoice.id} (${firstChoice.content.slice(0, 32)}…)`,
    );

    const result = await handlePlayerChoice({
      userId: TEST_USER_ID,
      runId: run.id,
      choiceId: firstChoice.id,
    });

    if (result.finished) {
      console.log("Finished. Stats:", result.stats);
      break;
    }
    console.log("  next:", result.event?.id, result.event?.title);
  }

  await prisma.runHistory.deleteMany({ where: { runId: run.id } });
  await prisma.playerRun.delete({ where: { id: run.id } });
  console.log("Cleaned up dry-run run", run.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
