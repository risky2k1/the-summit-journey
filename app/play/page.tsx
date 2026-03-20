import Link from "next/link";

/** Placeholder — engine / run sẽ nối sau. */
export default function PlayPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <p className="text-center text-zinc-600 dark:text-zinc-400">
        Màn chơi sẽ mở từ đây.
      </p>
      <Link
        href="/"
        className="mt-8 text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
      >
        ← Về trang chủ
      </Link>
    </div>
  );
}
