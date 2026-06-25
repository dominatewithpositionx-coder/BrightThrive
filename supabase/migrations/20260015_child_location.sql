-- Add per-child location fields so AI missions can be tailored to the child's environment
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS location_label text DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS location_name  text,
  ADD COLUMN IF NOT EXISTS location_city  text;

NOTIFY pgrst, 'reload schema';
