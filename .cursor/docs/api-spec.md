# API Specification

## POST /api/run/start

Tạo run mới (đặt tên → random stats → lưu DB). **Yêu cầu session Supabase** (cookie).

Body:
{
  "name": "string"
}

Response:
{
  "run_id": number,
  "player_name": "string",
  "stats": { "tu_vi": number, "karma": number, "luck": number, "physical": number },
  "event": { }
}

`event` là payload sự kiện hiện tại (id, title, description, type, tags, choices kèm effects/conditions) — khớp `GET /api/event/:id`.

---

## POST /api/run/:runId/character-commentary

Sinh (hoặc trả cache) **lời thiên cơ** — OpenRouter từ tên + stats của run. **Yêu cầu đăng nhập**; run phải thuộc user.

Response:
{
  "character_commentary": string | null
}

`null` nếu thiếu `OPEN_ROUTER_*` hoặc gọi model thất bại. Lần gọi thành công có text thì lưu `player_runs.character_commentary` (cache).

---

## POST /api/run/choice

Body:
{
  "run_id": number,
  "choice_id": number
}

Response:
{
  "event": {} | null,
  "stats": {},
  "finished": boolean,
  "applied_effects": [ { "stat": "physical", "delta": 2 } ],
  "resolved_next_event_id": number | null
}

`applied_effects` — từng dòng `choice_effects` đã áp; `resolved_next_event_id` là màn thực tế (có thể khác `choices.next_event_id` khi random).

`finished === true` khi không còn sự kiện kế (ví dụ ending, hoặc `next_event_id` trống tại ending).

---

## GET /api/run/:runId

Session Supabase. Trả run của user: `run_id`, `player_name`, `stats`, `current_event_id`, `event` (payload đầy đủ hoặc `null` nếu đã kết thúc / chưa gán), `history` (mảng các bước đã chơi: `step`, `event` { id, title, type }, `choice` { id, content } — từ `run_history`, thứ tự thời gian).

---

## GET /api/event/:id

Lấy event + choices (public; chỉ nội dung đang `is_active`).

---

## POST /api/ai/generate-event

Body:
{
  "player_state": {},
  "tags": []
}

Response:
Event JSON