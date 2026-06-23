import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase';
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

const FALLBACK: Record<string, MissionDraft[]> = {
  '3-5': [
    { title: 'Do 5 star jumps and 5 hops', category: 'movement', screen_time_reward: 5 },
    { title: 'Pick up your toys and put them away', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Name 3 things that make you happy', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Count to 20 out loud with a grown-up', category: 'learning', screen_time_reward: 5 },
    { title: 'Draw a picture of your family', category: 'creativity', screen_time_reward: 5 },
    { title: 'Give someone you love a big hug', category: 'family_connection', screen_time_reward: 5 },
  ],
  '6-7': [
    { title: 'Do 10 jumping jacks and 5 push-ups', category: 'movement', screen_time_reward: 5 },
    { title: 'Make your bed neatly', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Draw something you are grateful for', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Read a book for 10 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Build something fun with blocks or paper', category: 'creativity', screen_time_reward: 5 },
    { title: 'Help a family member with a small chore', category: 'family_connection', screen_time_reward: 5 },
  ],
  '8-10': [
    { title: 'Go outside and move your body for 15 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Help prepare or clean up after a meal', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Write 3 things you are grateful for today', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Read for 15 minutes and tell someone about it', category: 'learning', screen_time_reward: 10 },
    { title: 'Invent a short story or comic strip', category: 'creativity', screen_time_reward: 10 },
    { title: 'Have a real conversation with a family member', category: 'family_connection', screen_time_reward: 5 },
  ],
  '11-13': [
    { title: 'Exercise for 20 minutes — your choice', category: 'movement', screen_time_reward: 10 },
    { title: 'Complete a household task without being asked', category: 'responsibility', screen_time_reward: 10 },
    { title: 'Journal: how are you feeling today and why?', category: 'emotional_intelligence', screen_time_reward: 10 },
    { title: 'Study or read for 20 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Make art, music, or write something original', category: 'creativity', screen_time_reward: 10 },
    { title: 'Do something thoughtful for a family member', category: 'family_connection', screen_time_reward: 10 },
  ],
  '14+': [
    { title: 'Get outside and move for 20 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Take on a home responsibility without being asked', category: 'responsibility', screen_time_reward: 10 },
    { title: 'Reflect: write about a challenge you faced', category: 'emotional_intelligence', screen_time_reward: 10 },
    { title: 'Read or study something that interests you', category: 'learning', screen_time_reward: 10 },
    { title: 'Create something — art, music, writing, or code', category: 'creativity', screen_time_reward: 10 },
    { title: 'Spend quality time with family — no screens', category: 'family_connection', screen_time_reward: 10 },
  ],
  'default': [
    { title: 'Move your body for 15 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Tidy up one space in your home', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Write or say 3 things you are grateful for', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Read or learn something new for 15 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Make something creative today', category: 'creativity', screen_time_reward: 10 },
    { title: 'Connect with a family member', category: 'family_connection', screen_time_reward: 5 },
  ],
};

const CATEGORIES = ['movement', 'responsibility', 'emotional_intelligence', 'learning', 'creativity', 'family_connection'];

export async function POST(req: NextRequest) {
  const { childId, childAge, parentId, location, mood, weatherSummary, count } = await req.json();

  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 });
  }

  const requestedCount = Math.min(8, Math.max(5, Number(count) || 6));

  const authHeader = req.headers.get('authorization') ?? '';
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Two supported callers:
  //  1. Parent dashboard — has a Supabase auth session (Bearer token).
  //  2. Kid View (/child) — no auth session; passes parentId in the body and
  //     we verify the child belongs to that parent via the service role.
  let resolvedParentId: string;
  let childRow: { id: string; age: number | null } | null = null;

  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    callerToken
      ? { global: { headers: { Authorization: `Bearer ${callerToken}` } } }
      : undefined
  );

  if (callerToken) {
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser();
    if (authError || !user) {
      console.error('[generate-missions] auth.getUser failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    resolvedParentId = parentId ?? user.id;

    const { data, error: childError } = await anonSupabase
      .from('children')
      .select('id, age')
      .eq('id', childId)
      .eq('parent_id', resolvedParentId)
      .single();
    if (childError || !data) {
      console.error('[generate-missions] child lookup (session) failed:', childError?.message);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    childRow = data as { id: string; age: number | null };
  } else if (parentId) {
    // Kid View: verify child↔parent via service role (RLS-bypassing) read.
    let serviceSupabase;
    try {
      serviceSupabase = createServiceSupabaseClient();
    } catch (err) {
      console.error('[generate-missions] service-role client unavailable:', err);
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    const { data, error: childError } = await serviceSupabase
      .from('children')
      .select('id, age, parent_id')
      .eq('id', childId)
      .single();
    if (childError || !data || (data as { parent_id: string }).parent_id !== parentId) {
      console.error('[generate-missions] child lookup (kid view) failed or mismatch:', childError?.message);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    resolvedParentId = parentId;
    childRow = { id: (data as { id: string }).id, age: (data as { age: number | null }).age };
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = `parent:${resolvedParentId}`;
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

  const resolvedAge: number | null = childAge ?? childRow?.age ?? null;
  const band = resolvedAge ? ageBand(resolvedAge) : '8-10';

  let resolvedWeatherSummary: string | null = weatherSummary ?? null;
  let isOutdoorFriendly = false;
  let weatherHint = '';
  try {
    if (!resolvedWeatherSummary) {
      let resolvedLocation: string | null = location ?? null;
      if (!resolvedLocation) {
        // Use service role so this works for both authenticated parents and Kid View.
        const planClient = createServiceSupabaseClient();
        const { data: plan } = await planClient
          .from('family_plans')
          .select('personalization_data')
          .eq('parent_id', resolvedParentId)
          .single();
        resolvedLocation = (plan?.personalization_data as Record<string, unknown>)?.location as string ?? null;
      }
      if (resolvedLocation) {
        const weather = await getWeather(resolvedLocation);
        if (weather) {
          resolvedWeatherSummary = weather.summary;
          weatherHint = weatherMissionHint(weather);
          isOutdoorFriendly = !weather.isRainy && !weather.isSnowy && !weather.isCold;
        }
      }
    } else {
      isOutdoorFriendly = /outdoor friendly/i.test(resolvedWeatherSummary);
    }
  } catch {
    // Weather is optional - proceed without it
  }

  const neededCategories = isOutdoorFriendly
    ? `${CATEGORIES.join(', ')}, outdoor`
    : CATEGORIES.join(', ');

  // 6+ age bands ('6-7', '8-10', '11-13', '14+') get a healthy habits mission.
  const ageBandNum = parseInt(band, 10);
  const healthyHabitsLine = ageBandNum >= 6
    ? '\nInclude one healthy habits mission (hydration, sleep, nutrition, or hygiene).'
    : '';

  const systemPrompt = `You are BrytThrive's mission engine. Generate ${requestedCount} child missions for age band "${band}".
Weather: ${resolvedWeatherSummary ?? 'not available'}.${weatherHint ? ` ${weatherHint}` : ''}
Mood: ${mood ?? 'not set'}.${mood && MOOD_MISSION_HINTS[mood as MoodKey] ? ` ${MOOD_MISSION_HINTS[mood as MoodKey]}` : ''}
Categories needed: ${neededCategories}.${healthyHabitsLine}
Rules: child-friendly language, 10 words max per title, JSON array only.
Format: [{"title":"...","category":"...","screen_time_reward":5}]`;

  let missions: MissionDraft[] = [];
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          // Privacy: only the age band string is sent — never the child's name or exact age.
          content: `Generate exactly ${requestedCount} missions for a child in the ${band} age range. Return only a JSON array.`,
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
    const fallbacks = FALLBACK[band] ?? FALLBACK['default'];
    missions = fallbacks.slice(0, requestedCount);
  }

  missions = missions.slice(0, requestedCount);

  const missionDate = today();

  // Only incomplete missions are replaced; completed missions stay so coins are preserved.
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
    console.error('[generate-missions] mission insert failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data, generated: missions.length });
}
