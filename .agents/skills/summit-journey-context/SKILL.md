---
name: summit-journey-context
description: >-
  Game text-based tu tiên (The Summit Journey): spec trong .cursor/docs, engine
  server-side, event từ DB hoặc AI. Dùng khi implement run/choice/event, Prisma,
  API, hoặc AI generation — để đồng bộ với memo và tránh hardcode story.
---

# Summit Journey — context

Trước khi sửa logic game hoặc schema:

1. Đọc `.cursor/docs/README.md` (index) rồi file liên quan (`game-engine.md`, `event-schema.md`, `database.md`, `api-spec.md`, `ai-generation.md`).
2. Tuân `.cursor/rules/summit-journey-core.mdc`: không hardcode event trong UI; engine ở server/API/lib.
3. React/Next: skill `vercel-react-best-practices` cho performance; UI không chứa business rules của game.

Khi thêm Prisma: schema khớp `database.md`. Khi thêm `app/api`: khớp `api-spec.md`.

Generative (OpenRouter): `ai-generation.md` + `.cursor/rules/summit-journey-openrouter.mdc` — key chỉ server, code gọi model trong `lib/ai/`.
