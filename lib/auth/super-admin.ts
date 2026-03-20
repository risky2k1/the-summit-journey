import type { User } from "@supabase/supabase-js";

/**
 * Quyền super admin: `app.is_super_admin === true` trong JWT.
 * Đặt trong Supabase Dashboard → Authentication → Users → user → App metadata:
 * `{ "is_super_admin": true }`
 * (Không dùng `user_metadata` cho cờ này — client có thể tự sửa.)
 */
export function isSuperAdminUser(user: User | null): boolean {
  if (!user) return false;
  return user.app_metadata?.is_super_admin === true;
}
