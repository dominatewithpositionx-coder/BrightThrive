# BrightThrive — Agent Context

This file gives Claude Code agents the project context they need to work effectively. Read this before making any product, UI, database, or copy change.

---

## Product Summary

BrightThrive is a family app where children earn screen time (iPad time) by completing real-world missions. Parents set up a Family Growth Profile, an AI generates personalised daily missions for each child, and children complete them in Kid Mode to earn BrytCoins and screen-time minutes.

**Core loop:**
1. Parent completes Family Growth Profile (onboarding)
2. AI generates age-appropriate, personalised missions per child
3. Child opens Kid Mode → selects profile → picks mood → completes missions
4. Each mission earns BrytCoins + screen-time minutes
5. Parent sees progress on dashboard → approves earned screen time
6. Child gets iPad time as reward

**NOT:** a screen blocker, a parental control app, a chore app, or a homework tracker.

---

## App Architecture

**Stack:**
- Next.js 14 App Router — `nodejs` runtime on all API routes
- TypeScript (strict)
- Supabase (Postgres + Auth + RLS + Storage)
- Tailwind CSS v3
- Framer Motion (rewards page + child picker)
- Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic SDK
- Vercel (hosting + functions)
- Resend (email, partially configured)
- wttr.in (weather, cached in DB)

---

## Key Routes

### Public / Auth
| Route | Purpose |
|---|---|
| `/` | Landing page (PositionX narrative) |
| `/login` | Supabase auth (email + password) |
| `/onboarding` | Family Growth Profile setup |
| `/reset`, `/reset/update` | Password reset flow |
| `/waitlist` | Early access waitlist |
| `/child` | Kid Mode — child-facing, NO Supabase auth |

### Parent Dashboard (auth required)
| Route | Purpose |
|---|---|
| `/dashboard` | Main hub: missions, per-child cards, quick actions |
| `/dashboard/children` | Add/edit children (name, age, location) |
| `/dashboard/rewards` | Set BrytCoin-redeemable rewards |
| `/dashboard/settings` | Family location, notification preferences |
| `/dashboard/analytics` | Weekly mission insights |
| `/dashboard/history` | Mission completion history |
| `/dashboard/debug` | Developer debug tools (gated by `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS`) |

### API Routes
| Route | Purpose |
|---|---|
| `POST /api/generate-missions` | Claude-powered mission generation + Supabase insert |
| `GET /api/weather` | Weather fetch (wttr.in, cached) |
| `GET /api/daily-briefing` | AI daily briefing summary |
| `GET /api/debug/health` | Sanitized health check (debug mode only) |
| `POST /api/win-journal` | Save/read parent win journal entries |
| `POST /api/notify-reward` | Reward redemption notification |
| `POST /api/weekly-summary` | Weekly summary email (Resend) |
| `POST /api/welcome-email` | Welcome email on signup |

---

## Database Tables

| Table | Key Columns | RLS |
|---|---|---|
| `children` | `id`, `parent_id`, `name`, `age`, `points`, `streak`, `location_label`, `location_city` | Yes — scoped to parent |
| `missions` | `id`, `child_id`, `title`, `category`, `is_completed`, `mission_date`, `screen_time_reward`, `generated_by` | Yes — scoped to parent via child |
| `family_plans` | `id`, `parent_id`, `onboarding_completed`, `personalization_data` (jsonb) | Yes — scoped to parent |
| `rewards` | `id`, `user_id`, `title`, `cost` | Yes — scoped to parent |
| `bt_coin_wallet` | `child_id`, `balance` | Yes |
| `streaks` | `child_id`, `current_streak`, `last_completed_date` | Yes |
| `win_journal` | `id`, `parent_id`, `win_text`, `win_date` | Yes |
| `weather_cache` | `location`, `data` (jsonb), `fetched_at` | Open read |
| `points_history` | `id`, `child_id`, `change`, `reason` | Yes |
| `notification_settings` | `id`, `parent_email` | Yes |

**Critical:** `children` uses `parent_id` (NOT `user_id`). Migration `20260001` is deprecated and must never be run.

---

## Supabase Client Architecture

Three clients — each has different permissions:

```typescript
// 1. Client-side singleton (browser code, 'use client' components)
import { getSupabase } from '@/lib/supabase';
const supabase = getSupabase(); // anon key, session-based RLS

// 2. Per-request auth client (API routes — carries user's Bearer token)
const anonSupabase = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${callerToken}` } }
});

// 3. Service role client (API routes ONLY — bypasses RLS)
import { createServiceSupabaseClient } from '@/lib/supabase';
const svc = createServiceSupabaseClient(); // NEVER in 'use client' components
```

---

## Coding Standards

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Run `npx tsc --noEmit` before every commit
- No `any` types in new code — use proper types or `unknown`
- API route body params typed explicitly

### Components
- `'use client'` only when component uses hooks or browser APIs
- Server components preferred for static/data-fetching pages
- `window.*` always wrapped in `useEffect(() => { ... }, [])`

### Tailwind
- `rounded-2xl` for cards, `rounded-xl` for smaller elements, `rounded-full` for pills/buttons
- `min-h-[44px]` on all interactive elements (touch accessibility)
- `space-y-8` between major sections, `space-y-4` within sections
- `transition-all` on hover states, `active:scale-95` on buttons

### Comments
- No comments on obvious code
- Comments only for: non-obvious constraints, RLS bypass justification, privacy rationale
- Never reference GitHub issue numbers or PR titles in comments

### Logging
- API routes: structured JSON via `[mission-debug <rid>]` prefix
- Never log: API keys, Bearer tokens, child names, parent emails, mood data
- Client code: `console.error` only (no `console.log` in production paths)

---

## Testing Commands

```bash
# TypeScript check (must be clean before any PR)
npx tsc --noEmit

# Production build (must succeed before any PR)
npx next build --no-lint

# Playwright smoke tests
npx playwright test tests/smoke.spec.ts

# Security checks
grep -rn "createServiceSupabaseClient" app/ --include="*.tsx" | grep -v "route.ts"
grep -rn "SUPABASE_SERVICE_ROLE_KEY\|ANTHROPIC_API_KEY" app/ --include="*.tsx"
```

---

## Deployment Notes

- **Branch:** `claude/child-picker-redesign` → PR → `main`
- **Platform:** Vercel (auto-deploys from `main`)
- **Required Vercel env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (needed for mission inserts)
  - `ANTHROPIC_API_KEY` (needed for AI missions)
  - `NEXT_PUBLIC_SITE_URL` (needed for password reset)
  - `RESEND_API_KEY` (needed for emails)
- **Debug mode:** set `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true` to enable `/dashboard/debug`
- **Prebuild script:** `scripts/verify-env.js` runs before every Vercel build and fails if required vars are missing

---

## Agent Coordination

Use these agents in sequence for common workflows. See `docs/agent-workflow.md` for full workflow templates.

### Before merging a PR:
1. `qa-regression-agent` — full regression sweep + build check
2. `security-privacy-agent` — check for secret leakage and data exposure
3. `ui-polish-agent` — if UI changes are included

### When missions aren't generating:
1. `supabase-debug-agent` — diagnose RLS / schema / auth
2. `ai-mission-agent` — if DB is fine but Claude is failing
3. Check `/dashboard/debug` (requires `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true`)

### When planning a new feature:
1. `product-strategy-agent` — loop alignment + scope check
2. `copy-positioning-agent` — draft parent-facing copy
3. `child-experience-agent` — if feature touches Kid Mode
4. `parent-experience-agent` — if feature touches dashboard/onboarding

### For UI work:
1. `ui-polish-agent` — design system compliance
2. `child-experience-agent` — if in Kid Mode
3. `performance-agent` — if new images, animations, or data fetching added

---

## Safety Rules for All Agents

1. **Never expose secrets** — API keys, service role key, and auth tokens must never appear in logs, responses, or client-side code
2. **Never modify RLS without human approval** — RLS protects child and family data
3. **Never run `20260001_core_schema.sql`** — it uses deprecated `user_id` column
4. **Never import `createServiceSupabaseClient` in client components**
5. **Never send child names or parent emails to Claude API**
6. **Never auto-approve screen time** — parent approval is a core trust mechanism
7. **Never remove the demo mode URL gate** — `?demo=1` must remain the only way to activate demo mode
8. **Always run `npx tsc --noEmit` before reporting a task complete**
9. **Never show raw Supabase errors to end users** — always return friendly messages
10. **Child data belongs to the parent only** — all queries must be scoped to `parent_id`
