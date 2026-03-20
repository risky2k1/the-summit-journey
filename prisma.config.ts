import "dotenv/config";
import { defineConfig } from "prisma/config";
import { postgresUrlWithDevTls } from "./lib/postgres-url";

/**
 * Supabase: pooler :6543 hay treo migrate; dùng `DIRECT_URL` (:5432).
 * URL phải cùng chuẩn TLS với `lib/db.ts` — engine Prisma cũng đọc URL này.
 */
const migrateDatasourceUrl = postgresUrlWithDevTls(
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateDatasourceUrl,
  },
});
