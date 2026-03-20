# AI Event Generation

## Khi nào gọi AI

- Khi không tìm đủ event trong DB
- Khi muốn event đặc biệt

## Input

{
  "player_state": {
    "tu_vi": number,
    "karma": number,
    "luck": number
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