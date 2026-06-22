-- Fix: authenticated role was missing table-level grants on children (and related tables).
-- Postgres returns "permission denied for table X" before RLS even runs when the role
-- lacks the basic privilege. This is separate from RLS policies.
--
-- Run this in Supabase Dashboard → SQL Editor.

GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.missions TO authenticated;
GRANT ALL ON public.rewards TO authenticated;
GRANT ALL ON public.bt_coin_wallet TO authenticated;
GRANT ALL ON public.bt_coin_ledger TO authenticated;
GRANT ALL ON public.reward_redemptions TO authenticated;
GRANT ALL ON public.points_history TO authenticated;
GRANT ALL ON public.notification_settings TO authenticated;
GRANT ALL ON public.family_plans TO authenticated;
GRANT ALL ON public.family_onboarding TO authenticated;

-- Ensure sequences are also grantable (needed for serial/identity PKs on insert)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
