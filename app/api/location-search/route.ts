import { NextRequest, NextResponse } from 'next/server';
import { createGeocodingProvider } from '@/lib/geocoding';
import type { LocationResult } from '@/lib/geocoding';

export const runtime = 'nodejs';

const MAX_QUERY_LENGTH = 100;
const CACHE_TTL_MS = 5 * 60 * 1000;       // 5 minutes
const RATE_WINDOW_MS = 60 * 1000;           // 1 minute window
const RATE_MAX = 30;                         // requests per IP per window
const FETCH_TIMEOUT_MS = 4_000;

// ---------- in-memory cache (cleared on cold start; fine for this workload) ----------

const resultCache = new Map<string, { results: LocationResult[]; expires: number }>();

function getCached(key: string): LocationResult[] | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { resultCache.delete(key); return null; }
  return entry.results;
}

function setCached(key: string, results: LocationResult[]): void {
  resultCache.set(key, { results, expires: Date.now() + CACHE_TTL_MS });
}

// ---------- in-memory rate limiter ----------

const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateBuckets.set(ip, hits);
  return hits.length > RATE_MAX;
}

// ---------- handler ----------

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const raw = req.nextUrl.searchParams.get('q') ?? '';
  const query = raw.trim();

  if (!query) return NextResponse.json({ results: [] });

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  const cacheKey = query.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const provider = createGeocodingProvider();
    const results = await provider.search(query, controller.signal);
    setCached(cacheKey, results);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Search timed out — please try again', results: [] },
        { status: 504 },
      );
    }
    console.error('[location-search]', err);
    return NextResponse.json(
      { error: 'Location search unavailable', results: [] },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
