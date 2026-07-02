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
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Today&apos;s Insight</p>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-full" />
            <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/4" />
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-700 leading-relaxed">{briefing}</p>
        )}
      </div>
    </div>
  );
}
