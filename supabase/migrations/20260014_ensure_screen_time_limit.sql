-- Ensure screen_time_limit column exists and refresh schema cache.
-- Safe to re-run (uses IF NOT EXISTS / idempotent checks).

-- 1. Add column if missing
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS screen_time_limit integer NOT NULL DEFAULT 60;

-- 2. Backfill from legacy column if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'daily_screen_time_goal'
  ) THEN
    UPDATE children
    SET screen_time_limit = daily_screen_time_goal
    WHERE daily_screen_time_goal IS NOT NULL
      AND screen_time_limit = 60;
  END IF;
END $$;

-- 3. Reload PostgREST schema cache so the column is immediately visible
NOTIFY pgrst, 'reload schema';
