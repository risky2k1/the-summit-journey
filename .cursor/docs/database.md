# Database Design
## Use Supabase
## Tables

### events
- id
- title
- description
- type (normal, encounter, ending)
- is_active

### choices
- id
- event_id
- content
- next_event_id (nullable)
- weight

### choice_effects
- id
- choice_id
- stat (tu_vi, karma, luck)
- value (int)

### choice_conditions
- id
- choice_id
- stat
- operator (>, <, =) — trong DB: `VARCHAR(2)` (Prisma: `String`), giá trị lưu dạng ký tự so sánh
- value

### event_tags
- id
- event_id
- tag

### player_runs
- id
- current_event_id
- stats (JSONB)
- seed

### run_history
- id
- run_id
- event_id
- choice_id

## Notes
- stats lưu dạng JSONB
- không hardcode flow → dùng tag + condition

## Prisma & migration

- Schema: `prisma/schema.prisma` — enum `EventType`, `PlayerStat`; bảng map snake_case như memo.
- Config Prisma 7: `prisma.config.ts` — URL cho **migrate/introspect** lấy `DIRECT_URL` (nếu có), không thì `DATABASE_URL`.
- **Supabase:** Pooler `:6543` (PgBouncer) thường làm `prisma migrate` **treo** hoặc lỗi. Đặt `DIRECT_URL` trùng **connection non-pooling** (port **5432**, ví dụ `POSTGRES_URL_NON_POOLING` trong dashboard). App/runtime vẫn dùng `DATABASE_URL` pooler trong `lib/db.ts`.
- Migration khởi tạo: `prisma/migrations/20260320120000_init/`.
- Áp dụng DB: `pnpm db:migrate` (dev) hoặc `pnpm db:migrate:deploy` (CI/prod). Có thể áp DDL qua Supabase MCP `apply_migration` rồi `prisma migrate resolve --applied <tên_thư_mục>`.
- Client: `pnpm db:generate` → import từ `@/generated/prisma/client` (singleton gợi ý: `lib/db.ts` dùng `@prisma/adapter-pg` + `DATABASE_URL`).