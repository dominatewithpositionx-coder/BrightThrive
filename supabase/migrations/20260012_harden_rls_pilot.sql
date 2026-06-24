-- 20260012 — Pre-pilot RLS hardening
--
-- Context: Migration 20260004 removed permissive anon policies from children,
-- missions, bt_coin_wallet, and rewards. However, the tasks and streaks tables
-- still carry anon read/write policies from earlier migrations. The Kid View
-- (/child) now runs under the parent's Supabase auth session (not anon), so
-- anon access to these tables is never needed.
--
-- This migration also revokes anon execute on increment_points, which was
-- granted in 20260002 and never revoked (add_coins had its anon grant removed
-- in 20260004, but increment_points was missed).
--
-- Safe to re-run: all DROP POLICY / REVOKE statements are idempotent.

-- ─────────────────────────────────────────────────────────────────
-- 1. Remove permissive anon policies on tasks
--    (tasks is a legacy table; production uses missions)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anon can update task completion" ON public.tasks;

-- ─────────────────────────────────────────────────────────────────
-- 2. Remove permissive anon policies on streaks
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read streaks" ON public.streaks;
DROP POLICY IF EXISTS "Anon can insert streaks" ON public.streaks;
DROP POLICY IF EXISTS "Anon can update streaks" ON public.streaks;

-- ─────────────────────────────────────────────────────────────────
-- 3. Revoke anon execute on increment_points
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, integer, text) FROM anon;
EXCEPTION WHEN undefined_function THEN
  NULL; -- function may not exist in all environments
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 4. Add owner-scoped streak policy so the Kid View (parent session)
--    can still read and update streaks for its own children.
--    The existing "Parents manage own children streaks" (ALL) policy
--    from 20260008 handles this if it exists; this is a safety net.
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'streaks'
      AND policyname = 'Parents manage own children streaks'
  ) THEN
    CREATE POLICY "Parents manage own children streaks" ON public.streaks FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.children c
        WHERE c.id = streaks.child_id AND c.parent_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.children c
        WHERE c.id = streaks.child_id AND c.parent_id = auth.uid()
      ));
  END IF;
END $$;

-- Grant authenticated role on streaks (in case it was missed in earlier grants)
GRANT ALL ON public.streaks TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- TEST DATA CLEANUP (manual — do NOT run automatically at runtime)
--
-- Before pilot onboarding, run these in Supabase SQL Editor to identify
-- and remove test-account data. Always run the SELECT first.
--
-- Identify test children:
--   SELECT c.id, c.name, u.email, c.created_at
--   FROM public.children c JOIN auth.users u ON u.id = c.parent_id
--   WHERE c.name IN ('Nova', 'August', 'Pilot Test Child')
--   ORDER BY c.created_at;
--
-- Delete test children (cascades to missions, wallet, ledger, streaks):
--   DELETE FROM public.children
--   WHERE name IN ('Nova', 'August', 'Pilot Test Child');
--
-- Delete test rewards:
--   DELETE FROM public.rewards
--   WHERE title ILIKE '%10 minutes extra screen time%'
--      OR title ILIKE '%test%';
--
-- Delete test waitlist entries:
--   DELETE FROM public.waitlist
--   WHERE email ILIKE '%test%'
--      OR email ILIKE '%@example.com%';
-- ─────────────────────────────────────────────────────────────────
