-- Daily Mission Engine: ensure correct defaults, indexes, and permissions

ALTER TABLE public.missions ALTER COLUMN screen_time_reward SET DEFAULT 5;
ALTER TABLE public.missions ALTER COLUMN category SET DEFAULT 'general';

-- Fast daily lookups by child + date
CREATE INDEX IF NOT EXISTS missions_child_date_idx ON public.missions (child_id, mission_date);

-- Authenticated role needs full access to insert/update/delete missions via service role
GRANT ALL ON public.missions TO authenticated;
GRANT ALL ON public.children TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
