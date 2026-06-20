-- BrightThrive: Adapt app to production schema
-- Philosophy: code adapts to DB, not the reverse.
-- This migration makes ONLY the minimum safe changes required
-- to let the app work with existing production tables (missions,
-- bt_coin_ledger, bt_coin_wallet, reward_redemptions, family_plans).
--
-- What this does NOT do:
--   - Create tasks, points_history, or any parallel tables
--   - Drop or rename any existing column
--   - Modify any existing data
--
-- Run in Supabase SQL Editor. Safe to re-run.

-- ─────────────────────────────────────────────────────────────────
-- 1. Relax NOT NULL constraints on children
-- UI doesn't collect pin or difficulty_level at creation time.
-- age is shown as optional. Existing rows are unaffected.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.children ALTER COLUMN age DROP NOT NULL;
ALTER TABLE public.children ALTER COLUMN pin DROP NOT NULL;
ALTER TABLE public.children ALTER COLUMN difficulty_level DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. Relax child_id on rewards
-- App creates family-wide rewards (any child can redeem).
-- Production schema treats rewards as child-specific.
-- NULL child_id = family-level reward.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.rewards ALTER COLUMN child_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 3. add_coins RPC
-- Atomically updates bt_coin_wallet and logs to bt_coin_ledger.
-- SECURITY DEFINER allows child view (anon) to safely update balance.
-- Replaces the planned increment_points function entirely.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_coins(
  p_child_id    uuid,
  p_amount      integer,
  p_type        text,
  p_description text    DEFAULT NULL,
  p_mission_id  uuid    DEFAULT NULL,
  p_reward_id   uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
GRANT EXECUTE ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) TO anon;

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS on tables the app now reads/writes
-- All policies use IF NOT EXISTS guards — safe to re-run.
-- ─────────────────────────────────────────────────────────────────

-- missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='missions' AND policyname='Parents manage missions for their children') THEN
    CREATE POLICY "Parents manage missions for their children" ON public.missions FOR ALL
      USING  (EXISTS (SELECT 1 FROM public.children c WHERE c.id = missions.child_id AND c.parent_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = missions.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='missions' AND policyname='Anon can read missions') THEN
    CREATE POLICY "Anon can read missions" ON public.missions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='missions' AND policyname='Anon can update mission completion') THEN
    CREATE POLICY "Anon can update mission completion" ON public.missions FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- bt_coin_wallet
ALTER TABLE public.bt_coin_wallet ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bt_coin_wallet' AND policyname='Parents read own children wallets') THEN
    CREATE POLICY "Parents read own children wallets" ON public.bt_coin_wallet FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = bt_coin_wallet.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bt_coin_wallet' AND policyname='Anon can read wallets') THEN
    CREATE POLICY "Anon can read wallets" ON public.bt_coin_wallet FOR SELECT USING (true);
  END IF;
END $$;

-- bt_coin_ledger
ALTER TABLE public.bt_coin_ledger ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bt_coin_ledger' AND policyname='Parents read own children ledger') THEN
    CREATE POLICY "Parents read own children ledger" ON public.bt_coin_ledger FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = bt_coin_ledger.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;

-- reward_redemptions
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reward_redemptions' AND policyname='Parents manage own redemptions') THEN
    CREATE POLICY "Parents manage own redemptions" ON public.reward_redemptions FOR ALL
      USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
  END IF;
END $$;

-- children (ensure RLS is on with parent policy)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='Parents manage own children') THEN
    CREATE POLICY "Parents manage own children" ON public.children FOR ALL
      USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='Anon can read children') THEN
    CREATE POLICY "Anon can read children" ON public.children FOR SELECT USING (true);
  END IF;
END $$;

-- rewards
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

-- family_plans
ALTER TABLE public.family_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='family_plans' AND policyname='Parents manage own plan') THEN
    CREATE POLICY "Parents manage own plan" ON public.family_plans FOR ALL
      USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
  END IF;
END $$;
