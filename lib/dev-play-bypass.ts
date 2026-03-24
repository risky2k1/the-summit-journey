/**
 * Chỉ để test local khi đã tắt middleware `/play` nhưng chưa đăng nhập.
 * Bật: `PLAY_DEV_BYPASS_AUTH=1` trong `.env` + `pnpm dev` (NODE_ENV=development).
 * Tắt trước khi deploy; không dùng trên production.
 */
/** Trùng `scripts/dry-run-game.ts` — mọi run bypass gắn cùng user ảo. */
export const PLAY_DEV_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000001";

export function resolvePlayApiUserId(loggedInUserId: string | undefined): string | null {
  if (loggedInUserId) return loggedInUserId;
  if (process.env.NODE_ENV !== "development") return null;
  const v = process.env.PLAY_DEV_BYPASS_AUTH?.trim();
  if (v === "1" || v === "true") {
    return PLAY_DEV_BYPASS_USER_ID;
  }
  return null;
}
