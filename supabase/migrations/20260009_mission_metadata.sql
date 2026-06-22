-- Add metadata columns to missions for generation tracking
-- CRON_SECRET — set in Vercel environment variables.
-- Vercel automatically sends this as Authorization: Bearer <secret> in cron requests.
-- Generate with: openssl rand -hex 32
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS weather_snapshot jsonb;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS generation_context jsonb;

-- Track daily generation runs (deduplication + audit)
CREATE TABLE IF NOT EXISTS public.mission_generation_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  generated_at  timestamptz DEFAULT now(),
  mission_date  date NOT NULL,
  count         integer NOT NULL,
  generated_by  text NOT NULL DEFAULT 'cron',
  weather_condition text,
  difficulty    text,
  season        text
);
ALTER TABLE public.mission_generation_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS gen_log_child_date_idx ON public.mission_generation_log (child_id, mission_date);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mission_generation_log' AND policyname='Parents read own gen log') THEN
    CREATE POLICY "Parents read own gen log" ON public.mission_generation_log FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = mission_generation_log.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;
GRANT SELECT ON public.mission_generation_log TO authenticated;
GRANT ALL ON public.mission_generation_log TO service_role;
