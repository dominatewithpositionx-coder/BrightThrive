import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { getWeather, weatherMissionHint } from '@/lib/weather';
import { MOOD_MISSION_HINTS, type MoodKey } from '@/lib/mood';

export const runtime = 'nodejs';

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

function checkRateLimit(key: string): boolean {
  const last = rateLimitMap.get(key);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) return false;
  rateLimitMap.set(key, now);
  if (rateLimitMap.size > 5000) {
    for (const [k, ts] of rateLimitMap) {
      if (now - ts > RATE_LIMIT_MS * 10) rateLimitMap.delete(k);
    }
  }
  return true;
}

function ageBand(age: number): string {
  if (age <= 5) return '3-5';
  if (age <= 7) return '6-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14+';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

type MissionDraft = {
  title: string;
  category?: string;
  screen_time_reward?: number;
};

const FALLBACK_MISSIONS: Record<string, MissionDraft[]> = {
  '3-5': [
    { title: 'Pick up your toys and put them away', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Draw a picture of your family', category: 'creativity', screen_time_reward: 5 },
    { title: 'Do 5 star jumps and 5 hops', category: 'movement', screen_time_reward: 5 },
    { title: 'Say something kind to someone you love', category: 'family_connection', screen_time_reward: 5 },
    { title: 'Name 3 things that make you happy', category: 'emotional_intelligence', screen_time_reward: 5 },
  ],
  '6-7': [
    { title: 'Read a book for 10 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Make your bed neatly', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Do 10 jumping jacks and 5 push-ups', category: 'movement', screen_time_reward: 5 },
    { title: 'Draw something you are grateful for', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Help a family member with a small chore', category: 'family_connection', screen_time_reward: 5 },
  ],
  '8-10': [
    { title: 'Read for 15 minutes and tell someone what happened', category: 'learning', screen_time_reward: 10 },
    { title: 'Write 3 things you are grateful for today', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Help prepare or clean up after a meal', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Go outside and move your body for 15 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Have a real conversation with a family member', category: 'family_connection', screen_time_reward: 5 },
  ],
  '11-13': [
    { title: 'Study or read for 20 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Write in a journal: how are you feeling today?', category: 'emotional_intelligence', screen_time_reward: 10 },
    { title: 'Complete a household responsibility without being asked', category: 'responsibility', screen_time_reward: 10 },
    { title: 'Exercise for 20 minutes — your choice', category: 'movement', screen_time_reward: 10 },
    { title: 'Do something thoughtful for a family member', category: 'family_connection', screen_time_reward: 10 },
  ],
  '14+': [
    { title: 'Read or study something that interests you for 20 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Reflect: write about a challenge you faced and how you handled it', category: 'emotional_intelligence', screen_time_reward: 10 },
    { title: 'Take on a responsibility at home without being asked', category: 'responsibility', screen_time_reward: 10 },
    { title: 'Get outside and move for 20 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Spend quality time with your family — no screens', category: 'family_connection', screen_time_reward: 10 },
  ],
};

const BASE_SYSTEM_PROMPT = `You are a warm, encouraging assistant that generates personalized daily missions for children.
Missions should be:
- Quick to complete (5-20 minutes each)
- Educational, character-building, or helpful
- Fun and encouraging - framed as "missions" not chores
- Age-appropriate and emotionally supportive
- Cover exactly these 5 categories: movement, responsibility, emotional_intelligence, learning, family_connection (one each)

Respond ONLY with a valid JSON array of exactly 5 objects. No explanation, no markdown, no backticks.
Each object must have exactly: title (string), category (one of the 5 categories above), screen_time_reward (integer, 5-15).
Example:
[{"title":"Tell someone you love them today","category":"family_connection","screen_time_reward":5}]`;

export async function POST(req: NextRequest) {
  const { childId, childAge, parentId, location, mood, weatherSummary } = await req.json();

  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!callerToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${callerToken}` } } }
  );
  const { data: { user } } = await anonSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParentId: string = parentId ?? user.id;

  const { data: childRow } = await anonSupabase
    .from('children')
    .select('id, age')
    .eq('id', childId)
    .eq('parent_id', resolvedParentId)
    .single();
  if (!childRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rlKey = `parent:${user.id}`;
  if (!checkRateLimit(rlKey)) {
    return NextResponse.json(
      { error: 'Please wait a moment before generating new missions.' },
      { status: 429 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const resolvedAge: number | null = childAge ?? (childRow as { id: string; age: number | null }).age ?? null;
  const band = resolvedAge ? ageBand(resolvedAge) : '8-10';

  let systemPrompt = BASE_SYSTEM_PROMPT;
  const contextParts: string[] = [];

  if (weatherSummary) {
    contextParts.push(`Current weather: ${weatherSummary}. Include exactly 1 weather-aware movement mission tailored to these conditions.`);
  } else {
    try {
      let resolvedLocation: string | null = location ?? null;
      if (!resolvedLocation) {
        const { data: plan } = await anonSupabase
          .from('family_plans')
          .select('personalization_data')
          .eq('parent_id', user.id)
          .single();
        resolvedLocation = (plan?.personalization_data as Record<string, unknown>)?.location as string ?? null;
      }
      if (resolvedLocation) {
        const weather = await getWeather(resolvedLocation);
        if (weather) {
          contextParts.push(
            `${weather.summary} ${weatherMissionHint(weather)} Include exactly 1 outdoor or movement mission tailored to the current weather.`
          );
        }
      }
    } catch {
      // Weather is optional - proceed without it
    }
  }

  if (mood && MOOD_MISSION_HINTS[mood as MoodKey]) {
    contextParts.push(MOOD_MISSION_HINTS[mood as MoodKey]);
  }

  if (contextParts.length > 0) {
    systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nContext: ${contextParts.join(' ')}`;
  }

  let missions: MissionDraft[] = [];
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          // Privacy: child's real name and exact age are never sent to Anthropic.
          content: `Generate exactly 5 missions for a child in the ${band} age range. Return only a JSON array.`,
        },
      ],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      missions = parsed as MissionDraft[];
    }
  } catch (err) {
    console.error('[generate-missions] Claude failed, using fallback:', err);
  }

  if (missions.length === 0) {
    const fallbacks = FALLBACK_MISSIONS[band] ?? FALLBACK_MISSIONS['8-10'];
    missions = fallbacks.slice(0, 5);
  }

  missions = missions.slice(0, 5);

  const missionDate = today();

  await supabase
    .from('missions')
    .delete()
    .eq('child_id', childId)
    .eq('is_completed', false)
    .eq('mission_date', missionDate);

  const { data, error } = await supabase
    .from('missions')
    .insert(missions.map((m) => ({
      child_id: childId,
      title: m.title,
      category: m.category ?? 'general',
      screen_time_reward: m.screen_time_reward ?? 5,
      is_completed: false,
      mission_date: missionDate,
      status: 'active',
    })))
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data, generated: missions.length });
}
