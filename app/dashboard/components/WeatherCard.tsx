'use client';

import { useEffect, useState } from 'react';
import { type WeatherData } from '@/lib/weather';

function gradientFor(data: WeatherData | null): string {
  if (!data) return 'from-slate-400 to-slate-600';
  const lc = data.condition.toLowerCase();
  if (lc.includes('snow'))                           return 'from-blue-200 to-cyan-300';
  if (lc.includes('rain') || lc.includes('shower'))  return 'from-indigo-400 to-blue-700';
  if (lc.includes('cloud') || lc.includes('fog'))    return 'from-slate-400 to-slate-600';
  return 'from-sky-400 to-blue-600';
}

export default function WeatherCard({ location }: { location: string }) {
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
      <div className="rounded-2xl p-6 bg-gray-200 animate-pulse h-36 w-full" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl p-6 bg-gray-100 text-gray-400 text-sm text-center">
        Weather unavailable · Missions still ready
      </div>
    );
  }

  const gradient = gradientFor(data);

  return (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white w-full`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{data.location}</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl leading-none">{data.emoji}</span>
            <span className="text-4xl font-thin leading-none">{data.tempC}°C</span>
          </div>
          <p className="text-lg font-medium mt-2">{data.condition}</p>
          <p className="text-sm text-white/80 mt-0.5">H:{data.highC}° · L:{data.lowC}° · Feels {data.feelsLikeC}°</p>
        </div>
      </div>
      <p className="text-sm text-white/90 mt-4 font-medium">{data.suggestion}</p>
    </div>
  );
}
