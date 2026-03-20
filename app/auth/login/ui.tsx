"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none focus:border-amber-800/40 focus:ring-2 focus:ring-amber-800/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Mật khẩu
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none focus:border-amber-800/40 focus:ring-2 focus:ring-amber-800/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      {error ? (
        <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-amber-950/10 disabled:opacity-50 dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100"
      >
        {loading ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
        >
          Đăng ký
        </Link>
      </p>
      <Link
        href="/"
        className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        ← Về trang chủ
      </Link>
    </form>
  );
}
