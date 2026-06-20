-- SEV-1 FIX: Remove permissive "Anon can read/update" RLS policies
-- Root cause: Supabase OR-evaluates RLS policies — USING (true) overrode
-- parent-scoped policies, allowing any authenticated user to read all families' data.
-- This migration removes all permissive policies and replaces with owner-only access.

-- ─────────────────────────────────────────────────────────────────
-- 1. Drop all permissive wildcard policies
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read children" ON public.children;
DROP POLICY IF EXISTS "Anon can read missions" ON public.missions;
DROP POLICY IF EXISTS "Anon can update mission completion" ON public.missions;
DROP POLICY IF EXISTS "Anon can read wallets" ON public.bt_coin_wallet;
DROP POLICY IF EXISTS "Anon can read rewards" ON public.rewards;

-- ─────────────────────────────────────────────────────────────────
-- 2. Safe mission update policy — requires authenticated parent ownership
--    Child view (/child) uses parent's browser session so auth.uid() resolves.
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'missions'
      AND policyname = 'Owners can update own children missions'
  ) THEN
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
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 3. Revoke anon execute on add_coins
--    Only authenticated sessions (parents) should deduct/award coins.
-- ─────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) FROM anon;
