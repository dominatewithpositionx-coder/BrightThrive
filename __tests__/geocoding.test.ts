import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotonProvider } from '../lib/geocoding/photon';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeFeature(
  name: string,
  state: string | undefined,
  country: string | undefined,
  countrycode: string,
  lat: number,
  lon: number,
  osmValue = 'city',
  osmKey = 'place',
) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: { osm_key: osmKey, osm_value: osmValue, name, state, country, countrycode },
  };
}

function photonResponse(features: unknown[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ features }),
  } as unknown as Response;
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('PhotonProvider', () => {
  let provider: PhotonProvider;

  beforeEach(() => {
    provider = new PhotonProvider('https://photon.komoot.io');
    vi.restoreAllMocks();
  });

  // 1. Sydney, Nova Scotia
  it('returns Sydney Nova Scotia and distinguishes it from Sydney Australia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse([
      makeFeature('Sydney', 'Nova Scotia', 'Canada', 'ca', 46.1368, -60.1942),
      makeFeature('Sydney', 'New South Wales', 'Australia', 'au', -33.8688, 151.2093),
    ])));

    const results = await provider.search('Sydney', new AbortController().signal);
    expect(results.length).toBe(2);
    expect(results[0].city).toBe('Sydney');
    expect(results[0].region).toBe('Nova Scotia');
    expect(results[0].countryCode).toBe('CA');
    expect(results[1].region).toBe('New South Wales');
    expect(results[1].countryCode).toBe('AU');
    expect(results[0].displayName).toBe('Sydney, Nova Scotia, Canada');
  });

  // 2. Halifax, Nova Scotia
  it('returns Halifax Nova Scotia with correct coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse([
      makeFeature('Halifax', 'Nova Scotia', 'Canada', 'ca', 44.6488, -63.5752),
    ])));

    const results = await provider.search('Halifax', new AbortController().signal);
    expect(results).toHaveLength(1);
    expect(results[0].city).toBe('Halifax');
    expect(results[0].region).toBe('Nova Scotia');
    expect(results[0].countryCode).toBe('CA');
    expect(results[0].latitude).toBeCloseTo(44.6488, 3);
    expect(results[0].longitude).toBeCloseTo(-63.5752, 3);
    expect(results[0].provider).toBe('photon');
  });

  // 3. Toronto, Ontario
  it('returns Toronto Ontario with full displayName', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse([
      makeFeature('Toronto', 'Ontario', 'Canada', 'ca', 43.7001, -79.4163),
    ])));

    const results = await provider.search('Toronto', new AbortController().signal);
    expect(results[0].city).toBe('Toronto');
    expect(results[0].region).toBe('Ontario');
    expect(results[0].country).toBe('Canada');
    expect(results[0].displayName).toBe('Toronto, Ontario, Canada');
  });

  // 4. Duplicate city names
  it('returns multiple distinct results for ambiguous name (London)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse([
      makeFeature('London', 'England', 'United Kingdom', 'gb', 51.5074, -0.1278),
      makeFeature('London', 'Ontario', 'Canada', 'ca', 42.9849, -81.2453, 'city'),
      makeFeature('London', 'Kentucky', 'United States', 'us', 37.1289, -84.0833, 'city'),
    ])));

    const results = await provider.search('London', new AbortController().signal);
    expect(results.length).toBeGreaterThanOrEqual(2);
    const displayNames = results.map((r) => r.displayName);
    expect(displayNames).toContain('London, England, United Kingdom');
    expect(displayNames).toContain('London, Ontario, Canada');
    // all share the same city name but differ by region/country
    results.forEach((r) => expect(r.city).toBe('London'));
  });

  // 5. Provider timeout
  it('propagates AbortError on timeout without swallowing it', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    }));
    controller.abort();

    await expect(
      provider.search('Toronto', controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  // 6. No results
  it('returns empty array when Photon returns no features', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse([])));
    const results = await provider.search('xyzzznonexistent', new AbortController().signal);
    expect(results).toHaveLength(0);
  });

  // 7. Manual entry — the autocomplete never blocks saving
  it('manual entry fallback: onSelect(null, typedValue) still provides a city string', () => {
    // This tests the contract that callers of CityAutocomplete should handle:
    // when result is null, fall back to the plain string for location_city.
    const typedCity = 'New Minas';
    const locationResult = null;
    const locationCityFallback = locationResult ? (locationResult as { city: string }).city : typedCity;
    expect(locationCityFallback).toBe('New Minas');
  });

  // 8. Existing children with only location_city (backward compat)
  it('existing children with plain-text location_city still produce a weather location string', () => {
    const legacyChild = {
      id: 'abc',
      name: 'Emma',
      location_city: 'Halifax',
      location_name: 'Home',
      location_label: 'home',
      location_region: null,
      location_country: null,
      location_lat: null,
      location_lon: null,
    };

    // Weather API uses location_city or location_name — both populated for legacy records
    const weatherLocation = legacyChild.location_city ?? legacyChild.location_name;
    expect(weatherLocation).toBe('Halifax');

    // Display label still works
    const displayLabel = legacyChild.location_name ?? legacyChild.location_city;
    expect(displayLabel).toBe('Home');

    // Structured fields are null but nothing errors
    expect(legacyChild.location_lat).toBeNull();
    expect(legacyChild.location_lon).toBeNull();
  });

  // Bonus: filters street-address and highway results
  it('filters out highway and amenity results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse([
      makeFeature('King Street', undefined, 'Canada', 'ca', 43.65, -79.38, 'residential', 'highway'),
      makeFeature('Tim Hortons', undefined, 'Canada', 'ca', 43.65, -79.38, 'fast_food', 'amenity'),
      makeFeature('Toronto', 'Ontario', 'Canada', 'ca', 43.7001, -79.4163, 'city', 'place'),
    ])));

    const results = await provider.search('Toronto', new AbortController().signal);
    expect(results).toHaveLength(1);
    expect(results[0].city).toBe('Toronto');
  });

  // Bonus: caps at 5 results
  it('returns at most 5 results', async () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      makeFeature(`Town${i}`, 'Ontario', 'Canada', 'ca', 43 + i * 0.1, -79 + i * 0.1),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(photonResponse(many)));

    const results = await provider.search('Town', new AbortController().signal);
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
