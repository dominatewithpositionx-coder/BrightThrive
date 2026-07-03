-- 20260019 — Fix add_coins: handle ledger unique constraint conflict
--
-- Root cause: bt_coin_ledger has a unique constraint on mission_id (or child_id+mission_id).
-- When a mission is completed, the first add_coins call succeeds.
-- Any subsequent call for the same mission_id (retry, page reload, double-tap) hits the
-- unique constraint → PostgreSQL raises 23505 → PostgREST returns HTTP 409 → coins not awarded.
--
-- Fix:
--   1. Wallet upsert: use INSERT ... ON CONFLICT (child_id) DO UPDATE so wallet row is
--      always created/updated even if no ledger row can be inserted.
--   2. Ledger insert: use ON CONFLICT DO NOTHING so duplicate mission entries are silently
--      skipped rather than raising an error. A duplicate means coins were already awarded.
--   3. Guard: only update wallet balance if no ledger entry exists yet for this mission
--      (prevents double-awarding coins when a mission is re-completed after page reload).
--
-- Safe to re-run: CREATE OR REPLACE replaces the function in-place.

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
DECLARE
  v_already_logged boolean := false;
BEGIN
  -- If this is a mission-related award, check whether we already logged it.
  -- This prevents double-awarding if the same mission_id is submitted twice.
  IF p_mission_id IS NOT NULL AND p_amount > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.bt_coin_ledger
      WHERE mission_id = p_mission_id AND amount > 0
    ) INTO v_already_logged;
  END IF;

  -- Only touch the wallet if this is a new award (or a deduction / non-mission credit).
  IF NOT v_already_logged THEN
    INSERT INTO public.bt_coin_wallet (child_id, balance, lifetime_earned, updated_at)
    VALUES (
      p_child_id,
      GREATEST(0, p_amount),
      GREATEST(0, p_amount),
      now()
    )
    ON CONFLICT (child_id) DO UPDATE SET
      balance         = GREATEST(0, public.bt_coin_wallet.balance + p_amount),
      lifetime_earned = public.bt_coin_wallet.lifetime_earned + GREATEST(0, p_amount),
      updated_at      = now();
  END IF;

  -- Always attempt the ledger insert; ON CONFLICT skips silently if already logged.
  INSERT INTO public.bt_coin_ledger (child_id, amount, type, description, mission_id, reward_id)
  VALUES (p_child_id, p_amount, p_type, p_description, p_mission_id, p_reward_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Re-grant execute (SECURITY DEFINER function, authenticated callers only)
GRANT EXECUTE ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) TO authenticated;
