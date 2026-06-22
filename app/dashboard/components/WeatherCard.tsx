'use client';

import { useEffect, useState } from 'react';
import { type WeatherData } from '@/lib/weather';

const GRADIENTS: Record<string, string> = {
  sunny:   'from-amber-400 via-orange-400 to-yellow-500',
  clear:   'from-sky-400 via-blue-500 to-blue-600',
  cloudy:  'from-slate-400 via-slate-500 to-gray-600',
  rainy:   'from-indigo-500 via-blue-600 to-blue-700',
  drizzle: 'from-slate-400 via-indigo-400 to-blue-500',
  snow:    'from-blue-200 via-cyan-300 to-sky-400',
  stormy:  'from-gray-600 via-slate-700 to-gray-800',
  foggy:   'from-gray-300 via-slate-400 to-gray-500',
};

function gradientKey(data: WeatherData): keyof typeof GRADIENTS {
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
    if (!location) { setLoading(false); setError(true); return; }
    fetch(`/api/weather?location=${encodeURIComponent(location)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(true); } else { setData(json as WeatherData); }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [location]);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-200 to-slate-300 w-full space-y-3">
        <div className="h-4 w-24 bg-white/50 rounded-full animate-pulse" />
        <div className="h-12 w-32 bg-white/50 rounded-full animate-pulse" />
        <div className="h-4 w-40 bg-white/40 rounded-full animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl p-6 bg-gray-100 text-gray-400 text-sm text-center flex items-center justify-center gap-2 w-full">
        <span className="text-xl">☁️</span>
        Weather unavailable · Missions still ready
      </div>
    );
  }

  const gradient = GRADIENTS[gradientKey(data)];

  return (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white w-full`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{data.location}</p>
        <span className="text-5xl leading-none">{data.emoji}</span>
      </div>

      <div className="mt-2">
        <span className="text-6xl font-thin text-white leading-none">{data.tempC}°</span>
        <p className="text-xl font-medium mt-1">{data.condition}</p>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-white/90">
        <span className="font-medium">H: {data.highC}° &nbsp; L: {data.lowC}°</span>
        <span className="text-white/80">Feels like {data.feelsLikeC}°</span>
      </div>

      <p className="text-sm italic text-white/90 mt-4 border-t border-white/20 pt-3">{data.suggestion}</p>

      {weatherMissions && (
        <span className="inline-flex items-center gap-1 mt-3 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
          🌤 Weather missions included
        </span>
      )}
    </div>
  );
}
