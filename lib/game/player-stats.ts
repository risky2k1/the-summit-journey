/** Stats nhân vật lưu trong `player_runs.stats` (JSON). */
export type PlayerStats = {
  tu_vi: number;
  karma: number;
  luck: number;
  /** Thể lực — gánh chịu gian khổ, leo núi, độc, sét. */
  physical: number;
};

function rollInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Random chỉ số mở đầu — thấp để còn chỗ tăng qua ~50 chương. */
export function rollInitialStats(): PlayerStats {
  return {
    tu_vi: rollInt(2, 8),
    karma: rollInt(-6, 6),
    luck: rollInt(2, 8),
    physical: rollInt(3, 10),
  };
}

export function newRunSeed(): string {
  return crypto.randomUUID();
}
