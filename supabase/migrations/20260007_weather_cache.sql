ALTER TABLE public.family_plans ADD COLUMN IF NOT EXISTS weather_cache jsonb;
ALTER TABLE public.family_plans ADD COLUMN IF NOT EXISTS weather_fetched_at timestamptz;
