import "@/lib/prisma-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { postgresUrlWithDevTls } from "@/lib/postgres-url";

/**
 * Supabase pooler (:6543) hay lỗi; ưu tiên `DIRECT_URL` (:5432).
 * URL qua `postgresUrlWithDevTls` (sslmode=no-verify); engine TLS dev: `instrumentation.ts`.
 */
const connectionString = postgresUrlWithDevTls(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);

if (!connectionString) {
  throw new Error("Set DIRECT_URL or DATABASE_URL for Prisma");
}

const adapter = new PrismaPg({ connectionString });

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Production: singleton. Dev: new client per process reload — tránh giữ PrismaClient cũ sau `prisma generate` (cần restart `next dev` nếu chỉ generate mà không reload module). */
export const prisma =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ??= createPrismaClient())
    : createPrismaClient();
