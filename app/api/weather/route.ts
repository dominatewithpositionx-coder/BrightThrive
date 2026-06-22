import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/weather';

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get('location') ?? '';
  if (!location.trim()) {
    return NextResponse.json({ error: 'location is required' });
  }
  const data = await fetchWeather(location);
  if (!data) {
    return NextResponse.json({ error: 'unavailable' });
  }
  return NextResponse.json(data);
}
