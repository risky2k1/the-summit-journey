"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!password) return { score: 0, label: "—" };
  if (password.length < 6) {
    return { score: 1, label: "Quá ngắn" };
  }

  const typeCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const len = password.length;
  let score: 1 | 2 | 3 | 4 = 1;
  let label = "Yếu";

  if (len >= 8 && typeCount >= 2) {
    score = 2;
    label = "Trung bình";
  }
  if (len >= 10 && typeCount >= 3) {
    score = 3;
    label = "Khá mạnh";
  }
  if (len >= 12 && typeCount >= 3) {
    score = 4;
    label = "Mạnh";
  }
  if (len >= 12 && typeCount >= 4) {
    score = 4;
    label = "Rất mạnh";
  }

  return { score, label };
}

function EyeIcon({ off }: { off?: boolean }) {
  if (off) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Hai lần nhập mật khẩu không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const strengthColors = [
    "bg-zinc-200 dark:bg-zinc-700",
    "bg-red-500/80",
    "bg-amber-500/80",
    "bg-lime-500/80",
    "bg-emerald-500/90",
  ];

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="reg-email"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="reg-email"
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
          htmlFor="reg-password"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Mật khẩu (tối thiểu 6 ký tự)
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPasswords ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pr-11 pl-3 text-zinc-900 shadow-sm outline-none focus:border-amber-800/40 focus:ring-2 focus:ring-amber-800/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={() => setShowPasswords((s) => !s)}
            className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center rounded p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <EyeIcon off={showPasswords} />
          </button>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1" role="meter" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={4} aria-label={`Độ mạnh mật khẩu: ${strength.label}`}>
            {[1, 2, 3, 4].map((seg) => (
              <div
                key={seg}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  strength.score >= seg
                    ? strengthColors[strength.score]
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Độ mạnh: <span className="font-medium text-zinc-700 dark:text-zinc-300">{strength.label}</span>
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="reg-password-confirm"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nhập lại mật khẩu
        </label>
        <div className="relative">
          <input
            id="reg-password-confirm"
            type={showPasswords ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pr-11 pl-3 text-zinc-900 shadow-sm outline-none focus:border-amber-800/40 focus:ring-2 focus:ring-amber-800/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={() => setShowPasswords((s) => !s)}
            className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center rounded p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <EyeIcon off={showPasswords} />
          </button>
        </div>
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
        {loading ? "Đang tạo tài khoản…" : "Đăng ký"}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Đã có tài khoản?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200/90"
        >
          Đăng nhập
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
