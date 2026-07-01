'use client';

import { useEffect, useState } from 'react';
import { type WeatherData } from '@/lib/weather';

// Condition → subtle left-border accent colour
const ACCENT: Record<string, string> = {
  sunny:   'border-amber-400',
  clear:   'border-sky-400',
  cloudy:  'border-slate-400',
  rainy:   'border-blue-500',
  drizzle: 'border-indigo-400',
  snow:    'border-cyan-300',
  stormy:  'border-gray-600',
  foggy:   'border-gray-300',
};

const BG: Record<string, string> = {
  sunny:   'bg-amber-50',
  clear:   'bg-sky-50',
  cloudy:  'bg-slate-50',
  rainy:   'bg-blue-50',
  drizzle: 'bg-indigo-50',
  snow:    'bg-cyan-50',
  stormy:  'bg-gray-100',
  foggy:   'bg-gray-50',
};

function conditionKey(data: WeatherData): string {
  const lc = data.condition.toLowerCase();
  if (lc.includes('thunder') || lc.includes('storm')) return 'stormy';
  if (lc.includes('snow'))                             return 'snow';
  if (lc.includes('shower') || lc.includes('drizzle')) return 'drizzle';
  if (lc.includes('rain'))                             return 'rainy';
  if (lc.includes('fog'))                              return 'foggy';
  if (lc.includes('cloud'))                            return 'cloudy';
  if (lc.includes('clear sky') || lc.includes('sun')) return 'sunny';
  return 'clear';
}

export default function WeatherCard({ location, weatherMissions }: { location: string; weatherMissions?: boolean }) {
  const [data, setData]       = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    function tryGeolocation() {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setError(true); setLoading(false); return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const json = await res.json();
            if (json.error) { setError(true); } else { setData(json as WeatherData); }
          } catch { setError(true); }
          setLoading(false);
        },
        () => { setError(true); setLoading(false); },
        { timeout: 8000 },
      );
    }

    if (location) {
      fetch(`/api/weather?location=${encodeURIComponent(location)}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.error) { tryGeolocation(); } else { setData(json as WeatherData); setLoading(false); }
        })
        .catch(() => tryGeolocation());
    } else {
      tryGeolocation();
    }
  }, [location]);

  if (loading) {
    return (
      <div className="rounded-xl border-l-4 border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3">
        <div className="h-4 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded-full animate-pulse ml-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border-l-4 border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
        <span>☁️</span>
        <span>Weather unavailable</span>
      </div>
    );
  }

  const key = conditionKey(data);
  const accent = ACCENT[key] ?? 'border-sky-400';
  const bg = BG[key] ?? 'bg-sky-50';

  return (
    <div className={`rounded-xl border-l-4 ${accent} ${bg} px-4 py-3`}>
      {/* Main row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-2xl leading-none">{data.emoji}</span>
        <span className="text-lg font-semibold text-gray-800">{data.tempC}°C</span>
        <span className="text-sm text-gray-600 font-medium">{data.condition}</span>
        <span className="text-gray-300 hidden sm:inline">·</span>
        <span className="text-xs text-gray-500 hidden sm:inline">{data.location}</span>
        <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
          H: {data.highC}° &nbsp; L: {data.lowC}° &nbsp;·&nbsp; Feels {data.feelsLikeC}°
        </span>
      </div>
      {/* Suggestion row */}
      <p className="text-xs text-gray-500 mt-1 italic">{data.suggestion}{weatherMissions ? ' · 🌤 Weather missions included' : ''}</p>
    </div>
  );
}
