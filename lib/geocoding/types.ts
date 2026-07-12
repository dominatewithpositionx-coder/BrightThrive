export interface LocationResult {
  city: string;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  displayName: string;
  provider: string;
}

export interface GeocodingProvider {
  readonly name: string;
  search(query: string, signal: AbortSignal): Promise<LocationResult[]>;
}
