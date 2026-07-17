-- ============================================================
-- Migration: 20260023_family_win_01.sql
-- Purpose:   Growth Superpowers V1 + Parent Recognition + Child Reflection
-- Sprint:    Family Win #1 — Parent notices effort. Child feels proud.
-- Reversible: YES — all columns nullable; rollback drops them (see EOF)
-- ============================================================

-- 1. Growth Superpower identity tag
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS identity_tag text
  CHECK (
    identity_tag IS NULL OR
    identity_tag = ANY(ARRAY[
      'boundary_builder',
      'focus_finder',
      'self_soother',
      'autonomy_builder',
      'team_player'
    ])
  );

-- 2. Child reflection — single emoji or short token, skippable
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS reflection_emoji text
  CHECK (reflection_emoji IS NULL OR char_length(reflection_emoji) <= 8);

-- 3. Parent recognition message — max 200 chars
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS parent_message text
  CHECK (parent_message IS NULL OR char_length(parent_message) <= 200);

-- 4. When the parent sent the recognition
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS parent_message_at timestamptz;

-- 5. Cross-device seen state — DB column, not localStorage
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS parent_message_seen_at timestamptz;

-- 6. Partial index for unseen recognition query (child pre-session check)
CREATE INDEX IF NOT EXISTS missions_unseen_recognition_idx
  ON public.missions (child_id, parent_message_at)
  WHERE parent_message IS NOT NULL AND parent_message_seen_at IS NULL;

-- 7. Partial index for Proud Moments future view
CREATE INDEX IF NOT EXISTS missions_proud_moments_idx
  ON public.missions (child_id, mission_date DESC)
  WHERE is_completed = true AND parent_message IS NOT NULL;

-- Rollback reference (do NOT run with the migration):
-- ALTER TABLE public.missions
--   DROP COLUMN IF EXISTS identity_tag,
--   DROP COLUMN IF EXISTS reflection_emoji,
--   DROP COLUMN IF EXISTS parent_message,
--   DROP COLUMN IF EXISTS parent_message_at,
--   DROP COLUMN IF EXISTS parent_message_seen_at;
-- DROP INDEX IF EXISTS missions_unseen_recognition_idx;
-- DROP INDEX IF EXISTS missions_proud_moments_idx;
