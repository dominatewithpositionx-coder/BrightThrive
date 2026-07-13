-- add_coins — v5 (final, replaces 20260019)
--
-- Full authorization model (all guards fire before any write):
--   • Zero amounts: rejected unconditionally.
--   • All calls: caller must own p_child_id via children.parent_id = auth.uid().
--   • Positive amounts (mission awards):
--       - p_mission_id required.
--       - p_amount must be exactly 10 (missions table has no coin_reward column;
--         10 is the sole authorised value — client cannot choose an arbitrary figure).
--       - Mission must exist, belong to p_child_id, and have is_completed = true.
--   • Negative amounts (reward deductions):
--       - p_reward_id required.
--       - p_mission_id must be NULL (a single call cannot be both a mission award
--         and a reward deduction).
--       - Reward must exist, belong to auth.uid(), and be active (is_active = true).
--       - ABS(p_amount) must equal reward.coin_cost exactly.
--       - Wallet row is locked with SELECT … FOR UPDATE before the balance check
--         so two simultaneous approvals cannot both pass the same balance.
--       - If no wallet row exists the balance is treated as 0 and the deduction
--         is rejected — no silent floor.
--
-- Race safety:
--   Positive mission awards: partial unique index on (child_id, mission_id)
--     WHERE mission_id IS NOT NULL AND amount > 0 — create it before running
--     this file (see Step 1 below).
--   Negative reward deductions: FOR UPDATE row lock on bt_coin_wallet serialises
--     concurrent deductions for the same child.
--
-- Application call-site changes shipped in the same branch:
--   • app/dashboard/page.tsx — handleApproval: hard abort when coin_cost or
--     reward_id absent; removed ?? 0 fallback.
--   • app/dashboard/tasks/page.tsx — toggleTaskCompletion: add_coins call removed.
--     Coin wallet mutations belong exclusively to the child completion flow.
--
-- Prerequisites (run in this order in Supabase SQL editor):
--
--   Step 0 — duplicate-check query (read-only):
--     SELECT child_id, mission_id, COUNT(*)
--     FROM public.bt_coin_ledger
--     WHERE mission_id IS NOT NULL AND amount > 0
--     GROUP BY child_id, mission_id
--     HAVING COUNT(*) > 1;
--
--   Step 1 — partial unique index (only if Step 0 returns zero rows):
--     CREATE UNIQUE INDEX IF NOT EXISTS bt_coin_ledger_unique_positive_mission_award
--       ON public.bt_coin_ledger (child_id, mission_id)
--       WHERE mission_id IS NOT NULL AND amount > 0;
--
--   Step 2 — this file.
--
-- Safe to re-run: CREATE OR REPLACE is atomic.
-- Does not modify existing wallet balances or delete existing ledger rows.

CREATE OR REPLACE FUNCTION public.add_coins(
  p_child_id    uuid,
  p_amount      integer,
  p_type        text,
  p_description text  DEFAULT NULL,
  p_mission_id  uuid  DEFAULT NULL,
  p_reward_id   uuid  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_cost     integer;
  v_wallet_balance  integer;
  v_rows_affected   integer := 0;
  v_ledger_inserted boolean := false;
BEGIN

  -- ── 1. Reject zero ────────────────────────────────────────────────────────
  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Coin amount cannot be zero'
      USING ERRCODE = '22023';
  END IF;

  -- ── 2. Child ownership guard ──────────────────────────────────────────────
  -- auth.uid() reads the JWT sub of the calling session even inside
  -- SECURITY DEFINER. A NULL uid (unauthenticated caller) fails this check.
  IF NOT EXISTS (
    SELECT 1 FROM public.children
    WHERE id        = p_child_id
      AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden: caller does not own child %', p_child_id
      USING ERRCODE = '42501';
  END IF;

  -- ── 3. Positive-amount guards (mission awards) ────────────────────────────
  IF p_amount > 0 THEN

    -- 3a. All positive credits must reference a mission.
    IF p_mission_id IS NULL THEN
      RAISE EXCEPTION 'Positive coin awards require a mission_id'
        USING ERRCODE = '22023';
    END IF;

    -- 3b. Exactly 10 coins per mission.
    IF p_amount <> 10 THEN
      RAISE EXCEPTION 'Invalid coin amount % for mission award; expected 10', p_amount
        USING ERRCODE = '22023';
    END IF;

    -- 3c. Mission must exist, belong to this child, and be marked complete.
    IF NOT EXISTS (
      SELECT 1 FROM public.missions
      WHERE id           = p_mission_id
        AND child_id     = p_child_id
        AND is_completed = true
    ) THEN
      RAISE EXCEPTION 'Mission % is not completed or does not belong to child %',
        p_mission_id, p_child_id
        USING ERRCODE = '23514';
    END IF;

  END IF;

  -- ── 4. Negative-amount guards (reward deductions) ─────────────────────────
  IF p_amount < 0 THEN

    -- 4a. Deductions must not also reference a mission.
    --     A single call cannot be both a mission award and a reward deduction.
    IF p_mission_id IS NOT NULL THEN
      RAISE EXCEPTION 'Negative coin deductions must not include a mission_id'
        USING ERRCODE = '22023';
    END IF;

    -- 4b. All deductions must reference a reward.
    IF p_reward_id IS NULL THEN
      RAISE EXCEPTION 'Negative coin deductions require a reward_id'
        USING ERRCODE = '22023';
    END IF;

    -- 4c. Reward must exist, belong to the calling parent, and be active.
    --     Canonical cost column: rewards.coin_cost (migration 20260016).
    --     is_active confirmed in production (migration 20260016, DEFAULT true).
    SELECT coin_cost INTO v_reward_cost
    FROM public.rewards
    WHERE id        = p_reward_id
      AND parent_id = auth.uid()
      AND is_active = true;

    IF v_reward_cost IS NULL THEN
      RAISE EXCEPTION 'Forbidden: reward % does not exist, is inactive, or does not belong to caller',
        p_reward_id
        USING ERRCODE = '42501';
    END IF;

    -- 4d. Deduction amount must exactly match the reward's authorised cost.
    IF ABS(p_amount) <> v_reward_cost THEN
      RAISE EXCEPTION 'Deduction amount % does not match reward cost % for reward %',
        ABS(p_amount), v_reward_cost, p_reward_id
        USING ERRCODE = '22023';
    END IF;

    -- 4e. Lock the wallet row before checking the balance.
    --     FOR UPDATE serialises concurrent deductions for the same child so
    --     two simultaneous reward approvals cannot both read the same balance
    --     and both pass the affordability check.
    --     If no wallet row exists, INTO leaves v_wallet_balance as NULL,
    --     which is treated as 0 — the deduction is then rejected below.
    SELECT COALESCE(balance, 0) INTO v_wallet_balance
    FROM public.bt_coin_wallet
    WHERE child_id = p_child_id
    FOR UPDATE;

    -- 4f. Child must have sufficient balance.
    --     Do not silently floor a reward deduction to zero.
    IF COALESCE(v_wallet_balance, 0) < v_reward_cost THEN
      RAISE EXCEPTION 'Insufficient balance: child % has % coins, reward costs %',
        p_child_id, COALESCE(v_wallet_balance, 0), v_reward_cost
        USING ERRCODE = '55000';
    END IF;

  END IF;

  -- ── 5. Ledger insert ──────────────────────────────────────────────────────
  IF p_mission_id IS NOT NULL AND p_amount > 0 THEN
    -- Race-safe path for positive mission awards.
    -- ON CONFLICT predicate must exactly match the partial unique index:
    --   CREATE UNIQUE INDEX bt_coin_ledger_unique_positive_mission_award
    --     ON public.bt_coin_ledger (child_id, mission_id)
    --     WHERE mission_id IS NOT NULL AND amount > 0;
    -- ROW_COUNT = 1 → this call won the race; ROW_COUNT = 0 → duplicate suppressed.
    INSERT INTO public.bt_coin_ledger
      (child_id, amount, type, description, mission_id, reward_id)
    VALUES
      (p_child_id, p_amount, p_type, p_description, p_mission_id, p_reward_id)
    ON CONFLICT (child_id, mission_id)
      WHERE mission_id IS NOT NULL AND amount > 0
    DO NOTHING;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    v_ledger_inserted := (v_rows_affected > 0);

  ELSE
    -- Negative reward deduction: always inserts; no race-dedup applies.
    -- Wallet row is already locked by guard 4e so concurrent deductions are serialised.
    INSERT INTO public.bt_coin_ledger
      (child_id, amount, type, description, mission_id, reward_id)
    VALUES
      (p_child_id, p_amount, p_type, p_description, p_mission_id, p_reward_id);

    v_ledger_inserted := true;
  END IF;

  -- ── 6. Wallet UPSERT — only if a new ledger row was created ──────────────
  -- No new ledger row (duplicate mission suppressed) → no wallet change.
  --
  -- INSERT semantics (wallet does not yet exist):
  --   balance         = GREATEST(0, p_amount)  — first-time negative → 0
  --   lifetime_earned = GREATEST(0, p_amount)  — never starts negative
  --
  -- ON CONFLICT DO UPDATE semantics (wallet already exists):
  --   balance         = GREATEST(0, current + p_amount)
  --                     guard 4f ensures balance >= cost before this point;
  --                     GREATEST(0, …) is a safety floor, not the primary guard.
  --   lifetime_earned = current + GREATEST(0, p_amount)
  --                     only increases for positive amounts; never reduced.
  --
  -- Two simultaneous first-time awards race to the UNIQUE child_id constraint;
  -- exactly one INSERT wins, the other becomes the DO UPDATE — no violation raised.
  -- For deductions the wallet row is already locked (guard 4e); the DO UPDATE
  -- here is the only writer until the transaction commits.
  IF v_ledger_inserted THEN
    INSERT INTO public.bt_coin_wallet
      (child_id, balance, lifetime_earned, updated_at)
    VALUES
      (p_child_id,
       GREATEST(0, p_amount),
       GREATEST(0, p_amount),
       now())
    ON CONFLICT (child_id) DO UPDATE SET
      balance         = GREATEST(0, public.bt_coin_wallet.balance + p_amount),
      lifetime_earned = public.bt_coin_wallet.lifetime_earned + GREATEST(0, p_amount),
      updated_at      = now();
  END IF;

END;
$$;

-- ── Permissions ───────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_coins(uuid, integer, text, text, uuid, uuid) TO authenticated;
