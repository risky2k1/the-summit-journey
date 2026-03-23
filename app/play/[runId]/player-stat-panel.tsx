"use client";

import type { PlayerStats } from "@/lib/game/player-stats";
import { karmaArcLabel, labelForStat } from "@/lib/game/stat-copy";

/** Gần đúng biên random ban đầu (`rollInitialStats`) — để vạch tương đối. */
const RANGES: Record<keyof PlayerStats, [number, number]> = {
  tu_vi: [12, 50],
  karma: [-35, 35],
  luck: [8, 50],
  physical: [18, 50],
};

function pct(v: number, [min, max]: [number, number]): number {
  if (max <= min) return 50;
  return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
}

export function PlayerStatPanel({
  stats,
  pulse,
}: {
  stats: PlayerStats;
  /** Delta vừa áp dụng (gộp theo stat) — highlight ô tương ứng. */
  pulse?: Partial<Record<keyof PlayerStats, number>>;
}) {
  const keys: { key: keyof PlayerStats; label: string; hint?: string }[] = [
    { key: "tu_vi", label: "Tu vi" },
    { key: "karma", label: "Karma", hint: karmaArcLabel(stats.karma) },
    { key: "luck", label: "Luck" },
    { key: "physical", label: "Thể lực" },
  ];

  return (
    <section className="rounded-xl border border-amber-900/20 bg-gradient-to-b from-amber-950/[0.07] to-transparent px-3 py-4 dark:border-amber-200/12 dark:from-amber-100/[0.06]">
      <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Căn cốt
        </h2>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Ảnh hưởng lựa chọn &amp; nhánh karma
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {keys.map(({ key, label, hint }) => {
          const v = stats[key];
          const range = RANGES[key];
          const w = pct(v, range);
          const d = pulse?.[key];
          const showPulse = d != null && d !== 0;
          return (
            <div
              key={key}
              className={`rounded-lg border px-2.5 py-2 transition-colors ${
                showPulse
                  ? "border-amber-600/45 bg-amber-100/50 shadow-[0_0_0_1px_rgba(217,119,6,0.25)] dark:border-amber-400/35 dark:bg-amber-950/50"
                  : "border-amber-900/15 bg-white/50 dark:border-amber-200/10 dark:bg-zinc-950/35"
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <dt className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</dt>
                {showPulse ? (
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      d > 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {d > 0 ? "+" : ""}
                    {d}
                  </span>
                ) : null}
              </div>
              <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {v}
              </dd>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-700/90 to-amber-500/90 dark:from-amber-400/90 dark:to-amber-200/80"
                  style={{ width: `${w}%` }}
                />
              </div>
              {hint && key === "karma" ? (
                <p className="mt-1.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                  Nhánh: <span className="font-medium text-zinc-700 dark:text-zinc-300">{hint}</span>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Một dòng tóm tắt chỉ số thay đổi (banner). */
export function formatEffectsLine(effects: { stat: string; delta: number }[]): string {
  if (effects.length === 0) return "Không đổi chỉ số.";
  return effects
    .map((e) => {
      const sign = e.delta > 0 ? "+" : "";
      return `${labelForStat(e.stat)} ${sign}${e.delta}`;
    })
    .join(" · ");
}
