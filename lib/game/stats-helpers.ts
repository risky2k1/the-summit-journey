import type { ChoiceCondition, ChoiceEffect, PlayerStat } from "@/generated/prisma/client";
import type { PlayerStats } from "@/lib/game/player-stats";

export function parsePlayerStats(raw: unknown): PlayerStats {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid stats payload");
  }
  const o = raw as Record<string, unknown>;
  const num = (key: keyof PlayerStats) => {
    const v = o[key];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`Invalid stat: ${key}`);
    }
    return Math.trunc(v);
  };
  return {
    tu_vi: num("tu_vi"),
    karma: num("karma"),
    luck: num("luck"),
    physical: num("physical"),
  };
}

function statValue(stats: PlayerStats, stat: PlayerStat): number {
  return stats[stat];
}

export function applyChoiceEffects(stats: PlayerStats, effects: ChoiceEffect[]): PlayerStats {
  const next: PlayerStats = { ...stats };
  for (const e of effects) {
    next[e.stat] = next[e.stat] + e.value;
  }
  return next;
}

export function passConditions(stats: PlayerStats, conditions: ChoiceCondition[]): boolean {
  for (const c of conditions) {
    const v = statValue(stats, c.stat);
    const t = c.value;
    switch (c.operator) {
      case ">":
        if (!(v > t)) return false;
        break;
      case "<":
        if (!(v < t)) return false;
        break;
      case "=":
        if (v !== t) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}
