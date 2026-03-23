type JourneyStep = {
  step: number;
  event: { id: number; title: string; type: string };
  choice: { id: number; content: string };
};

export function RunJourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm leading-relaxed text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
        Chưa có nhật ký lựa chọn — có thể là run tạo trước khi hệ thống ghi lịch sử.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Đường dọc nối các bước — giống sơ đồ timeline */}
      <div
        aria-hidden
        className="absolute bottom-6 left-[15px] top-4 w-px bg-gradient-to-b from-amber-800/35 via-amber-700/20 to-transparent dark:from-amber-200/30 dark:via-amber-200/15"
      />
      <ol className="relative space-y-8">
        {steps.map((s, i) => (
          <li key={`${s.step}-${s.event.id}-${s.choice.id}`} className="relative flex gap-4">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-amber-800/45 bg-zinc-50 text-xs font-bold tabular-nums text-amber-950 shadow-sm dark:border-amber-200/35 dark:bg-zinc-900 dark:text-amber-100">
              {s.step}
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-amber-900/20 bg-white/70 px-4 py-3 shadow-sm dark:border-amber-200/10 dark:bg-zinc-950/60">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-amber-950/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-100/10 dark:text-amber-100/90">
                  {s.event.type}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">#{s.event.id}</span>
              </div>
              <h3 className="mt-1.5 font-serif text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {s.event.title}
              </h3>
              <p className="mt-3 border-l-2 border-amber-700/35 pl-3 text-sm leading-relaxed text-zinc-700 dark:border-amber-200/25 dark:text-zinc-300">
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  Lựa chọn
                </span>
                {s.choice.content}
              </p>
            </div>
            {i < steps.length - 1 ? (
              <span className="sr-only">rồi tới</span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {steps.length} bước — đọc từ dưới suối lên đỉnh (theo thứ tự đã chơi).
      </p>
    </div>
  );
}
