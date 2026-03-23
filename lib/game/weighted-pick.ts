/**
 * Chọn một `id` trong danh sách theo trọng số (dùng cho `findNextEventId`).
 * `pickWeight` <= 0 được coi như 1.
 */
export function pickWeightedById(
  items: readonly { id: number; pickWeight: number }[],
): number | null {
  if (items.length === 0) return null;
  const weights = items.map((x) => Math.max(1, x.pickWeight));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!.id;
  }
  return items[items.length - 1]!.id;
}
