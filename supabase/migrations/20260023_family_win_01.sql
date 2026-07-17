-- Migration: 20260023_family_win_01.sql
-- Family Win #1: Growth Superpowers, Parent Recognition, Child Reflection
-- All changes are additive. All new columns are nullable. Safe to run on live production.

BEGIN;

-- 1. Superpower identity tag — set at mission INSERT from category mapping
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS identity_tag text
  CHECK (
    identity_tag IS NULL
    OR identity_tag = ANY(ARRAY[
      'boundary_builder',
      'focus_finder',
      'self_soother',
      'autonomy_builder',
      'team_player'
    ])
  );

-- 2. Child reflection answer — '✅' (yes) or '🤔' (unsure), NULL if skipped
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS reflection_emoji text
  CHECK (reflection_emoji IS NULL OR char_length(reflection_emoji) <= 8);

-- 3. Parent recognition message — written by parent, max 200 chars
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS parent_message text
  CHECK (parent_message IS NULL OR char_length(parent_message) <= 200);

-- 4. Timestamp when parent sent the recognition message
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS parent_message_at timestamptz;

-- 5. Timestamp when child opened the Proud Moment — stored in DB for cross-device reliability
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS parent_message_seen_at timestamptz;

-- 6. Partial index: fast lookup of missions with an unseen parent message
CREATE INDEX IF NOT EXISTS missions_unseen_recognition_idx
  ON public.missions (child_id, parent_message_at)
  WHERE parent_message IS NOT NULL
    AND parent_message_seen_at IS NULL;

-- 7. Partial index: future Proud Moments history view
CREATE INDEX IF NOT EXISTS missions_proud_moments_idx
  ON public.missions (child_id, mission_date DESC)
  WHERE is_completed = true
    AND parent_message IS NOT NULL;

COMMIT;

-- Rollback (do NOT run with the migration above):
-- BEGIN;
-- ALTER TABLE public.missions
--   DROP COLUMN IF EXISTS identity_tag,
--   DROP COLUMN IF EXISTS reflection_emoji,
--   DROP COLUMN IF EXISTS parent_message,
--   DROP COLUMN IF EXISTS parent_message_at,
--   DROP COLUMN IF EXISTS parent_message_seen_at;
-- DROP INDEX IF EXISTS missions_unseen_recognition_idx;
-- DROP INDEX IF EXISTS missions_proud_moments_idx;
-- COMMIT;
