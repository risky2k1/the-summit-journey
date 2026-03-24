# Database Design
## Use Supabase
## Tables

### campaigns
- id
- slug (unique, MVP: `main`)
- total_chapters, total_events — snapshot từ nguồn seed (ví dụ `.n8n/result.json`)
- start_event_ref — khớp `events.ref` của màn mở đầu; `POST /api/run/start` dùng để gán `current_event_id`

### chapters
- id
- campaign_id
- chapter_index (unique theo campaign)
- title, summary_one_line

### events
- id
- ref (unique, nullable) — slug ổn định từ biên kịch / n8n (`c01_mo_dau`, …); seed map `choices.next_event_ref` → `next_event_id`
- chapter_id (nullable) — gắn event vào chương trong campaign
- title
- description
- type (normal, encounter, ending)
- is_active
- pick_weight (int ≥ 1, mặc định 1) — trọng số khi engine chọn event **ngẫu nhiên** (`findNextEventId`). Không ảnh hưởng thứ tự màn khi `choices.next_event_id` đã gán.

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

### Super admin (`/game-admin`)

- Trong Supabase: **Authentication → Users → [user] → App metadata** (JSON): `{ "is_super_admin": true }`.
- Chỉ **App metadata** (không dùng User metadata cho cờ này) — client không tự gắn quyền admin.
- Route `/game-admin` yêu cầu đăng nhập + `is_super_admin`; user thường bị chuyển về `/dashboard`.

## Prisma & migration

- Schema: `prisma/schema.prisma` — enum `EventType`, `PlayerStat`; bảng map snake_case như memo.
- Config Prisma 7: `prisma.config.ts` — URL cho **migrate/introspect** lấy `DIRECT_URL` (nếu có), không thì `DATABASE_URL`.
- **Supabase:** Pooler `:6543` (PgBouncer) thường làm `prisma migrate` **treo** hoặc lỗi. Đặt `DIRECT_URL` trùng **connection non-pooling** (port **5432**, ví dụ `POSTGRES_URL_NON_POOLING` trong dashboard). Runtime Prisma dùng `DIRECT_URL` (fallback `DATABASE_URL`) trong `lib/db.ts` + `lib/postgres-url.ts` (`sslmode=no-verify` khi cần).
- **TLS / dev:** Nếu gặp `self-signed certificate in certificate chain` khi gọi API, `instrumentation.ts` bật `NODE_TLS_REJECT_UNAUTHORIZED=0` **chỉ khi `NODE_ENV=development`**. Production nên dùng CA đúng hoặc cấu hình SSL phù hợp.
- Migration khởi tạo: `prisma/migrations/20260320120000_init/`.
- **Enum `physical`:** `prisma/migrations/20260320183000_physical_stat_and_seed_events/` — chỉ `ALTER TYPE ... ADD VALUE` (tách transaction vì PostgreSQL).
- **Chương mở (20 event đầu):** `prisma/migrations/20260320183100_seed_early_events/` — seed `events` id 1–20, `choices`, `choice_effects`, `event_tags`.
- **Nhánh demo + pick_weight + tag karma:** `prisma/migrations/20260323140000_event_pick_weight_fork_and_karma_tags/` — cột `pick_weight`, sửa `choices.id=4` (fork), vài `pick_weight` & tag `ma_dao`/`chinh_dao`.
- **Campaign / chapter / `events.ref`:** `prisma/migrations/20260324180000_campaign_chapters_event_ref/` — bảng `campaigns`, `chapters`; cột `events.ref`, `events.chapter_id`. Nội dung full campaign: `pnpm db:seed` (đọc `.n8n/result.json`, xóa story cũ + reset sequence).
- Áp dụng DB: `pnpm db:migrate` (dev) hoặc `pnpm db:migrate:deploy` (CI/prod). Có thể áp DDL qua Supabase MCP `apply_migration` rồi `prisma migrate resolve --applied <tên_thư_mục>`.
- Client: `pnpm db:generate` → import từ `@/generated/prisma/client` (singleton gợi ý: `lib/db.ts` dùng `@prisma/adapter-pg` + `DATABASE_URL`).