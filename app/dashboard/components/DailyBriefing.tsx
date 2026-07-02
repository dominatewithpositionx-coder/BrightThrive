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

// Shown when the API is unavailable — rotates daily so it never feels stale.
const FALLBACK_INSIGHTS = [
  "Every mission completed today is a memory in the making. Celebrate the little wins together tonight.",
  "Children grow most when they feel seen. Ask them what their favourite mission was today.",
  "Consistency beats perfection. Even one mission completed is a step in the right direction.",
  "The best reward you can give is your attention. Take a moment to celebrate today's victories.",
  "Small daily habits create extraordinary kids. What you're doing here really matters.",
  "Growth happens one mission at a time. Keep going — it's working, even when it doesn't feel like it.",
  "Every coin earned is a lesson in effort and reward. That's a gift that lasts a lifetime.",
  "The dinner table is the best classroom. Ask your child what they're most proud of today.",
  "Encouragement today becomes confidence tomorrow. You're building something beautiful.",
  "The magic isn't in the missions — it's in the moments they create between you.",
  "A child who feels celebrated will rise to meet every challenge. Keep celebrating.",
  "Today's small wins are tomorrow's big character. You're doing great.",
];

function getDailyFallback(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FALLBACK_INSIGHTS[dayOfYear % FALLBACK_INSIGHTS.length];
}

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
        } else {
          setBriefing(getDailyFallback());
        }
      })
      .catch(() => { if (!cancelled) setBriefing(getDailyFallback()); })
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
