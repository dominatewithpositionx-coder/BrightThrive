import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather, fetchWeatherByCoords } from '@/lib/weather';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const location = searchParams.get('location');
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  let data = null;

  if (latParam && lonParam) {
    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);
    if (!isNaN(lat) && !isNaN(lon)) {
      data = await fetchWeatherByCoords(lat, lon);
    }
  } else if (location) {
    data = await fetchWeather(location);
  } else {
    return NextResponse.json({ error: 'location or lat/lon is required' }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}
