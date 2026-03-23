---
name: dashboard
description: "Skill for the Dashboard area of the-summit-journey. 5 symbols across 4 files."
---

# Dashboard

5 symbols | 4 files | Cohesion: 100%

## When to Use

- Working with code in `app/`
- Understanding how createSupabaseBrowserClient, SignOutButton, signOut work
- Modifying dashboard-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `app/dashboard/sign-out-button.tsx` | SignOutButton, signOut |
| `lib/supabase/client.ts` | createSupabaseBrowserClient |
| `app/auth/register/ui.tsx` | handleSubmit |
| `app/auth/login/ui.tsx` | handleSubmit |

## Entry Points

Start here when exploring this area:

- **`createSupabaseBrowserClient`** (Function) — `lib/supabase/client.ts:2`
- **`SignOutButton`** (Function) — `app/dashboard/sign-out-button.tsx:6`
- **`signOut`** (Function) — `app/dashboard/sign-out-button.tsx:10`
- **`handleSubmit`** (Function) — `app/auth/register/ui.tsx:77`
- **`handleSubmit`** (Function) — `app/auth/login/ui.tsx:17`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createSupabaseBrowserClient` | Function | `lib/supabase/client.ts` | 2 |
| `SignOutButton` | Function | `app/dashboard/sign-out-button.tsx` | 6 |
| `signOut` | Function | `app/dashboard/sign-out-button.tsx` | 10 |
| `handleSubmit` | Function | `app/auth/register/ui.tsx` | 77 |
| `handleSubmit` | Function | `app/auth/login/ui.tsx` | 17 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SignOutButton → CreateSupabaseBrowserClient` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "createSupabaseBrowserClient"})` — see callers and callees
2. `gitnexus_query({query: "dashboard"})` — find related execution flows
3. Read key files listed above for implementation details
