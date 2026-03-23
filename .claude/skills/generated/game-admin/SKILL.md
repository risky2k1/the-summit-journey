---
name: game-admin
description: "Skill for the Game-admin area of the-summit-journey. 12 symbols across 3 files."
---

# Game-admin

12 symbols | 3 files | Cohesion: 56%

## When to Use

- Working with code in `app/`
- Understanding how updateEventAction, deleteEvent, updateChoiceAction work
- Modifying game-admin-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `app/game-admin/actions.ts` | parseId, parseOptionalInt, updateEventAction, deleteEvent, updateChoiceAction (+5) |
| `lib/auth/require-super-admin.ts` | requireSuperAdmin |
| `app/game-admin/layout.tsx` | GameAdminLayout |

## Entry Points

Start here when exploring this area:

- **`updateEventAction`** (Function) — `app/game-admin/actions.ts:45`
- **`deleteEvent`** (Function) — `app/game-admin/actions.ts:78`
- **`updateChoiceAction`** (Function) — `app/game-admin/actions.ts:102`
- **`deleteChoice`** (Function) — `app/game-admin/actions.ts:132`
- **`deleteChoiceEffect`** (Function) — `app/game-admin/actions.ts:174`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `updateEventAction` | Function | `app/game-admin/actions.ts` | 45 |
| `deleteEvent` | Function | `app/game-admin/actions.ts` | 78 |
| `updateChoiceAction` | Function | `app/game-admin/actions.ts` | 102 |
| `deleteChoice` | Function | `app/game-admin/actions.ts` | 132 |
| `deleteChoiceEffect` | Function | `app/game-admin/actions.ts` | 174 |
| `requireSuperAdmin` | Function | `lib/auth/require-super-admin.ts` | 4 |
| `createEvent` | Function | `app/game-admin/actions.ts` | 31 |
| `createChoice` | Function | `app/game-admin/actions.ts` | 87 |
| `createChoiceEffectAction` | Function | `app/game-admin/actions.ts` | 140 |
| `GameAdminLayout` | Function | `app/game-admin/layout.tsx` | 3 |
| `parseId` | Function | `app/game-admin/actions.ts` | 11 |
| `parseOptionalInt` | Function | `app/game-admin/actions.ts` | 22 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UpdateChoiceAction → CreateSupabaseServerClient` | cross_community | 3 |
| `UpdateChoiceAction → IsSuperAdminUser` | cross_community | 3 |
| `UpdateEventAction → CreateSupabaseServerClient` | cross_community | 3 |
| `UpdateEventAction → IsSuperAdminUser` | cross_community | 3 |
| `DeleteEvent → CreateSupabaseServerClient` | cross_community | 3 |
| `DeleteEvent → IsSuperAdminUser` | cross_community | 3 |
| `CreateChoice → CreateSupabaseServerClient` | cross_community | 3 |
| `CreateChoice → IsSuperAdminUser` | cross_community | 3 |
| `DeleteChoice → CreateSupabaseServerClient` | cross_community | 3 |
| `DeleteChoice → IsSuperAdminUser` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Game | 1 calls |
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "updateEventAction"})` — see callers and callees
2. `gitnexus_query({query: "game-admin"})` — find related execution flows
3. Read key files listed above for implementation details
