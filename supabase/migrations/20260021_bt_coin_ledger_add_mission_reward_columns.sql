-- 20260021 — Add mission_id and reward_id columns to bt_coin_ledger
--
-- Root cause of production coin-award failure:
--   bt_coin_ledger was created directly in the Supabase dashboard (not via a migration),
--   so it never received the mission_id and reward_id columns that the add_coins() function
--   references. While p_mission_id was always NULL in the old client code, the SELECT and INSERT
--   inside add_coins() that reference these columns were effectively dead code — PostgreSQL
--   validates column references at execution time, not at CREATE FUNCTION time, so the
--   function compiled successfully despite the missing columns.
--
--   Once the client started passing a real UUID as p_mission_id (migration 20260019 dedup guard),
--   the SELECT inside the function executed for the first time and hit error 42703 on every call.
--
-- Diagnostic query (run in Supabase SQL editor before applying this migration):
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'bt_coin_ledger'
--   ORDER BY ordinal_position;
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS is idempotent.

ALTER TABLE public.bt_coin_ledger
  ADD COLUMN IF NOT EXISTS mission_id uuid,
  ADD COLUMN IF NOT EXISTS reward_id  uuid;

-- Index to support the dedup-guard SELECT in add_coins():
--   WHERE mission_id = p_mission_id AND amount > 0
CREATE INDEX IF NOT EXISTS bt_coin_ledger_mission_id_idx
  ON public.bt_coin_ledger (mission_id)
  WHERE mission_id IS NOT NULL;
