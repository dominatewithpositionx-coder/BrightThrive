-- Adds structured geocoded fields to children.
-- Existing location_label, location_name, location_city values are preserved.
-- All new columns are nullable; populated only when a parent selects a city
-- from the autocomplete after this migration is applied.
-- location_timezone is intentionally omitted from autocomplete results because
-- Photon does not return timezone data and no reliable resolver is wired up yet.

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS location_region   text,
  ADD COLUMN IF NOT EXISTS location_country  text,
  ADD COLUMN IF NOT EXISTS location_lat      numeric(9, 6),
  ADD COLUMN IF NOT EXISTS location_lon      numeric(9, 6),
  ADD COLUMN IF NOT EXISTS location_timezone text;

COMMENT ON COLUMN children.location_region   IS 'Province, state, or county from geocoder';
COMMENT ON COLUMN children.location_country  IS 'Country full name from geocoder';
COMMENT ON COLUMN children.location_lat      IS 'Latitude (city centroid) from geocoder';
COMMENT ON COLUMN children.location_lon      IS 'Longitude (city centroid) from geocoder';
COMMENT ON COLUMN children.location_timezone IS 'IANA timezone string; null until resolved separately';

NOTIFY pgrst, 'reload schema';
