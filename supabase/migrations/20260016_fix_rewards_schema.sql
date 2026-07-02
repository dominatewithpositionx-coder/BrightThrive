-- 20260016 — Fix rewards table schema mismatch
--
-- Root cause: Production rewards table was created with columns named
-- `user_id` and `cost`. All application code (dashboard, child view,
-- rewards page) expects `parent_id` and `coin_cost` plus the columns
-- `reward_type`, `is_active`, and `sort_order`. Migration 20260002
-- attempted to patch this but its ALTER TABLE failed because it tried
-- to ALTER COLUMN on columns that didn't yet exist; a single ALTER TABLE
-- with multiple ALTER COLUMN clauses fails atomically if any column is
-- missing. Result: PGRST204 "Could not find the 'coin_cost' column of
-- 'rewards' in the schema cache".
--
-- This migration:
--   1. Adds `parent_id`    (backfills from `user_id` if present)
--   2. Adds `coin_cost`    (backfills from `cost` if present)
--   3. Adds `reward_type`  DEFAULT 'standard'
--   4. Adds `is_active`    DEFAULT true
--   5. Adds `sort_order`   DEFAULT 0
--   6. Fixes RLS policies to use `parent_id`
--   7. Grants table access to authenticated role
--
-- Safe to re-run: all operations use IF NOT EXISTS / IF EXISTS guards.
-- Does NOT drop any existing column — preserves all existing data.

-- ─────────────────────────────────────────────────────────────────
-- 1. Add parent_id if missing
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill parent_id from user_id when user_id column exists and parent_id is null
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'user_id'
  ) THEN
    UPDATE public.rewards SET parent_id = user_id WHERE parent_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Add coin_cost if missing
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS coin_cost integer NOT NULL DEFAULT 0;

-- Backfill coin_cost from cost when cost column exists and coin_cost is still default 0
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'cost'
  ) THEN
    UPDATE public.rewards SET coin_cost = cost WHERE cost IS NOT NULL AND cost <> 0 AND coin_cost = 0;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 3. Add reward_type, is_active, sort_order if missing
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_active   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order  integer NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────
-- 4. Ensure RLS is enabled
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- 5. Drop stale policies, create correct ones
--
-- The original "Parents manage own rewards" policy used `user_id`.
-- We need it to use `parent_id`. Because both might exist (one from
-- 20260001 with user_id, one from 20260003 with parent_id), we drop
-- both variants and recreate cleanly.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Parents manage own rewards"           ON public.rewards;
DROP POLICY IF EXISTS "Anon can read rewards"                ON public.rewards;
DROP POLICY IF EXISTS "Authenticated users read own rewards" ON public.rewards;

CREATE POLICY "Parents manage own rewards" ON public.rewards
  FOR ALL
  USING     (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- Child view reads rewards scoped to their parent's account.
-- The child view runs under the parent's session (auth.uid() resolves),
-- so the parent-scoped ALL policy above already covers SELECT.
-- This additional SELECT policy is a belt-and-suspenders for edge cases.
CREATE POLICY "Authenticated users read own rewards" ON public.rewards
  FOR SELECT
  USING (auth.uid() = parent_id);

-- ─────────────────────────────────────────────────────────────────
-- 6. Table-level grants (required for PostgREST before RLS runs)
-- ─────────────────────────────────────────────────────────────────
GRANT ALL ON public.rewards TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 7. Verify reward_redemptions has required columns (belt-and-suspenders)
--    These should already exist from the original production schema,
--    but add them safely in case they are missing.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.reward_redemptions
  ADD COLUMN IF NOT EXISTS parent_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reward_title text,
  ADD COLUMN IF NOT EXISTS coin_cost    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_type  text    DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS status       text    NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS requested_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

-- Backfill parent_id from user_id if user_id exists and parent_id is null
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reward_redemptions' AND column_name = 'user_id'
  ) THEN
    UPDATE public.reward_redemptions SET parent_id = user_id WHERE parent_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- reward_id: keep nullable so "Tell My Parent" requests (no specific reward) can insert
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reward_redemptions' AND column_name = 'reward_id'
  ) THEN
    ALTER TABLE public.reward_redemptions ALTER COLUMN reward_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents manage own redemptions" ON public.reward_redemptions;

CREATE POLICY "Parents manage own redemptions" ON public.reward_redemptions
  FOR ALL
  USING     (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

GRANT ALL ON public.reward_redemptions TO authenticated;
