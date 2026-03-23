import { prisma } from "@/lib/db";

export type RunHistoryStepApi = {
  step: number;
  event: { id: number; title: string; type: string };
  choice: { id: number; content: string };
};

export async function getRunHistoryForApi(runId: number): Promise<RunHistoryStepApi[]> {
  const rows = await prisma.runHistory.findMany({
    where: { runId },
    orderBy: { id: "asc" },
    include: {
      event: { select: { id: true, title: true, type: true } },
      choice: { select: { id: true, content: true } },
    },
  });

  return rows.map((r, i) => ({
    step: i + 1,
    event: r.event,
    choice: r.choice,
  }));
}
