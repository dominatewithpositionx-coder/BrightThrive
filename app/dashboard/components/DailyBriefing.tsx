'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { type WeatherData } from '@/lib/weather';

type ChildInput = { name: string; age: number };

type Props = {
  children: ChildInput[];
  weather?: WeatherData | null;
  completedToday: number;
  totalToday: number;
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DailyBriefing({ children, weather, completedToday, totalToday }: Props) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (children.length === 0) { setLoading(false); return; }
    const key = `bt_briefing_${todayStr()}`;
    const cached = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (cached) { setBriefing(cached); setLoading(false); return; }

    let cancelled = false;
    fetch('/api/daily-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ children, weather, completedToday, totalToday }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const text = json.briefing as string;
        if (text) {
          setBriefing(text);
          try { localStorage.setItem(key, text); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Generated once per day; cached input changes should not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children.length]);

  if (children.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3 w-full">
      <div className="p-2 bg-white/70 rounded-xl flex-shrink-0">
        <Sparkles size={18} className="text-emerald-500" />
      </div>
      {loading ? (
        <div className="flex-1 h-5 bg-emerald-100 rounded-full animate-pulse mt-1" />
      ) : (
        <p className="text-sm font-medium text-gray-700 leading-relaxed mt-0.5">{briefing}</p>
      )}
    </div>
  );
}
