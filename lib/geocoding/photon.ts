import type { GeocodingProvider, LocationResult } from './types';

// OSM place values considered "city-level" — excludes streets, POIs, buildings
const CITY_LEVEL_VALUES = new Set([
  'city', 'town', 'village', 'municipality', 'hamlet',
  'locality', 'borough', 'quarter', 'suburb', 'county', 'district',
]);

// OSM keys that are never city-level regardless of value
const EXCLUDED_KEYS = new Set(['highway', 'amenity', 'shop', 'building', 'tourism', 'leisure']);

interface PhotonProperties {
  osm_key?: string;
  osm_value?: string;
  name?: string;
  city?: string;
  state?: string;
  county?: string;
  country?: string;
  countrycode?: string;
}

interface PhotonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export class PhotonProvider implements GeocodingProvider {
  readonly name = 'photon';
  private readonly baseUrl: string;

  constructor(baseUrl = 'https://photon.komoot.io') {
    this.baseUrl = baseUrl;
  }

  async search(query: string, signal: AbortSignal): Promise<LocationResult[]> {
    const url = new URL(`${this.baseUrl}/api/`);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '10'); // fetch extra; filter down to 5
    url.searchParams.set('lang', 'en');

    const res = await fetch(url.toString(), {
      signal,
      headers: { 'User-Agent': 'BrytThrive/1.0 (contact: hello@brytthrive.com)' },
    });

    if (!res.ok) throw new Error(`Photon responded with HTTP ${res.status}`);

    const data: PhotonResponse = await res.json();

    return data.features
      .filter((f) => {
        const key = f.properties.osm_key ?? '';
        const val = f.properties.osm_value ?? '';
        if (EXCLUDED_KEYS.has(key)) return false;
        return CITY_LEVEL_VALUES.has(val) || key === 'place';
      })
      .slice(0, 5)
      .map((f): LocationResult => {
        const p = f.properties;
        const [lon, lat] = f.geometry.coordinates;

        const cityName = p.name ?? p.city ?? query;
        const region = p.state ?? p.county ?? null;
        const parts = [cityName, region, p.country].filter(Boolean);

        return {
          city: cityName,
          region,
          country: p.country ?? null,
          countryCode: p.countrycode?.toUpperCase() ?? null,
          latitude: typeof lat === 'number' ? lat : null,
          longitude: typeof lon === 'number' ? lon : null,
          displayName: parts.join(', '),
          provider: 'photon',
        };
      });
  }
}
