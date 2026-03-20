import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Supabase: pooler :6543 (DATABASE_URL) hay bị treo với `prisma migrate`.
 * Migrate / introspection phải dùng Postgres trực tiếp :5432 → đặt `DIRECT_URL` (= POSTGRES_URL_NON_POOLING).
 */
const migrateDatasourceUrl =
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateDatasourceUrl,
  },
});
