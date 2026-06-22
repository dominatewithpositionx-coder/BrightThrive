-- 20260010 — Ensure production has the columns and grants the app relies on.
--
-- IMPORTANT: This migration intentionally does NOT re-create the permissive
-- "Anon can read ..." RLS policies that 20260004 removed as a SEV-1 data-leak
-- fix. The Kid View (/child) is opened from the parent dashboard and shares the
-- parent's Supabase session, so owner-scoped RLS (auth.uid()) already applies.
-- Server-side mission generation uses the service role, which bypasses RLS
-- safely without weakening it. Safe to re-run.

-- ─────────────────────────────────────────────────────────────────
-- 1. Mission metadata columns from 20260009 (idempotent).
--    Dashboard/child queries select `generated_by`; a missing column makes
--    the whole query error and return zero rows.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS weather_snapshot jsonb;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS generation_context jsonb;

-- ─────────────────────────────────────────────────────────────────
-- 2. Table-level grants for authenticated parents (separate from RLS).
--    Missing grants cause "permission denied for table X" before RLS runs.
-- ─────────────────────────────────────────────────────────────────
GRANT ALL ON public.missions TO authenticated;
GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.family_plans TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 3. Sequences must be grantable for inserts with serial/identity PKs.
-- ─────────────────────────────────────────────────────────────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
