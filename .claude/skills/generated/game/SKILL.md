---
name: game
description: "Skill for the Game area of the-summit-journey. 7 symbols across 4 files."
---

# Game

7 symbols | 4 files | Cohesion: 86%

## When to Use

- Working with code in `app/`
- Understanding how createSupabaseServerClient, rollInitialStats, newRunSeed work
- Modifying game-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `lib/game/player-stats.ts` | rollInitialStats, newRunSeed |
| `app/dashboard/page.tsx` | statsPreview, DashboardPage |
| `app/api/run/start/route.ts` | normalizeName, POST |
| `lib/supabase/server.ts` | createSupabaseServerClient |

## Entry Points

Start here when exploring this area:

- **`createSupabaseServerClient`** (Function) — `lib/supabase/server.ts:3`
- **`rollInitialStats`** (Function) — `lib/game/player-stats.ts:10`
- **`newRunSeed`** (Function) — `lib/game/player-stats.ts:19`
- **`DashboardPage`** (Function) — `app/dashboard/page.tsx:16`
- **`POST`** (Function) — `app/api/run/start/route.ts:17`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createSupabaseServerClient` | Function | `lib/supabase/server.ts` | 3 |
| `rollInitialStats` | Function | `lib/game/player-stats.ts` | 10 |
| `newRunSeed` | Function | `lib/game/player-stats.ts` | 19 |
| `DashboardPage` | Function | `app/dashboard/page.tsx` | 16 |
| `POST` | Function | `app/api/run/start/route.ts` | 17 |
| `statsPreview` | Function | `app/dashboard/page.tsx` | 8 |
| `normalizeName` | Function | `app/api/run/start/route.ts` | 10 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UpdateChoiceAction → CreateSupabaseServerClient` | cross_community | 3 |
| `UpdateEventAction → CreateSupabaseServerClient` | cross_community | 3 |
| `DeleteEvent → CreateSupabaseServerClient` | cross_community | 3 |
| `CreateChoice → CreateSupabaseServerClient` | cross_community | 3 |
| `DeleteChoice → CreateSupabaseServerClient` | cross_community | 3 |
| `CreateChoiceEffectAction → CreateSupabaseServerClient` | cross_community | 3 |
| `DeleteChoiceEffect → CreateSupabaseServerClient` | cross_community | 3 |
| `GameAdminLayout → CreateSupabaseServerClient` | cross_community | 3 |
| `CreateEvent → CreateSupabaseServerClient` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createSupabaseServerClient"})` — see callers and callees
2. `gitnexus_query({query: "game"})` — find related execution flows
3. Read key files listed above for implementation details
