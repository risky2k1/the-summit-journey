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
  "finished": boolean
}

`finished === true` khi không còn sự kiện kế (ví dụ ending, hoặc `next_event_id` trống tại ending).

---

## GET /api/run/:runId

Session Supabase. Trả run của user: `run_id`, `player_name`, `stats`, `current_event_id`, `event` (payload đầy đủ hoặc `null` nếu đã kết thúc / chưa gán).

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