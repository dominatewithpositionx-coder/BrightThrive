export type { LocationResult, GeocodingProvider } from './types';

import { PhotonProvider } from './photon';
import type { GeocodingProvider } from './types';

/**
 * Returns the active geocoding provider.
 *
 * Swap this factory to change providers (Mapbox, OpenCage, self-hosted Photon)
 * without touching the API route or the autocomplete component.
 *
 * Set PHOTON_BASE_URL in env to point at a self-hosted Photon instance.
 */
export function createGeocodingProvider(): GeocodingProvider {
  const baseUrl = process.env.PHOTON_BASE_URL; // undefined → uses komoot public demo
  return new PhotonProvider(baseUrl);
}
