# API Specification

## POST /api/run/start

Tạo run mới (đặt tên → random stats → lưu DB).

Body:
{
  "name": "string"
}

Response:
{
  "run_id": number,
  "player_name": "string",
  "stats": { "tu_vi": number, "karma": number, "luck": number },
  "event": {}
}

---

## POST /api/run/choice

Body:
{
  "run_id": number,
  "choice_id": number
}

Response:
{
  "event": {},
  "stats": {}
}

---

## GET /api/event/:id

Lấy event + choices

---

## POST /api/ai/generate-event

Body:
{
  "player_state": {},
  "tags": []
}

Response:
Event JSON