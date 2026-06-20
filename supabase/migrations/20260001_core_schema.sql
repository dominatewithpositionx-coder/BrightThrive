-- BrightThrive: Core schema migration
-- Run in Supabase Dashboard → SQL Editor → paste all → Run
-- Safe to re-run: uses CREATE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS

-- ─────────────────────────────────────────────
-- CHILDREN (patch existing table)
-- ─────────────────────────────────────────────

-- Add user_id FK (parent association, required for RLS)
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make age nullable (code passes null when age not provided)
ALTER TABLE public.children
  ALTER COLUMN age DROP NOT NULL;

-- Give screen_time_limit a default so it's never required
ALTER TABLE public.children
  ALTER COLUMN screen_time_limit SET DEFAULT 60,
  ALTER COLUMN screen_time_limit DROP NOT NULL;

-- Row Level Security
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'children' AND policyname = 'Parents manage own children'
  ) THEN
    CREATE POLICY "Parents manage own children"
      ON public.children FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow anon/unauthenticated reads so the child view (PIN-protected, no Supabase auth) can load profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'children' AND policyname = 'Anon can read children'
  ) THEN
    CREATE POLICY "Anon can read children"
      ON public.children FOR SELECT
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   uuid        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  completed  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Parents manage tasks for their children'
  ) THEN
    CREATE POLICY "Parents manage tasks for their children"
      ON public.tasks FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.children c
          WHERE c.id = tasks.child_id AND c.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.children c
          WHERE c.id = tasks.child_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Child view (no Supabase auth): allow anon to read and update task completion
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Anon can read tasks'
  ) THEN
    CREATE POLICY "Anon can read tasks"
      ON public.tasks FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Anon can update task completion'
  ) THEN
    CREATE POLICY "Anon can update task completion"
      ON public.tasks FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- REWARDS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rewards (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  cost       integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rewards' AND policyname = 'Parents manage own rewards'
  ) THEN
    CREATE POLICY "Parents manage own rewards"
      ON public.rewards FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Child view: allow anon to read rewards (to display redeem options)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rewards' AND policyname = 'Anon can read rewards'
  ) THEN
    CREATE POLICY "Anon can read rewards"
      ON public.rewards FOR SELECT
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- POINTS HISTORY
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.points_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   uuid        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  change     integer     NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'points_history' AND policyname = 'Parents manage history for their children'
  ) THEN
    CREATE POLICY "Parents manage history for their children"
      ON public.points_history FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.children c
          WHERE c.id = points_history.child_id AND c.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.children c
          WHERE c.id = points_history.child_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- NOTIFICATION SETTINGS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email          text        NOT NULL UNIQUE,
  reward_notifications  boolean     NOT NULL DEFAULT true,
  weekly_summary        boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users manage own notification settings'
  ) THEN
    CREATE POLICY "Users manage own notification settings"
      ON public.notification_settings FOR ALL
      USING (parent_email = auth.email())
      WITH CHECK (parent_email = auth.email());
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- increment_points RPC
-- ─────────────────────────────────────────────
-- SECURITY DEFINER so it runs as DB owner, bypassing RLS
-- This lets the child view (anon) call it safely

CREATE OR REPLACE FUNCTION public.increment_points(
  child_id     uuid,
  points_change integer,
  reason       text DEFAULT NULL
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

-- Grant execute to both authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer, text) TO anon;
