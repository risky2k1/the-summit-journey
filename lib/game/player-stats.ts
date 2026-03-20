/** Stats nhân vật lưu trong `player_runs.stats` (JSON). */
export type PlayerStats = {
  tu_vi: number;
  karma: number;
  luck: number;
};

/** Random chỉ số ban đầu — có thể cân bằng sau. */
export function rollInitialStats(): PlayerStats {
  return {
    tu_vi: 12 + Math.floor(Math.random() * 39),
    karma: -35 + Math.floor(Math.random() * 71),
    luck: 8 + Math.floor(Math.random() * 43),
  };
}

export function newRunSeed(): string {
  return crypto.randomUUID();
}
