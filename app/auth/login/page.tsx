import { Suspense } from "react";
import { LoginForm } from "./ui";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Đăng nhập
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Tiếp tục hành trình tu tiên của ngươi.
        </p>
        <Suspense fallback={<p className="mt-8 text-center text-sm text-zinc-500">Đang tải…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
