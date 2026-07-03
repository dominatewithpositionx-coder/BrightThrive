-- 20260017 — Add missing columns to reward_redemptions
--
-- The production reward_redemptions table was created with only the original
-- columns (id, child_id, reward_id, status, created_at, and possibly parent_id).
-- The app now needs: parent_id, reward_title, coin_cost, reward_type,
-- requested_at, fulfilled_at.
--
-- This is a standalone migration that only touches reward_redemptions.
-- It is safe to run even if 20260016 was already applied (all guards are
-- IF NOT EXISTS).
--
-- Run in Supabase Dashboard → SQL Editor. Safe to re-run.

-- ─────────────────────────────────────────────────────────────────
-- 1. Add missing columns
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.reward_redemptions
  ADD COLUMN IF NOT EXISTS parent_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reward_title text,
  ADD COLUMN IF NOT EXISTS coin_cost    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_type  text    DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS status       text    NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS requested_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

-- ─────────────────────────────────────────────────────────────────
-- 2. Backfill parent_id from user_id if user_id exists and parent_id is null
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reward_redemptions' AND column_name = 'user_id'
  ) THEN
    UPDATE public.reward_redemptions SET parent_id = user_id WHERE parent_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 3. Make reward_id nullable so "Tell My Parent" requests can insert
--    without a specific reward
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reward_redemptions' AND column_name = 'reward_id'
  ) THEN
    ALTER TABLE public.reward_redemptions ALTER COLUMN reward_id DROP NOT NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 4. Ensure RLS is enabled and policies use parent_id
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents manage own redemptions" ON public.reward_redemptions;

CREATE POLICY "Parents manage own redemptions" ON public.reward_redemptions
  FOR ALL
  USING     (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- ─────────────────────────────────────────────────────────────────
-- 5. Table-level grants
-- ─────────────────────────────────────────────────────────────────
GRANT ALL ON public.reward_redemptions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
