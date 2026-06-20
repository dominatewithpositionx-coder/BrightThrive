-- BrightThrive: Schema patch to align existing DB with current frontend
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run: all operations use IF NOT EXISTS / IF EXISTS guards

-- ─────────────────────────────────────────────────────────────────
-- PATCH: children table
-- Existing table uses parent_id (correct). Missing: points, screen_time_limit.
-- Relax NOT NULL on columns the app doesn't always provide.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS screen_time_limit integer NOT NULL DEFAULT 60;

ALTER TABLE public.children
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN difficulty_level DROP NOT NULL,
  ALTER COLUMN pin DROP NOT NULL;

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='Parents manage own children') THEN
    CREATE POLICY "Parents manage own children" ON public.children FOR ALL
      USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
  END IF;
END $$;

-- Child view uses anon key (no Supabase auth) — allow reads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='Anon can read children') THEN
    CREATE POLICY "Anon can read children" ON public.children FOR SELECT USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- PATCH: rewards table
-- Existing table has parent_id, coin_cost. Our code uses cost and parent_id.
-- Add cost column; relax required columns from future schema.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS cost integer;

-- Make future-schema required columns nullable so simple inserts work
ALTER TABLE public.rewards
  ALTER COLUMN child_id DROP NOT NULL,
  ALTER COLUMN parent_id DROP NOT NULL,
  ALTER COLUMN reward_type DROP NOT NULL,
  ALTER COLUMN coin_cost DROP NOT NULL,
  ALTER COLUMN is_active DROP NOT NULL,
  ALTER COLUMN sort_order DROP NOT NULL;

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rewards' AND policyname='Parents manage own rewards') THEN
    CREATE POLICY "Parents manage own rewards" ON public.rewards FOR ALL
      USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rewards' AND policyname='Anon can read rewards') THEN
    CREATE POLICY "Anon can read rewards" ON public.rewards FOR SELECT USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- NEW: tasks table (distinct from missions — simpler structure for current UI)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   uuid        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  completed  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Parents manage tasks for their children') THEN
    CREATE POLICY "Parents manage tasks for their children" ON public.tasks FOR ALL
      USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = tasks.child_id AND c.parent_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = tasks.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Anon can read tasks') THEN
    CREATE POLICY "Anon can read tasks" ON public.tasks FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Anon can update task completion') THEN
    CREATE POLICY "Anon can update task completion" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- NEW: points_history table (distinct from bt_coin_ledger)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.points_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   uuid        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  change     integer     NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='points_history' AND policyname='Parents manage history for their children') THEN
    CREATE POLICY "Parents manage history for their children" ON public.points_history FOR ALL
      USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = points_history.child_id AND c.parent_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = points_history.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- NEW: notification_settings
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email         text        NOT NULL UNIQUE,
  reward_notifications boolean     NOT NULL DEFAULT true,
  weekly_summary       boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notification_settings' AND policyname='Users manage own notification settings') THEN
    CREATE POLICY "Users manage own notification settings" ON public.notification_settings FOR ALL
      USING (parent_email = auth.email()) WITH CHECK (parent_email = auth.email());
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- NEW: family_onboarding
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.family_onboarding (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_goal           text,
  child_description      text,
  parent_involvement     text,
  motivation_preference  text,
  selected_habits        text[],
  screen_time_preference text,
  routine_timing         text,
  success_definition     text,
  completed_at           timestamptz DEFAULT now(),
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS family_onboarding_parent_id_idx
  ON public.family_onboarding (parent_id);

ALTER TABLE public.family_onboarding ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='family_onboarding' AND policyname='Parents manage own onboarding') THEN
    CREATE POLICY "Parents manage own onboarding" ON public.family_onboarding FOR ALL
      USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- increment_points RPC
-- SECURITY DEFINER = runs as DB owner, bypasses RLS
-- Allows child view (anon) to safely update points
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_points(
  child_id      uuid,
  points_change integer,
  reason        text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.children
    SET points = COALESCE(points, 0) + points_change
    WHERE id = child_id;

  INSERT INTO public.points_history (child_id, change, reason)
    VALUES (child_id, points_change, reason);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer, text) TO anon;
