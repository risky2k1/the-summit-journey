# Game Tu Tiên - Overview

## Mục tiêu
Xây dựng một game text-based tu tiên với cơ chế lựa chọn (choice-based).
Người chơi sẽ đi qua các event và mỗi lựa chọn sẽ ảnh hưởng đến chỉ số và hướng phát triển.

## Core Loop
1. Player vào event
2. Chọn 1 trong các choices
3. Apply effects
4. Chuyển sang event tiếp theo
5. Lặp lại

## Key Features
- Random stats ban đầu (tu_vi, karma, luck, physical)
- Branching story
- Tag-based event system
- Có thể mở rộng bằng AI để generate event

## Tech Stack
- Next.js (App Router)
- PostgreSQL
- Prisma ORM