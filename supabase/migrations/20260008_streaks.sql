CREATE TABLE IF NOT EXISTS public.streaks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  current_streak  integer NOT NULL DEFAULT 0,
  longest_streak  integer NOT NULL DEFAULT 0,
  last_active_date date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS streaks_child_id_idx ON public.streaks (child_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='streaks' AND policyname='Parents manage own children streaks') THEN
    CREATE POLICY "Parents manage own children streaks" ON public.streaks FOR ALL
      USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = streaks.child_id AND c.parent_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = streaks.child_id AND c.parent_id = auth.uid()));
  END IF;
END $$;

-- Child view runs as anon and needs to read/update its own streak row.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='streaks' AND policyname='Anon can read streaks') THEN
    CREATE POLICY "Anon can read streaks" ON public.streaks FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='streaks' AND policyname='Anon can upsert streaks') THEN
    CREATE POLICY "Anon can insert streaks" ON public.streaks FOR INSERT WITH CHECK (true);
    CREATE POLICY "Anon can update streaks" ON public.streaks FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.streaks TO anon;
