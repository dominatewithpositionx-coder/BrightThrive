# BrytThrive Architecture Roadmap

> Priority filter: **trust → delight → retention → pilot learning → safety → emotional transformation**
> Not: shiny tech, feature count, completeness theatre.

---

## Current Stack (Production)

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 14 App Router | ✅ Production |
| Language | TypeScript | ✅ Production |
| Database | Supabase (Postgres) | ✅ Production |
| Auth | Supabase Auth | ✅ Production |
| RLS | Row Level Security | ✅ Hardened (SEV-1 patched) |
| Hosting | Vercel | ✅ Production |
| AI | Claude Haiku (Anthropic) | ✅ Production |
| Weather | wttr.in (no API key) | ✅ Production |
| Email | Resend (configured, not wired) | ⚠️ Partial |
| Analytics | Vercel Analytics | ✅ Basic |
| Fonts | Poppins via next/font | ✅ Production |
| Animations | CSS transitions + canvas-confetti | ✅ Production |
| Motion | framer-motion (rewards page only) | ⚠️ Partial |

---

## Architecture Decision Record

### A — Build Now

**1. Landing page trust layer**
- Zero engineering risk
- Copy edits only: headline, trust signals, "not a screen blocker" statement
- Impact: conversion lift for every new family
- Time: 2 hours
- Files: `app/page.tsx`, `app/layout.tsx`

**2. Onboarding email — Email 1 via Resend**
- Resend is already in the stack (`lib/brand.ts` references it)
- Trigger: Supabase auth `on sign up` webhook OR manual send on account creation
- Email 1: Welcome + quick start checklist (already written in Notion library)
- Without this: every pilot family who signs up and hears nothing in 24h is a churn risk
- Time: 3–4 hours
- Files: `app/api/notify/route.ts` exists, extend it; add Resend welcome trigger

**3. PWA manifest + install prompt**
- BrytThrive is a web app used on phones
- A PWA install prompt makes it feel native — icon on home screen, no browser chrome
- Requires: `public/manifest.json`, meta tags in `app/layout.tsx`, `apple-touch-icon`
- Time: 2 hours
- No DB changes, no new pages

---

### B — Build Soon (Phase 2, post-pilot validation)

**4. Stripe annual plans ($149/$249)**
- Annual lock-in is the strongest retention mechanic available
- $149/year Core = $12.42/month effective (vs $14.99 monthly)
- A family that paid $149 does not churn in month 3
- Requires: Stripe integration, `subscription_tier` field on `family_plans`, upgrade flow
- Time: 1–2 sprints

**5. PostHog analytics event layer**
- Pilot learning requires data: which moods are most common? Do mood-matched missions have higher completion rates? What's the D7 retention?
- PostHog free tier is sufficient for pilot scale
- Events to capture: `mood_selected`, `mission_completed`, `reward_redeemed`, `missions_generated`
- Time: 4 hours (no DB changes — client-side events only)

**6. Resend email sequence — Emails 2–6**
- After Email 1 (welcome), automate Emails 2–6 over 14 days
- Email 3 ("What color is your mood today?") is the EI education email
- Email 6 ("You're doing amazing") is the retention email that keeps families from churning at week 2
- Time: 1 sprint (sequences already written)

---

### C — Later (Phase 3)

**7. Weekly AI parent summary**
- Claude generates a personalized weekly digest: mood trends, mission completion rate, streaks, notable moments
- Sent via Resend every Monday morning
- Requires: background job (Supabase Edge Function or Vercel Cron), mood_logs table
- Time: 2 sprints
- Dependency: mood_logs DB table (not yet confirmed to exist)

**8. Predictive mood insights (Parent Intelligence Layer)**
- 7-day mood trend visualization in parent dashboard
- "August tends to be frustrated on Tuesdays — try reducing screen time before school"
- Requires: mood_logs table with enough data (minimum 2 weeks of pilot use)
- Time: 1 sprint UI + 1 sprint AI layer

**9. Referral system with dual-sided rewards**
- "Invite a friend → both families get 1 month free"
- Drives viral growth organically from pilot families
- Requires: `referral_codes` table, referral tracking, Stripe credit logic
- Time: 2 sprints

**10. Push notifications**
- "August just completed all his missions! 🏆"
- Web Push API (no native app required)
- Requires: service worker, push subscription storage
- Time: 1 sprint

---

### D — Do Not Build Yet

| Technology | Reason |
|---|---|
| RAG / pgvector / embeddings | No corpus large enough to benefit. Re-evaluate at 1,000+ families. |
| Family memory timeline | Beautiful product idea. Wrong phase. Build after retention is proven. |
| Voice AI | Complex, expensive, high latency for children. Phase 5. |
| SwiftUI iOS app | Native app adds App Store friction. PWA first. Revisit at Year 2. |
| AI safety content filters | Claude's built-in safety is sufficient at pilot scale. Re-evaluate at public launch. |
| AI prompt versioning / registry | Overhead not justified until prompt iteration is causing production regressions. |
| School Mode | Different product, different customer, different compliance. Year 2. |
| ADHD specialist integrations | Clinical territory. Legal and compliance complexity. Year 3+. |
| Background workers (complex) | Vercel Cron is sufficient for weekly summaries. No queue needed yet. |

---

## File Architecture — Current vs Target

### Current (what exists)
```
app/
  page.tsx              ← waitlist form (minimal, needs replacement)
  layout.tsx            ← global shell
  child/page.tsx        ← full child flow
  dashboard/
    page.tsx            ← parent home
    children/page.tsx
    rewards/page.tsx
    settings/page.tsx
    tasks/page.tsx
    history/page.tsx
    analytics/page.tsx
    components/
      OnboardingWizard.tsx
      header.tsx / sidebar.tsx / shell.tsx
  api/
    generate-missions/  ← Claude + weather + mood ✅
    notify/             ← email stub
    notify-reward/      ← reward email
    waitlist/           ← waitlist signup
components/
  Auth.tsx
  WaitlistForm.tsx
lib/
  brand.ts              ← brand constants
  mood.ts               ← mood types + EI responses (new) ✅
  weather.ts            ← weather context
  supabase.ts           ← Supabase client
```

### Target (after Phase 1–2)
```
lib/
  mood.ts               ✅ done
  weather.ts            ✅ done
  copy.ts               ← brand copy strings (taglines, CTAs)
  avatar.ts             ← avatar color logic (used in 3+ places)
components/
  brightthrive/
    AvatarCircle.tsx    ← shared child avatar component
    CoinDisplay.tsx     ← points + star display
    EmptyState.tsx      ← shared empty state
    ProgressBar.tsx     ← shared progress bar
  ui/                   ← (only if shadcn/ui added later)
```

---

## Security Status

| Area | Status |
|---|---|
| RLS policies | ✅ Hardened — SEV-1 patched |
| generate-missions auth | ✅ JWT verification + RLS child ownership check |
| API keys | ✅ Vercel env vars only — not in code |
| Data isolation | ✅ Verified — Account B cannot see Account A data |
| family_plans upsert | ✅ Fixed — explicit insert/update, no silent failures |

**Do not weaken any of the above.**

---

## Next 3 Builds — Prioritized

### Build 1: Landing Page Trust Layer
**Why first:** Zero risk, maximum conversion impact, can ship today.
**What:** Replace the waitlist-only home page with a real landing page.
**Copy (already written — use exactly):**
- H1: "Turn Screen Time Into Growth Time"
- H2: "Healthy habits. Emotional intelligence. Calmer homes."
- "BrytThrive is not a screen blocker. We motivate growth, not punishment."
- "The problem isn't screens — it's what screens replace."
- Trust bar: "🇨🇦 Data stored in Canada · No ads · No tracking · Parents own their data"
- Trust note: "Built by parents, informed by lived experience, and designed to help families navigate the challenges of raising children in today's digital world—one small win at a time."
- Founder note: Wayne's letter (2–3 sentences)

### Build 2: Onboarding Email — Email 1 via Resend
**Why second:** Pilot families are signing up right now. Without a welcome email, every signup that doesn't log in within 24h is likely gone. This is the retention floor.
**What:** Wire Resend to send Email 1 on first signup.
**Email 1 subject:** "Welcome to BrytThrive! Here's what happens next 💛"
**Trigger:** Supabase auth webhook on `user.created` → POST to `/api/notify`

### Build 3: PWA Manifest + Install Prompt
**Why third:** BrytThrive is used by children on phones. The browser URL bar is friction. An install prompt converts the web app into a home screen icon. This makes it feel like a real product, not a website.
**What:** `public/manifest.json`, `apple-touch-icon`, `theme-color` meta tag, install prompt component.
**Time:** 2 hours. High perceived quality lift for zero backend work.

---

## The Standard

Every build must answer all of:

- Would Tim Cook demo this?
- Would Jony Ive remove something?
- Would a tired parent understand it immediately?
- Would a child feel seen?
- Would this make family life calmer?
- Would this increase trust?
- Would this make someone tell a friend?

If not → simplify, remove, or defer.
