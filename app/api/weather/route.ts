import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/weather';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get('location');
  if (!location) {
    return NextResponse.json({ error: 'location is required' }, { status: 400 });
  }

  const data = await fetchWeather(location);
  if (!data) {
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}
