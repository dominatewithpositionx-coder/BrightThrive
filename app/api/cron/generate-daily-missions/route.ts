import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { fetchWeather, type WeatherData } from '@/lib/weather';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ageBand(age: number | null): string {
  if (!age) return 'default';
  if (age <= 5) return '3-5';
  if (age <= 7) return '6-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14+';
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayUTC(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month <= 1 || month === 11) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

type MissionDraft = {
  title: string;
  category: string;
  screen_time_reward: number;
  generated_by: string;
};

const FALLBACK_MISSIONS: Record<string, Omit<MissionDraft, 'generated_by'>[]> = {
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

async function generateMissionsForChild(params: {
  ageBand: string;
  weekday: 'weekday' | 'weekend';
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  difficulty: 'low' | 'normal' | 'high';
  streak: number;
  weather: WeatherData | null;
  preferences: { primary_goal?: string; selected_habits?: string[]; motivation_preference?: string };
  count: number;
}): Promise<MissionDraft[]> {
  const { ageBand: band, weekday, season, difficulty, streak, weather, preferences, count } = params;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are BrytThrive's daily mission engine.
Generate ${count} missions for a child in age band "${band}".
Day type: ${weekday}. Season: ${season}. Difficulty: ${difficulty}.
${weather ? `Weather: ${weather.condition}, ${weather.tempC}°C, ${weather.isOutdoorFriendly ? 'outdoor friendly' : 'indoor day'}.` : ''}
${preferences.primary_goal ? `Parent focus: ${preferences.primary_goal}.` : ''}
${preferences.selected_habits?.length ? `Priority habits: ${preferences.selected_habits.slice(0, 3).join(', ')}.` : ''}
${streak > 2 ? `Child is on a ${streak}-day streak — acknowledge their consistency.` : ''}

Required category spread across the ${count} missions: movement, responsibility, emotional_intelligence, learning, creativity, family_connection.
${weather?.isOutdoorFriendly ? 'Include 1 outdoor/weather-aware mission.' : 'All indoor missions.'}
${difficulty === 'low' ? 'Keep missions short, simple, and achievable. Very encouraging tone.' : ''}
${difficulty === 'high' ? 'Slightly more ambitious missions that reward consistent effort.' : ''}
${weekday === 'weekend' ? 'Weekend tone — more fun, family-focused, less academic.' : ''}

Output ONLY a JSON array, no markdown, no explanation:
[{"title":"<10 words, child-friendly>","category":"<one of: movement|responsibility|emotional_intelligence|learning|creativity|family_connection|outdoor|healthy_habits>","screen_time_reward":5}]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate exactly ${count} missions for a child in the ${band} age range. Return only a JSON array.`,
        },
      ],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as Array<{ title: string; category: string; screen_time_reward: number }>).map(m => ({
        ...m,
        generated_by: 'claude',
      }));
    }
  } catch {
    // intentional fall-through to fallback
  }

  const fallbacks = FALLBACK_MISSIONS[band] ?? FALLBACK_MISSIONS['default'];
  return fallbacks.slice(0, count).map(m => ({ ...m, generated_by: 'fallback' }));
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = todayUTC();
  const yesterday = yesterdayUTC();
  const now = new Date();
  const weekday: 'weekday' | 'weekend' = (now.getUTCDay() === 0 || now.getUTCDay() === 6) ? 'weekend' : 'weekday';
  const season = getSeason(now.getUTCMonth());

  const { data: childRows, error: childErr } = await supabase
    .from('children')
    .select(`
      id,
      age,
      parent_id,
      family_plans!left(personalization_data),
      streaks!left(current_streak, last_active_date)
    `);

  if (childErr) {
    console.error('[cron/generate-daily-missions] Failed to fetch children:', childErr.message);
    return NextResponse.json({ error: 'Failed to fetch children', detail: childErr.message }, { status: 500 });
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const totalChildren = (childRows ?? []).length;

  for (const row of childRows ?? []) {
    try {
      const { count: existingCount } = await supabase
        .from('missions')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', row.id)
        .eq('mission_date', today);

      if ((existingCount ?? 0) > 0) {
        skipped++;
        continue;
      }

      const band = ageBand(row.age as number | null);

      const { data: yesterdayRows } = await supabase
        .from('missions')
        .select('is_completed')
        .eq('child_id', row.id)
        .eq('mission_date', yesterday);

      let difficulty: 'low' | 'normal' | 'high' = 'normal';
      if (yesterdayRows && yesterdayRows.length > 0) {
        const done = yesterdayRows.filter((m: { is_completed: boolean }) => m.is_completed).length;
        const rate = done / yesterdayRows.length;
        if (rate >= 1.0) difficulty = 'high';
        else if (rate <= 0.4) difficulty = 'low';
      }

      const planData = Array.isArray(row.family_plans)
        ? (row.family_plans[0]?.personalization_data as Record<string, unknown> | null)
        : (row.family_plans as { personalization_data: Record<string, unknown> } | null)?.personalization_data;

      const location = planData?.location as string | undefined;
      const preferences = {
        primary_goal: planData?.primary_goal as string | undefined,
        selected_habits: planData?.selected_habits as string[] | undefined,
        motivation_preference: planData?.motivation_preference as string | undefined,
      };

      let weather: WeatherData | null = null;
      if (location) {
        try {
          weather = await fetchWeather(location);
        } catch {
          // weather is optional
        }
      }

      const streakRow = Array.isArray(row.streaks)
        ? row.streaks[0]
        : row.streaks;
      const currentStreak = (streakRow as { current_streak?: number } | null)?.current_streak ?? 0;

      const count = 6;
      const missions = await generateMissionsForChild({
        ageBand: band,
        weekday,
        season,
        difficulty,
        streak: currentStreak,
        weather,
        preferences,
        count,
      });

      const { error: insertErr } = await supabase
        .from('missions')
        .insert(missions.map(m => ({
          child_id: row.id,
          title: m.title,
          category: m.category ?? 'general',
          screen_time_reward: m.screen_time_reward ?? 5,
          is_completed: false,
          mission_date: today,
          status: 'active',
          generated_by: m.generated_by,
          weather_snapshot: weather ? { condition: weather.condition, tempC: weather.tempC, isOutdoorFriendly: weather.isOutdoorFriendly } : null,
          generation_context: { ageBand: band, weekday, season, difficulty, streak: currentStreak },
        })));

      if (insertErr) throw new Error(insertErr.message);

      await supabase
        .from('mission_generation_log')
        .insert({
          child_id: row.id,
          mission_date: today,
          count,
          generated_by: 'cron',
          weather_condition: weather?.condition ?? null,
          difficulty,
          season,
        });

      generated++;
    } catch (err) {
      errors++;
      console.error('[cron/generate-daily-missions]', { childId: row.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ generated, skipped, errors, totalChildren });
}
