import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { weatherMissionHint, fetchWeatherCached } from '@/lib/weather';
import { MOOD_MISSION_HINTS, type MoodKey } from '@/lib/mood';
import THEMES from '@/lib/themes';

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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

type MissionDraft = {
  title: string;
  category?: string;
  screen_time_reward?: number;
};

const FALLBACK: Record<string, MissionDraft[]> = {
  '3-5': [
    { title: 'Do 5 star jumps and 5 bunny hops', category: 'movement', screen_time_reward: 5 },
    { title: 'Pick up your toys and put them away', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Name 3 things that make you happy', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Count to 20 out loud with a grown-up', category: 'learning', screen_time_reward: 5 },
    { title: 'Draw a picture of your family', category: 'creativity', screen_time_reward: 5 },
    { title: 'Give someone you love a big hug', category: 'family_connection', screen_time_reward: 5 },
    { title: 'Say something kind to someone today', category: 'kindness', screen_time_reward: 5 },
    { title: 'Take 5 slow deep breaths', category: 'mindfulness', screen_time_reward: 5 },
    { title: 'Drink a full glass of water', category: 'healthy_habits', screen_time_reward: 5 },
    { title: 'Go outside and find something yellow', category: 'outdoor', screen_time_reward: 5 },
  ],
  '6-7': [
    { title: 'Do 10 jumping jacks and 5 push-ups', category: 'movement', screen_time_reward: 5 },
    { title: 'Make your bed neatly', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Draw something you are grateful for', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Read a book for 10 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Build something fun with blocks or paper', category: 'creativity', screen_time_reward: 5 },
    { title: 'Help a family member with a small chore', category: 'family_connection', screen_time_reward: 5 },
    { title: 'Write a compliment for someone', category: 'kindness', screen_time_reward: 5 },
    { title: 'Sit quietly for 2 minutes and breathe', category: 'mindfulness', screen_time_reward: 5 },
    { title: 'Eat a piece of fruit or vegetable', category: 'healthy_habits', screen_time_reward: 5 },
    { title: 'Find 5 different things in nature outside', category: 'outdoor', screen_time_reward: 10 },
  ],
  '8-10': [
    { title: 'Move your body outside for 15 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Help prepare or clean up after a meal', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Write 3 things you are grateful for today', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Read for 15 minutes and summarise it', category: 'learning', screen_time_reward: 10 },
    { title: 'Invent a short story or comic strip', category: 'creativity', screen_time_reward: 10 },
    { title: 'Have a real conversation with a family member', category: 'family_connection', screen_time_reward: 5 },
    { title: 'Do something kind for someone without being asked', category: 'kindness', screen_time_reward: 10 },
    { title: 'Spend 5 minutes with no screens — just breathe', category: 'mindfulness', screen_time_reward: 10 },
    { title: 'Drink 2 glasses of water and do a stretch', category: 'healthy_habits', screen_time_reward: 5 },
    { title: 'Go on a nature scavenger hunt outside', category: 'outdoor', screen_time_reward: 10 },
  ],
  '11-13': [
    { title: 'Exercise for 20 minutes — your choice', category: 'movement', screen_time_reward: 10 },
    { title: 'Complete a household task without being asked', category: 'responsibility', screen_time_reward: 10 },
    { title: 'Journal: how are you feeling today and why?', category: 'emotional_intelligence', screen_time_reward: 10 },
    { title: 'Study or read for 20 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Make something creative — art, music, or writing', category: 'creativity', screen_time_reward: 10 },
    { title: 'Do something thoughtful for a family member', category: 'family_connection', screen_time_reward: 10 },
    { title: 'Write an encouraging note to a friend or sibling', category: 'kindness', screen_time_reward: 10 },
    { title: 'Do a 5-minute mindfulness breathing exercise', category: 'mindfulness', screen_time_reward: 10 },
    { title: 'Eat a healthy snack and go to bed on time', category: 'healthy_habits', screen_time_reward: 5 },
    { title: 'Spend 20 minutes exploring outdoors', category: 'outdoor', screen_time_reward: 15 },
  ],
  '14+': [
    { title: 'Get outside and move for 20 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Take on a responsibility at home without being asked', category: 'responsibility', screen_time_reward: 10 },
    { title: 'Reflect in writing on a challenge you faced', category: 'emotional_intelligence', screen_time_reward: 10 },
    { title: 'Read or study something that interests you', category: 'learning', screen_time_reward: 10 },
    { title: 'Create something — art, music, writing, or code', category: 'creativity', screen_time_reward: 10 },
    { title: 'Spend quality time with family — no screens', category: 'family_connection', screen_time_reward: 10 },
    { title: 'Do something kind for someone unexpectedly', category: 'kindness', screen_time_reward: 10 },
    { title: 'Meditate or practice mindful breathing for 5 minutes', category: 'mindfulness', screen_time_reward: 10 },
    { title: 'Prioritise sleep — set a wind-down routine tonight', category: 'healthy_habits', screen_time_reward: 10 },
    { title: 'Go for a walk or explore somewhere new outside', category: 'outdoor', screen_time_reward: 15 },
  ],
  'default': [
    { title: 'Move your body for 15 minutes', category: 'movement', screen_time_reward: 10 },
    { title: 'Tidy up one space in your home', category: 'responsibility', screen_time_reward: 5 },
    { title: 'Write or say 3 things you are grateful for', category: 'emotional_intelligence', screen_time_reward: 5 },
    { title: 'Read or learn something new for 15 minutes', category: 'learning', screen_time_reward: 10 },
    { title: 'Make something creative today', category: 'creativity', screen_time_reward: 10 },
    { title: 'Connect with a family member meaningfully', category: 'family_connection', screen_time_reward: 5 },
    { title: 'Do something kind for someone', category: 'kindness', screen_time_reward: 5 },
    { title: 'Take 5 slow mindful breaths', category: 'mindfulness', screen_time_reward: 5 },
    { title: 'Drink water and eat something healthy', category: 'healthy_habits', screen_time_reward: 5 },
    { title: 'Spend time outside — even 10 minutes counts', category: 'outdoor', screen_time_reward: 10 },
  ],
};

const ALL_CATEGORIES = [
  'movement', 'responsibility', 'emotional_intelligence', 'learning',
  'creativity', 'family_connection', 'kindness', 'mindfulness',
  'healthy_habits', 'outdoor', 'adventure',
];

// The 9 themed mission packs. Claude picks the most contextually appropriate one.
const MISSION_PACKS = [
  'Morning Momentum',
  'Explorer Pack',
  'Rainy Day Adventures',
  'Weekend Challenge',
  'Focus Mode',
  'Creative Builder',
  'Family Time',
  'Calm & Reset',
  'Energy Burner',
];

export async function POST(req: NextRequest) {
  const {
    childId, childAge, parentId, location, locationLabel, locationCity,
    mood, weatherSummary, count, missionRound,
  } = await req.json();

  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 });
  }

  const requestedCount = Math.min(15, Math.max(8, Number(count) || 10));
  const currentRound: number = Math.max(0, Number(missionRound) || 0);

  const authHeader = req.headers.get('authorization') ?? '';
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let resolvedParentId: string;
  let childRow: { id: string; age: number | null; location_label?: string | null; location_city?: string | null } | null = null;

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
    resolvedParentId = user.id;

    const { data, error: childError } = await anonSupabase
      .from('children')
      .select('id, age, location_label, location_city')
      .eq('id', childId)
      .eq('parent_id', resolvedParentId)
      .single();
    if (childError || !data) {
      console.error('[generate-missions] child lookup (session) failed:', childError?.message);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    childRow = data as { id: string; age: number | null; location_label?: string | null; location_city?: string | null };
  } else if (parentId) {
    let serviceSupabase;
    try {
      serviceSupabase = createServiceSupabaseClient();
    } catch (err) {
      console.error('[generate-missions] service-role client unavailable:', err);
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    const { data, error: childError } = await serviceSupabase
      .from('children')
      .select('id, age, parent_id, location_label, location_city')
      .eq('id', childId)
      .single();
    if (childError || !data || (data as { parent_id: string }).parent_id !== parentId) {
      console.error('[generate-missions] child lookup (kid view) failed or mismatch:', childError?.message);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    resolvedParentId = parentId;
    childRow = {
      id: (data as { id: string }).id,
      age: (data as { age: number | null }).age,
      location_label: (data as { location_label?: string | null }).location_label,
      location_city: (data as { location_city?: string | null }).location_city,
    };
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Per-child rate limit
  const rlKey = `child:${childId}`;
  const now = Date.now();
  const lastGen = rateLimitMap.get(rlKey);
  if (lastGen && now - lastGen < RATE_LIMIT_MS) {
    const secondsLeft = Math.ceil((RATE_LIMIT_MS - (now - lastGen)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${secondsLeft} seconds before generating new missions.` },
      { status: 429 }
    );
  }
  rateLimitMap.set(rlKey, now);

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : anonSupabase;

  const resolvedAge: number | null = childAge ?? childRow?.age ?? null;
  const band = resolvedAge ? ageBand(resolvedAge) : '8-10';

  // ── Parallel context fetch ──────────────────────────────────────────────────
  // Mission history (7 days), today's completed missions, child streak,
  // and family personalization — all needed for intelligent prompt construction.
  const todayStr = today();
  const sevenDaysAgoStr = daysAgo(7);

  let recentMissionHistory: { title: string; category: string | null; is_completed: boolean }[] = [];
  let completedTodayTitles: string[] = [];
  let currentStreak = 0;
  let familyPersonalization: Record<string, unknown> = {};

  try {
    const [historyRes, streakRes, planRes] = await Promise.all([
      // All missions (complete + incomplete) from last 7 days for diversity tracking
      supabase
        .from('missions')
        .select('title, category, is_completed')
        .eq('child_id', childId)
        .gte('mission_date', sevenDaysAgoStr)
        .order('mission_date', { ascending: false })
        .limit(80),
      // Current streak for difficulty scaling
      supabase
        .from('streaks')
        .select('current_streak')
        .eq('child_id', childId)
        .maybeSingle(),
      // Family Growth Profile
      createServiceSupabaseClient()
        .from('family_plans')
        .select('personalization_data')
        .eq('parent_id', resolvedParentId)
        .maybeSingle(),
    ]);

    if (!historyRes.error && historyRes.data) {
      recentMissionHistory = historyRes.data as { title: string; category: string | null; is_completed: boolean }[];
      // Today's completed missions — avoid regenerating these
      completedTodayTitles = recentMissionHistory
        .filter(m => m.is_completed)
        .map(m => m.title);
    }

    if (!streakRes.error && streakRes.data) {
      currentStreak = (streakRes.data as { current_streak: number }).current_streak ?? 0;
    }

    familyPersonalization = (planRes.data?.personalization_data as Record<string, unknown>) ?? {};
  } catch {
    // Non-fatal — generation continues with partial context
  }

  // ── Category diversity analysis ─────────────────────────────────────────────
  // Count category frequency in last 7 days to tell Claude which are over-represented.
  const categoryCounts: Record<string, number> = {};
  for (const m of recentMissionHistory) {
    const cat = m.category ?? 'general';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }
  const overrepresentedCategories = Object.entries(categoryCounts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
  const underrepresentedCategories = ALL_CATEGORIES
    .filter(cat => (categoryCounts[cat] ?? 0) === 0);

  // ── Progressive difficulty level ────────────────────────────────────────────
  // Round 0 = normal. Round 1+ = slightly harder. Streak drives long-term scaling.
  const totalCompletedMissions = recentMissionHistory.filter(m => m.is_completed).length;
  let difficultyLevel: 'beginner' | 'standard' | 'advanced' | 'challenge';
  if (currentStreak === 0 && totalCompletedMissions < 5) {
    difficultyLevel = 'beginner';
  } else if (currentStreak < 3 && currentRound === 0) {
    difficultyLevel = 'standard';
  } else if (currentStreak >= 7 || currentRound >= 2) {
    difficultyLevel = 'challenge';
  } else {
    difficultyLevel = 'advanced';
  }

  const difficultyInstructions: Record<typeof difficultyLevel, string> = {
    beginner:  'Keep missions short and achievable — 5-10 min each. Build confidence with easy wins. Screen time reward: 5 coins per mission.',
    standard:  'Standard difficulty. Mix quick wins (5 min) with moderate challenges (15 min). Screen time: 5-10 coins.',
    advanced:  'Increase challenge — include at least 2 missions requiring 20+ minutes or multi-step effort. Add stretch goals. Screen time: 10-15 coins for harder missions.',
    challenge: `This child is on a ${currentStreak}-day streak and has completed ${totalCompletedMissions} missions recently. Push them with genuinely challenging missions — teach someone what you learned, lead a family project, invent something, or take on a real responsibility. Include one "boss mission" worth 15 coins. This is Round ${currentRound + 1} of the day.`,
  };

  // ── Weather resolution ──────────────────────────────────────────────────────
  const resolvedLocationCity: string | null =
    locationCity ?? childRow?.location_city ?? (familyPersonalization.location as string | null) ?? null;
  const resolvedLocationLabel: string =
    locationLabel ?? childRow?.location_label ?? 'home';

  let resolvedWeatherSummary: string | null = weatherSummary ?? null;
  let isOutdoorFriendly = false;
  let weatherHint = '';
  let weatherDetails = '';
  try {
    if (!resolvedWeatherSummary) {
      const resolvedLocation: string | null = location ?? resolvedLocationCity ?? (familyPersonalization.location as string | null) ?? null;
      if (resolvedLocation) {
        const wxData = await fetchWeatherCached(resolvedLocation);
        if (wxData) {
          const lc = wxData.condition.toLowerCase();
          const isRainy = lc.includes('rain') || lc.includes('shower');
          const isSnowy = lc.includes('snow');
          const isHot   = wxData.tempC >= 28;
          const isCold  = wxData.tempC <= 5;
          isOutdoorFriendly = wxData.isOutdoorFriendly;
          resolvedWeatherSummary = `${wxData.condition}, ${wxData.tempC}°C (feels like ${wxData.feelsLikeC}°C), high ${wxData.highC}°C, low ${wxData.lowC}°C`;
          if (wxData.windSpeed)         resolvedWeatherSummary += `, wind ${wxData.windSpeed} km/h`;
          if (wxData.precipProbability) resolvedWeatherSummary += `, ${wxData.precipProbability}% chance of rain`;
          if (wxData.uvIndex)           resolvedWeatherSummary += `, UV index ${wxData.uvIndex}`;
          weatherHint = weatherMissionHint({ condition: wxData.condition, tempC: wxData.tempC, isRainy, isSnowy, isHot, isCold, summary: '' });
          weatherDetails = resolvedWeatherSummary;
        }
      }
    } else {
      isOutdoorFriendly = /outdoor friendly/i.test(resolvedWeatherSummary);
      weatherDetails = resolvedWeatherSummary;
    }
  } catch {
    // Weather is optional — proceed without it
  }

  // ── Time / season context ───────────────────────────────────────────────────
  const nowDate = new Date();
  const hour = nowDate.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dayOfWeek = nowDate.getDay();
  const dayType = [0, 6].includes(dayOfWeek) ? 'weekend' : 'weekday';
  const month = nowDate.getMonth();
  const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';
  const dayTheme = THEMES[dayOfWeek];

  // ── Family Growth Profile ───────────────────────────────────────────────────
  const fp = familyPersonalization;
  const growthProfileLines: string[] = [];
  if (fp.primary_goal)           growthProfileLines.push(`Parent Goal: ${fp.primary_goal}`);
  if (fp.child_description)      growthProfileLines.push(`Child Profile: ${fp.child_description}`);
  if (fp.parent_involvement)     growthProfileLines.push(`Parent Style: ${fp.parent_involvement}`);
  if (fp.motivation_preference)  growthProfileLines.push(`Child Motivated By: ${fp.motivation_preference}`);
  if (Array.isArray(fp.selected_habits) && fp.selected_habits.length > 0)
    growthProfileLines.push(`Priority Habits: ${(fp.selected_habits as string[]).join(', ')}`);
  if (fp.screen_time_preference) growthProfileLines.push(`Daily Screen Time Budget: ${fp.screen_time_preference}`);
  if (fp.routine_timing)         growthProfileLines.push(`Routine Timing: ${fp.routine_timing}`);
  if (fp.success_definition)     growthProfileLines.push(`Success Looks Like: ${fp.success_definition}`);

  const growthProfileSection = growthProfileLines.length > 0
    ? `\n\nFamily Growth Profile:\n${growthProfileLines.join('\n')}`
    : '';

  // ── Diversity directives ────────────────────────────────────────────────────
  const diversitySection = [
    overrepresentedCategories.length > 0
      ? `AVOID these over-used categories (used 3+ times this week): ${overrepresentedCategories.join(', ')}.`
      : '',
    underrepresentedCategories.length > 0
      ? `PRIORITISE these under-used categories (not used this week): ${underrepresentedCategories.join(', ')}.`
      : '',
    completedTodayTitles.length > 0
      ? `NEVER repeat these missions already completed today: ${completedTodayTitles.slice(0, 15).join(' | ')}.`
      : '',
  ].filter(Boolean).join('\n');

  // ── Location line ───────────────────────────────────────────────────────────
  const locationLine = resolvedLocationCity
    ? `Location: ${resolvedLocationLabel} in ${resolvedLocationCity}.`
    : `Location: ${resolvedLocationLabel}.`;

  // ── System prompt ───────────────────────────────────────────────────────────
  const systemPrompt = `You are BrytThrive's AI parenting coach and mission designer.
Your job: generate exactly ${requestedCount} personalized child missions that feel fresh, meaningful, and age-appropriate.

CHILD CONTEXT:
- Age band: ${band}
- Mood: ${mood ?? 'not set'}${mood && MOOD_MISSION_HINTS[mood as MoodKey] ? ` → ${MOOD_MISSION_HINTS[mood as MoodKey]}` : ''}
- Streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}
- Current mission round today: ${currentRound} (0 = first pack, 1+ = bonus rounds)
- ${locationLine}
- Time: ${timeOfDay}, ${dayType}, ${season}
- Today's theme: ${dayTheme.name} — lean toward ${dayTheme.focusCategories.join(', ')}
${weatherDetails ? `- Weather: ${weatherDetails}.${weatherHint ? ` ${weatherHint}` : ''} ${isOutdoorFriendly ? 'Outdoor missions are appropriate.' : 'Prefer indoor missions.'}` : '- Weather: unavailable — skip weather-specific missions.'}
${growthProfileSection}

DIFFICULTY LEVEL: ${difficultyLevel.toUpperCase()}
${difficultyInstructions[difficultyLevel]}

DIVERSITY RULES:
${diversitySection || 'No recent history — good variety encouraged.'}
No category should appear more than twice in this pack.
Rotate across: ${ALL_CATEGORIES.join(', ')}.

MISSION PACK SELECTION:
Choose the single most contextually appropriate pack name from this list: ${MISSION_PACKS.map(p => `"${p}"`).join(', ')}.
Select based on: mood + weather + time of day + round number + day theme.
Examples: rainy morning → "Rainy Day Adventures"; high-streak afternoon round 2 → "Weekend Challenge"; tired child → "Calm & Reset".

PROGRESSIVE DIFFICULTY EXAMPLES (scale to age band):
- Reading: "Read 10 min" → "Read 20 min" → "Read a chapter" → "Teach someone what you learned"
- Movement: "10 jumping jacks" → "20 min run" → "Obstacle course" → "Lead a family workout"
- Kindness: "Say something kind" → "Write a note" → "Plan a surprise for someone" → "Organise a family activity"

OUTPUT FORMAT — respond with exactly this JSON structure, nothing else:
{
  "pack": "<chosen pack name>",
  "missions": [
    {
      "title": "<max 12 words, child-friendly, action-oriented>",
      "category": "<one of: ${ALL_CATEGORIES.join(', ')}>",
      "screen_time_reward": <5, 10, or 15>,
      "reasoning": "<1 sentence: why this mission was chosen for this child right now>"
    }
  ]
}

Rules:
- Exactly ${requestedCount} missions in the array.
- Child-friendly language — no adult jargon.
- Varied and fun — missions should feel like adventures, not chores.
- Never expose the parent's raw onboarding answers to the child (reframe them naturally).
- Every title must be unique — no duplicates within the pack.`;

  // ── Claude call ─────────────────────────────────────────────────────────────
  let missions: MissionDraft[] = [];
  let packName = '';
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1536,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate exactly ${requestedCount} missions for the ${band} age range. Return only the JSON object.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(stripped);

    // New structured format: {pack, missions[]}
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
      packName = typeof parsed.pack === 'string' ? parsed.pack : '';
      missions = parsed.missions as MissionDraft[];

      // Log reasoning server-side for debugging (never sent to client or child)
      if (process.env.NODE_ENV !== 'production' || process.env.LOG_MISSION_REASONING === '1') {
        console.log(`[generate-missions] Pack: "${packName}" | Round: ${currentRound} | Difficulty: ${difficultyLevel} | Streak: ${currentStreak}`);
        for (const m of missions as (MissionDraft & { reasoning?: string })[]) {
          if (m.reasoning) console.log(`  [${m.category}] ${m.title} — ${m.reasoning}`);
        }
      }
    } else if (Array.isArray(parsed) && parsed.length > 0) {
      // Fallback: old array format (Claude ignored the new schema)
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

  // Delete today's incomplete missions before inserting the new pack.
  const delWithDate = await supabase
    .from('missions')
    .delete()
    .eq('child_id', childId)
    .eq('is_completed', false)
    .eq('mission_date', missionDate);

  if (delWithDate.error) {
    console.warn('[generate-missions] delete with mission_date failed, retrying without:', delWithDate.error.message);
    const delFallback = await supabase
      .from('missions')
      .delete()
      .eq('child_id', childId)
      .eq('is_completed', false);
    if (delFallback.error) {
      console.error('[generate-missions] fallback delete failed:', delFallback.error.message);
    }
  }

  // Strip internal `reasoning` field before DB insert (not a DB column).
  const rowsWithDate = missions.map((m) => ({
    child_id: childId,
    title: m.title,
    category: m.category ?? 'general',
    screen_time_reward: m.screen_time_reward ?? 5,
    is_completed: false,
    mission_date: missionDate,
  }));

  let { data, error } = await supabase.from('missions').insert(rowsWithDate).select();

  if (error) {
    console.warn('[generate-missions] insert with mission_date failed, retrying without:', error.message);
    const rowsNoDate = missions.map((m) => ({
      child_id: childId,
      title: m.title,
      category: m.category ?? 'general',
      screen_time_reward: m.screen_time_reward ?? 5,
      is_completed: false,
    }));
    const retry = await supabase.from('missions').insert(rowsNoDate).select();
    if (retry.error) {
      console.error('[generate-missions] mission insert failed (both attempts):', retry.error.message);
      return NextResponse.json({ error: retry.error.message }, { status: 500 });
    }
    data = retry.data;
    error = null;
  }

  return NextResponse.json({
    tasks: data,
    generated: data?.length ?? 0,
    requested: missions.length,
    pack: packName || undefined,
  });
}
