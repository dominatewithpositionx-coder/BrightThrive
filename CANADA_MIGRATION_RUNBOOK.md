# BrytThrive — Canada Data Residency Migration Runbook
**Version:** 1.0  
**Date:** June 2026  
**Author:** Wayne (with Claude Code)  
**Status:** READY FOR EXECUTION

---

## Overview

BrytThrive's landing page, settings page, and email footer claim "Data stored in Canada."  
This runbook migrates the production Supabase project from `us-west-2` (Oregon) to `ca-central-1` (Canada Central) to make that claim truthful before pilot launch.

---

## Source Project

| Field | Value |
|---|---|
| Project ref | `podbhwlabculfrtqbbnf` |
| Region | us-west-2 / Oregon |
| Status | Pre-pilot; zero real family data |

## Target Project

| Field | Value |
|---|---|
| Name | BrytThrive Production Canada |
| Region | **Canada Central / ca-central-1** |
| Project ref | (assigned by Supabase after creation) |

---

## Rollback Plan

Because this is a pre-pilot migration with no real family data:

- **Rollback = revert 3 Vercel env vars** to the old values and redeploy.  
- The old project at `podbhwlabculfrtqbbnf` remains untouched until you confirm the new project is working.
- Do not delete the old project until the pilot has been running for at least 2 weeks on the new project.

---

## Step-by-Step Execution

### STEP 1 — Wayne Creates New Supabase Project (Manual)

1. Go to [supabase.com](https://supabase.com) → Your organization → **New Project**
2. Fill in:
   - **Name:** `BrytThrive Production Canada`
   - **Database password:** generate a strong password and save it in your password manager
   - **Region:** `Canada (Central)` — verify this carefully before clicking Create
3. Click **Create new project** and wait ~2 minutes for provisioning

**After creation, confirm:**
- Dashboard → Settings → General → Region shows `ca-central-1` or `Canada (Central)`

---

### STEP 2 — Run Schema SQL in New Project (Manual, SQL Editor)

1. New project → **SQL Editor** → New query
2. Paste the entire SQL block from `CANADA_MIGRATION_SCHEMA.sql` (generated separately)
3. Click **Run**
4. Should complete with no errors
5. Run the verification queries from `CANADA_MIGRATION_VERIFY.sql`

---

### STEP 3 — Enable Realtime (Manual, Supabase Dashboard)

Dashboard → **Database** → **Replication** (or Table Editor → table → toggle Realtime ON):

- [x] `bt_coin_ledger`
- [x] `bt_coin_wallet`
- [x] `rewards`
- [x] `reward_redemptions`

---

### STEP 4 — Configure Auth Redirect URLs (Manual)

Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `https://brytthrive.com`
- **Redirect URLs:** add `https://brytthrive.com/**`

---

### STEP 5 — Get API Keys (Manual)

Dashboard → **Settings** → **API**:

Copy (do not paste into chat — enter directly into Vercel):
- Project URL: `https://[new-ref].supabase.co`
- `anon / public` key
- `service_role / secret` key

---

### STEP 6 — Update Vercel Environment Variables (Manual)

Vercel Dashboard → `brightthrive` project → **Settings** → **Environment Variables**

Update these three for **Production** and **Preview** environments:

| Variable | Action |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Replace with new Canada project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Replace with new Canada anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Replace with new Canada service role key |

---

### STEP 7 — Trigger Redeploy (Manual)

Vercel → Deployments → latest deployment → **Redeploy**  
Or push a trivial commit to main.

Wait for build to show **Ready**.

---

### STEP 8 — Verify (Manual + Automated)

Run all checks in the **Verification Checklist** section below.

---

### STEP 9 — Provide New Project Ref to Claude Code

Tell Claude Code:
> "New project ref is `[new-ref]`. Region confirmed Canada Central."

Claude Code will then:
- Update any documentation references
- Commit and push all changes to the feature branch
- Provide final data residency report

---

## Automated Steps (Claude Code does these)

| Task | Status |
|---|---|
| Privacy minimization: child name/age not sent to Anthropic | ✅ Done |
| Age-band helper (`ageBand()`) in generate-missions | ✅ Done |
| `.env.local.example` corrected (wrong var names fixed, stale ref removed) | ✅ Done |
| Stale `route.tx` duplicate deleted | ✅ Done |
| Schema SQL file (`CANADA_MIGRATION_SCHEMA.sql`) | ✅ Included below |
| Verification SQL (`CANADA_MIGRATION_VERIFY.sql`) | ✅ Included below |
| This runbook | ✅ Done |
| Commit + push to feature branch | Pending new project ref |

---

## Schema SQL (Copy into SQL Editor on new project)

```sql
-- ═══════════════════════════════════════════════════════════════════
-- BRIGHTTHRIVE — CANADA PROJECT SCHEMA
-- Paste into: new ca-central-1 project → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── waitlist ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ─── family_onboarding ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_onboarding (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step       integer NOT NULL DEFAULT 0,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.family_onboarding ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.family_onboarding;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.family_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "parent_own_onboarding" ON public.family_onboarding
  FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- ─── children ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.children (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  age              integer,
  pin              text,
  screen_time_used integer NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_children_select" ON public.children
  FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "parent_own_children_insert" ON public.children
  FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "parent_own_children_update" ON public.children
  FOR UPDATE USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "parent_own_children_delete" ON public.children
  FOR DELETE USING (auth.uid() = parent_id);

-- ─── missions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.missions (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id           uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title              text NOT NULL,
  description        text,
  category           text NOT NULL DEFAULT 'general',
  screen_time_reward integer NOT NULL DEFAULT 0,
  is_completed       boolean NOT NULL DEFAULT false,
  mission_date       date NOT NULL DEFAULT CURRENT_DATE,
  status             text NOT NULL DEFAULT 'active',
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_missions_select" ON public.missions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = missions.child_id AND c.parent_id = auth.uid()
  ));
CREATE POLICY "parent_own_missions_insert" ON public.missions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = missions.child_id AND c.parent_id = auth.uid()
  ));
CREATE POLICY "Owners can update own children missions" ON public.missions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = missions.child_id AND c.parent_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = missions.child_id AND c.parent_id = auth.uid()
  ));
CREATE POLICY "parent_own_missions_delete" ON public.missions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = missions.child_id AND c.parent_id = auth.uid()
  ));

-- ─── rewards ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rewards (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  cost       integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_rewards" ON public.rewards
  FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- ─── bt_coin_wallet ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bt_coin_wallet (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        uuid UNIQUE NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  balance         integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE public.bt_coin_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_wallet_select" ON public.bt_coin_wallet
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = bt_coin_wallet.child_id AND c.parent_id = auth.uid()
  ));

-- ─── bt_coin_ledger ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bt_coin_ledger (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id    uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  amount      integer NOT NULL,
  type        text NOT NULL,
  description text,
  mission_id  uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  reward_id   uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.bt_coin_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_ledger_select" ON public.bt_coin_ledger
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = bt_coin_ledger.child_id AND c.parent_id = auth.uid()
  ));

-- ─── reward_redemptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id    uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reward_id   uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  reward_name text NOT NULL,
  cost        integer NOT NULL,
  redeemed_at timestamptz DEFAULT now()
);
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_redemptions_select" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "parent_own_redemptions_insert" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- ─── family_plans ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_plans (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id            uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personalization_data jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
ALTER TABLE public.family_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own_plans" ON public.family_plans
  FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- ─── add_coins RPC (SECURITY DEFINER) ──────────────────────────
CREATE OR REPLACE FUNCTION public.add_coins(
  p_child_id    uuid,
  p_amount      integer,
  p_type        text,
  p_description text    DEFAULT NULL,
  p_mission_id  uuid    DEFAULT NULL,
  p_reward_id   uuid    DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bt_coin_wallet WHERE child_id = p_child_id) THEN
    UPDATE public.bt_coin_wallet SET
      balance         = GREATEST(0, balance + p_amount),
      lifetime_earned = lifetime_earned + GREATEST(0, p_amount),
      updated_at      = now()
    WHERE child_id = p_child_id;
  ELSE
    INSERT INTO public.bt_coin_wallet (child_id, balance, lifetime_earned, updated_at)
    VALUES (p_child_id, GREATEST(0, p_amount), GREATEST(0, p_amount), now());
  END IF;
  INSERT INTO public.bt_coin_ledger (child_id, amount, type, description, mission_id, reward_id)
  VALUES (p_child_id, p_amount, p_type, p_description, p_mission_id, p_reward_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) FROM anon;

-- ─── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_children_parent_id        ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_missions_child_id         ON public.missions(child_id);
CREATE INDEX IF NOT EXISTS idx_missions_date             ON public.missions(mission_date);
CREATE INDEX IF NOT EXISTS idx_bt_coin_ledger_child_id   ON public.bt_coin_ledger(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_parent ON public.reward_redemptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_plans_parent_id    ON public.family_plans(parent_id);
```

---

## Verification SQL (Run After Schema SQL)

```sql
-- 1. All expected tables present
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: bt_coin_ledger, bt_coin_wallet, children, family_onboarding,
--           family_plans, missions, reward_redemptions, rewards, waitlist

-- 2. add_coins signature correct
SELECT p.parameter_name, p.data_type, p.parameter_mode
FROM information_schema.parameters p
JOIN information_schema.routines r ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' AND r.routine_name = 'add_coins'
ORDER BY p.ordinal_position;

-- 3. RLS enabled on all user tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All should show rowsecurity = true

-- 4. anon CANNOT call add_coins
SELECT has_function_privilege('anon', 'public.add_coins(uuid,integer,text,text,uuid,uuid)', 'EXECUTE');
-- Expected: false

-- 5. authenticated CAN call add_coins
SELECT has_function_privilege('authenticated', 'public.add_coins(uuid,integer,text,text,uuid,uuid)', 'EXECUTE');
-- Expected: true

-- 6. Confirm no permissive wildcard RLS policies exist (SEV-1 fix verified)
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true'
ORDER BY tablename;
-- Expected: 0 rows (no USING(true) policies)

-- 7. Dry-run add_coins (after signup + add child)
--    First: SELECT id FROM children LIMIT 1;  → copy uuid
--    Then:  SELECT add_coins('<uuid>', 10, 'mission', 'test', NULL, NULL);
--    Expected: (void) — wallet row created
```

---

## Browser Smoke Test Checklist

Run after Vercel redeploy points to Canada project:

- [ ] Sign up with new email → lands on dashboard
- [ ] Welcome email arrives within 2 minutes (check spam)
- [ ] Add a child → appears on dashboard with 0 coins
- [ ] Go to `/child` → mood flow completes → missions screen loads
- [ ] Missions generate (Claude Haiku) — 5 appear within 5 seconds
- [ ] Complete a mission → confetti fires → coin balance +10
- [ ] Undo mission → coin balance -10
- [ ] Dashboard → History → ledger entry visible
- [ ] Create a reward (e.g. "30 min gaming", 50 coins)
- [ ] Complete 5 missions to earn 50 coins
- [ ] Redeem reward → coins deduct → redemption in history
- [ ] Settings → toggle Reward Redemption Alerts ON → redeem → reward email arrives
- [ ] Settings → enter a city → Save → reload → persists
- [ ] PWA: install to home screen on mobile (iOS Safari or Android Chrome)
- [ ] No errors in browser console (F12) throughout

---

## Verification Checklist

### Infrastructure
- [ ] New Supabase project region: `Canada (Central)` / `ca-central-1`
- [ ] Production Vercel env vars updated (3 variables)
- [ ] Vercel redeploy shows **Ready**
- [ ] Production app URL resolves to new Supabase ref (check Network tab → any supabase request header)

### Database
- [ ] All 9 tables present
- [ ] RLS enabled on all tables
- [ ] No `USING(true)` wildcard policies
- [ ] `add_coins` RPC exists with correct 6-parameter signature
- [ ] `anon` cannot execute `add_coins`
- [ ] `authenticated` can execute `add_coins`
- [ ] Realtime enabled on 4 tables

### Privacy
- [ ] Child name not sent to Anthropic (use age band only)
- [ ] Weather call sends city name only (no postal code, no address)
- [ ] Resend receives: parent email, child first name in subject only, reward name
- [ ] Analytics is console-log only (no external calls)

---

## Privacy Architecture Summary

### What stays in Canada (Supabase ca-central-1)
- Parent email address and auth credentials
- Child names and ages
- Mission history and coin ledger
- Reward definitions and redemption records
- Family settings, location (city), notification preferences
- All session tokens and RLS-controlled row data

### What is processed outside Canada (minimized)

| Service | Data sent | Purpose | Avoidable? |
|---|---|---|---|
| **Anthropic (USA)** | Age band (e.g. "8–10"), mood label, city weather summary | Mission generation | No — core feature |
| **wttr.in** | City name only (if location set) | Weather context for missions | Yes — optional; skipped if no location set |
| **Resend (USA)** | Parent email, child first name (in subject line), reward name | Transactional email delivery | No — required for email |
| **Vercel (USA edge)** | All HTTP traffic | App hosting and compute | No — hosting platform |

**After privacy minimization:** child's real name is no longer sent to Anthropic. Age is coarsened to a 2-3 year band. Mission quality is maintained.

### Parent-facing privacy disclosure language

> **Your family's data is stored in Canada** (AWS ca-central-1 via Supabase). To generate personalized daily missions, a child's age range and today's mood are shared with Anthropic (USA) — no names or identifiers are included. Transactional emails are delivered via Resend (USA). If you enable weather-aware missions in Settings, your city name is sent to wttr.in for local conditions. No personal data is sold, shared with advertisers, or used to train AI models. You can delete your account and all data at any time by contacting Wayne directly.

---

## Post-Migration Old Project Retention

- Keep `podbhwlabculfrtqbbnf` (old US project) paused but not deleted until:
  - Pilot runs successfully for 2+ weeks on Canada project
  - No rollback has been needed
- After that: pause (free tier) or delete the old project

---

## Edge Functions (Not Required for Pilot)

`send-summary` and `reset-children` are optional Edge Functions not called by the main app UI.  
Deploy after pilot if needed:

```bash
# Requires Supabase CLI, authenticated to new project
supabase functions deploy send-summary --project-ref [new-ref]
supabase functions deploy reset-children --project-ref [new-ref]
```

---

## Final Status Before Pilot Launch

| Check | Status |
|---|---|
| Schema migrated to Canada | ⏳ Awaiting new project creation |
| Env vars updated in Vercel | ⏳ Awaiting new keys |
| Redeploy confirmed Ready | ⏳ Awaiting redeploy |
| Smoke test passed | ⏳ Awaiting verification |
| Privacy minimization (Anthropic) | ✅ Deployed |
| "Data stored in Canada" claim truthful | ⏳ Awaiting migration |
| Pilot launch authorized | ⏳ Not yet |
