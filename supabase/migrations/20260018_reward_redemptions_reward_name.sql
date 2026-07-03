-- 20260018 — Reconcile reward_name vs reward_title on reward_redemptions
--
-- Root cause: production reward_redemptions was created with reward_name text NOT NULL
-- (the original schema, visible in CANADA_MIGRATION_RUNBOOK.md). The app code was
-- inserting reward_title without reward_name, triggering a NOT NULL violation (code 23502).
--
-- This migration:
--   1. Adds reward_title if missing (new apps use this name)
--   2. Ensures reward_name exists (original NOT NULL column)
--   3. Backfills each from the other so no rows have nulls in either column
--   4. Does NOT add a NOT NULL to reward_title — it may not exist on all schemas
--
-- Safe to re-run: all operations use IF NOT EXISTS / conditional guards.

-- ─────────────────────────────────────────────────────────────────
-- 1. Add reward_title if it doesn't exist yet
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.reward_redemptions
  ADD COLUMN IF NOT EXISTS reward_title text;

-- ─────────────────────────────────────────────────────────────────
-- 2. Add reward_name if it doesn't exist yet
--    (it should already exist in production with NOT NULL, but guard
--    it so this migration is safe on any schema state)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.reward_redemptions
  ADD COLUMN IF NOT EXISTS reward_name text;

-- ─────────────────────────────────────────────────────────────────
-- 3. Backfill reward_title from reward_name where null
-- ─────────────────────────────────────────────────────────────────
UPDATE public.reward_redemptions
  SET reward_title = reward_name
  WHERE reward_title IS NULL AND reward_name IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 4. Backfill reward_name from reward_title where null
-- ─────────────────────────────────────────────────────────────────
UPDATE public.reward_redemptions
  SET reward_name = reward_title
  WHERE reward_name IS NULL AND reward_title IS NOT NULL;
