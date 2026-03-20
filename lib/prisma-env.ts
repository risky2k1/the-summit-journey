import { postgresUrlWithDevTls } from "@/lib/postgres-url";

/**
 * Engine Prisma (query plan) vẫn đọc `DATABASE_URL`; phải trùng chuẩn TLS với `lib/db.ts`.
 * Import file này trước `PrismaClient` / `prisma`.
 */
const url = postgresUrlWithDevTls(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);
if (url) {
  process.env.DATABASE_URL = url;
}
