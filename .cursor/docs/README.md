# Tài liệu dự án (memo)

| File | Nội dung |
|------|----------|
| [overview.md](./overview.md) | Mục tiêu, core loop, features, stack |
| [rules.md](./rules.md) | Nguyên tắc: không hardcode, event từ DB/AI, logic không ở frontend |
| [game-engine.md](./game-engine.md) | `handleChoice`, `findNextEvent` |
| [event-schema.md](./event-schema.md) | JSON event/choice cho AI và validation |
| [story-authoring-prompt.md](./story-authoring-prompt.md) | **Prompt + JSON mẫu** nhờ AI viết cốt; có **block copy n8n** (50 chương, nhánh, ending) |
| [database.md](./database.md) | Bảng, JSONB, tag/condition |
| [api-spec.md](./api-spec.md) | Endpoints và shape request/response |
| [ai-generation.md](./ai-generation.md) | Khi gọi AI, input, prompt, validation, **OpenRouter** |
| [roadmap.md](./roadmap.md) | Phase MVP → polish |

**Luồng đề xuất khi làm feature mới:** `overview` → `rules` → phần liên quan (`game-engine` / `api-spec` / `database` / `event-schema`).
