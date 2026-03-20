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
- stat (tu_vi, karma, luck, physical)
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
- user_id (UUID, Supabase `auth.users.id`; run sau khi đăng nhập)
- player_name (tên nhân vật, MVP)
- current_event_id
- stats (JSONB) — `tu_vi`, `karma`, `luck`, `physical`
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
- **Supabase:** Pooler `:6543` (PgBouncer) thường làm `prisma migrate` **treo** hoặc lỗi. Đặt `DIRECT_URL` trùng **connection non-pooling** (port **5432**, ví dụ `POSTGRES_URL_NON_POOLING` trong dashboard). Runtime Prisma dùng `DIRECT_URL` (fallback `DATABASE_URL`) trong `lib/db.ts` + `lib/postgres-url.ts` (`sslmode=no-verify` khi cần).
- **TLS / dev:** Nếu gặp `self-signed certificate in certificate chain` khi gọi API, `instrumentation.ts` bật `NODE_TLS_REJECT_UNAUTHORIZED=0` **chỉ khi `NODE_ENV=development`**. Production nên dùng CA đúng hoặc cấu hình SSL phù hợp.
- Migration khởi tạo: `prisma/migrations/20260320120000_init/`.
- **Chương mở (20 event đầu):** `prisma/migrations/20260320183000_physical_stat_and_seed_events/` — thêm enum `physical`, seed `events` id 1–20 (chuỗi bờ suối → cổng đỉnh), `choices` nối tuyến, `choice_effects` phân bổ tu_vi / karma / luck / physical, `event_tags` gợi ý (intro, moral_choice, bridge, …).
- Áp dụng DB: `pnpm db:migrate` (dev) hoặc `pnpm db:migrate:deploy` (CI/prod). Có thể áp DDL qua Supabase MCP `apply_migration` rồi `prisma migrate resolve --applied <tên_thư_mục>`.
- Client: `pnpm db:generate` → import từ `@/generated/prisma/client` (singleton gợi ý: `lib/db.ts` dùng `@prisma/adapter-pg` + `DATABASE_URL`).