/** Hiển thị UI — khớp enum `PlayerStat` / JSON stats. */
export const STAT_LABEL_VI: Record<string, string> = {
  tu_vi: "Tu vi",
  karma: "Karma",
  luck: "Luck",
  physical: "Thể lực",
};

export function labelForStat(stat: string): string {
  return STAT_LABEL_VI[stat] ?? stat;
}

/** Theo `.cursor/docs/game-engine.md` (findNextEvent / tag karma). */
export function karmaArcLabel(karma: number): string {
  if (karma < -20) return "Ma đạo";
  if (karma > 20) return "Chính đạo";
  return "Trung lập";
}

export function formatConditionLine(c: {
  stat: string;
  operator: string;
  value: number;
}): string {
  const name = labelForStat(c.stat);
  return `${name} ${c.operator} ${c.value}`;
}
