-- 20260013 — Normalize screen_time_limit column
--
-- Context: Code prior to PR #10 referenced daily_screen_time_goal, which does
-- not exist in production. Migration 20260002 added screen_time_limit as the
-- canonical column. This migration ensures screen_time_limit exists on the
-- children table and, if daily_screen_time_goal exists from a dev environment,
-- migrates its data into screen_time_limit and drops it.
--
-- Safe to re-run: all statements use IF EXISTS / IF NOT EXISTS guards.

-- 1. Ensure screen_time_limit exists (no-op if already present from 20260002)
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS screen_time_limit integer NOT NULL DEFAULT 60;

-- 2. If daily_screen_time_goal exists in any environment, migrate its values
--    into screen_time_limit (where screen_time_limit is still the default)
--    then drop it.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'children'
      AND column_name  = 'daily_screen_time_goal'
  ) THEN
    UPDATE public.children
      SET screen_time_limit = daily_screen_time_goal
      WHERE daily_screen_time_goal IS NOT NULL
        AND screen_time_limit = 60; -- only overwrite if still at default
    ALTER TABLE public.children DROP COLUMN daily_screen_time_goal;
  END IF;
END $$;

-- 3. Ensure mission_date column exists on missions table
--    (added in earlier migrations but may be absent in some environments)
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS mission_date date;
