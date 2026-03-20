import { RegisterForm } from "./ui";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Đăng ký
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Tạo tài khoản để lưu các lần chơi.
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}
