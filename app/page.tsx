import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,100,80,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,160,120,0.12),transparent)]"
      />
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
          Tu tiên · Text
        </p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Hành Trình
          <span className="mt-1 block text-3xl font-normal text-amber-800/90 dark:text-amber-200/90">
            Đỉnh Núi
          </span>
        </h1>
        <p className="mt-6 max-w-sm text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Một lần bước vào đạo, vạn kiếp tựa mây. Chọn lối của riêng ngươi.
        </p>

        <nav
          className="mt-14 w-full max-w-xs"
          aria-label="Menu chính"
        >
          <ul className="flex flex-col gap-3">
            <li>
              <Link
                href="/play"
                className="flex w-full items-center justify-center rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-6 py-3.5 text-base font-medium text-zinc-900 shadow-sm transition-[background-color,box-shadow,transform] hover:bg-amber-950/10 hover:shadow-md active:scale-[0.99] dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100 dark:hover:bg-amber-100/10"
              >
                Bắt đầu
              </Link>
            </li>
          </ul>
        </nav>
      </main>
    </div>
  );
}
