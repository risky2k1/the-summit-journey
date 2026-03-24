# AI Event Generation

Viết cốt batch / prompt chi tiết cho AI khác: **`story-authoring-prompt.md`** (JSON nhiều màn + `next_event_ref`, giải thích `weight` vs `pick_weight`).

## Khi nào gọi AI

- Khi không tìm đủ event trong DB
- Khi muốn event đặc biệt

## Input

{
  "player_state": {
    "tu_vi": number,
    "karma": number,
    "luck": number,
    "physical": number
  },
  "recent_events": [],
  "tags_needed": [],
  "power_level": "early | mid | late"
}

## Prompt Template

Bạn là người viết kịch bản game tu tiên.

Yêu cầu:
- Viết event phù hợp trạng thái người chơi
- Tone phù hợp (ma đạo / chính đạo)
- Không phá logic
- Không reward quá lớn

Output JSON đúng schema.

## Validation

- Check schema
- Check stat range
- Check tag hợp lệ
- Nếu fail → regenerate

---

## OpenRouter (generative)

Dự án dùng **OpenRouter** làm backend gọi model (API tương thích OpenAI).

### Biến môi trường (`.env` — không commit secret)

| Biến | Vai trò |
|------|---------|
| `OPEN_ROUTER_API_KEY` | Bearer key; **chỉ đọc trên server** (Route Handler / Server Action / `lib/ai/*`). Không dùng `NEXT_PUBLIC_*`. |
| `OPEN_ROUTER_API_URL` | Base URL, mặc định `https://openrouter.ai/api/v1` (chat/completions). |
| `OPEN_ROUTER_DEFAULT_MODEL` | Model mặc định (ví dụ slug trên OpenRouter). Có thể override theo từng request nếu cần. |

### Cách gọi (nguyên tắc)

- Gọi HTTP từ **server** tới `{OPEN_ROUTER_API_URL}/chat/completions` (hoặc endpoint tương ứng docs OpenRouter), header `Authorization: Bearer <OPEN_ROUTER_API_KEY>`, body JSON theo OpenAI chat format; **yêu cầu output JSON** (response_format / prompt ép JSON) rồi parse + validate theo `event-schema.md`.
- Không gọi OpenRouter trực tiếp từ component client; UI chỉ gọi API nội bộ (ví dụ `POST /api/ai/generate-event`).
- Log / lỗi: không in full response chứa nội dung nhạy cảm ra client; không trả key ra JSON response.

### Đổi model

- Ưu tiên đổi `OPEN_ROUTER_DEFAULT_MODEL` hoặc tham số server; cập nhật memo nếu model mặc định thay đổi lâu dài.

### Nhận xét nhân vật mới

- Sau `POST /api/run/start` (đã lưu run), server gọi OpenRouter qua `lib/ai/character-commentary.ts` + `lib/ai/openrouter.ts`; response có `character_commentary` hoặc `null` nếu thiếu env / lỗi gọi model.