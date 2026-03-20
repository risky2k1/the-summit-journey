/**
 * Dev: Prisma query engine + Supabase TLS đôi khi lỗi `self-signed certificate in certificate chain`
 * trên một số máy (CA hệ thống / proxy). Chỉ tắt verify TLS trong development.
 * Production: dùng CA đúng hoặc `sslmode` phù hợp — không bật nhánh này.
 */
export function register() {
  if (process.env.NODE_ENV === "development") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}
