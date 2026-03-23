---
name: auth
description: "Skill for the Auth area of the-summit-journey. 4 symbols across 2 files."
---

# Auth

4 symbols | 2 files | Cohesion: 75%

## When to Use

- Working with code in `lib/`
- Understanding how middleware, isSuperAdminUser work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `middleware.ts` | isGameAdminPath, isProtectedPath, middleware |
| `lib/auth/super-admin.ts` | isSuperAdminUser |

## Entry Points

Start here when exploring this area:

- **`middleware`** (Function) — `middleware.ts:18`
- **`isSuperAdminUser`** (Function) — `lib/auth/super-admin.ts:8`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `middleware` | Function | `middleware.ts` | 18 |
| `isSuperAdminUser` | Function | `lib/auth/super-admin.ts` | 8 |
| `isGameAdminPath` | Function | `middleware.ts` | 8 |
| `isProtectedPath` | Function | `middleware.ts` | 12 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UpdateChoiceAction → IsSuperAdminUser` | cross_community | 3 |
| `UpdateEventAction → IsSuperAdminUser` | cross_community | 3 |
| `DeleteEvent → IsSuperAdminUser` | cross_community | 3 |
| `CreateChoice → IsSuperAdminUser` | cross_community | 3 |
| `DeleteChoice → IsSuperAdminUser` | cross_community | 3 |
| `CreateChoiceEffectAction → IsSuperAdminUser` | cross_community | 3 |
| `DeleteChoiceEffect → IsSuperAdminUser` | cross_community | 3 |
| `GameAdminLayout → IsSuperAdminUser` | cross_community | 3 |
| `CreateEvent → IsSuperAdminUser` | cross_community | 3 |

## How to Explore

1. `gitnexus_context({name: "middleware"})` — see callers and callees
2. `gitnexus_query({query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
