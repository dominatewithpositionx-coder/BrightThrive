import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { type WeatherData } from '@/lib/weather';

export const runtime = 'nodejs';

type ChildInput = { name: string; mood?: string; age: number };

const BRIEFINGS: Record<string, string[]> = {
  sunny: ['Beautiful day ahead — perfect for outdoor missions!', "Sunshine and good vibes — let's make today count!"],
  rainy: ['Cozy day inside — great for creativity missions!', 'Rain day magic — perfect for indoor adventures!'],
  default: ['Ready for a great BrytThrive day?', "Let's build great habits today!"],
};

function ageBand(age: number): string {
  if (age <= 5) return '3-5';
  if (age <= 7) return '6-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14+';
}

function conditionKey(weather?: WeatherData | null): keyof typeof BRIEFINGS {
  if (!weather) return 'default';
  const lc = weather.condition.toLowerCase();
  if (lc.includes('rain') || lc.includes('shower') || lc.includes('drizzle') || lc.includes('snow')) return 'rainy';
  if (lc.includes('clear') || lc.includes('sun')) return 'sunny';
  return 'default';
}

function fallbackBriefing(weather?: WeatherData | null): string {
  const pool = BRIEFINGS[conditionKey(weather)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function POST(req: NextRequest) {
  const { children, weather, completedToday, totalToday } = (await req.json()) as {
    children: ChildInput[];
    weather?: WeatherData | null;
    completedToday: number;
    totalToday: number;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ briefing: fallbackBriefing(weather) });
  }

  // Privacy: only count and age bands go to Claude — never child names or exact ages.
  const childCount = children?.length ?? 0;
  const ageBands = Array.from(new Set((children ?? []).map((c) => ageBand(c.age)))).join(', ') || 'unknown';
  const condition = weather?.condition ?? 'not available';

  const prompt = `You are BrytThrive's family coach. Write ONE warm, encouraging sentence (max 20 words) for a parent dashboard.
Family: ${childCount} child(ren), ages ${ageBands}.
Weather: ${condition}.
Progress today: ${completedToday}/${totalToday} missions done.
Tone: warm, positive, action-oriented. No names.`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    return NextResponse.json({ briefing: text || fallbackBriefing(weather) });
  } catch {
    return NextResponse.json({ briefing: fallbackBriefing(weather) });
  }
}
