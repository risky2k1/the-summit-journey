/**
 * Chuẩn hóa URL Postgres cho Supabase + Node (Prisma engine + `pg`).
 * Tránh `self-signed certificate in certificate chain` khi verify CA không khớp môi trường.
 */
export function postgresUrlWithDevTls(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw.replace(/^postgres:/i, "http:"));
    u.searchParams.set("sslmode", "no-verify");
    return u.toString().replace(/^http:/i, "postgres:");
  } catch {
    const sep = raw.includes("?") ? "&" : "?";
    return `${raw}${sep}sslmode=no-verify`;
  }
}
