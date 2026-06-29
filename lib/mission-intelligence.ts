/**
 * Mission Intelligence — separates AI reasoning from the HTTP route handler.
 *
 * Responsibilities:
 *   1. Build a rich MissionContext from DB + request signals
 *   2. Construct the Claude prompt
 *   3. Call Claude and parse the structured response
 *   4. Return a MissionPack (fallback-safe)
 */

import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { weatherMissionHint, fetchWeatherCached } from '@/lib/weather';
import { MOOD_MISSION_HINTS, type MoodKey } from '@/lib/mood';
import THEMES from '@/lib/themes';

// ── Public types ────────────────────────────────────────────────────────────

export type MissionDraft = {
  title: string;
  category?: string;
  screen_time_reward?: number;
};

export type MissionPack = {
  name: string;
  missions: MissionDraft[];
  difficultyLevel: DifficultyLevel;
  isWeatherAvailable: boolean;
};

type DifficultyLevel = 'beginner' | 'standard' | 'advanced' | 'challenge';

/** Everything needed to construct an intelligent mission prompt. */
export type MissionContext = {
  // Child signals
  childId: string;
  ageBand: string;
  resolvedAge: number | null;
  mood: string | null;

  // Time & environment
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayType: 'weekday' | 'weekend';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  dayTheme: { name: string; focusCategories: string[] };
  locationLabel: string;
  locationCity: string | null;

  // Weather (only set when live data was fetched)
  weatherDetails: string | null;
  weatherHint: string | null;
  isOutdoorFriendly: boolean;

  // History & difficulty
  recentMissionHistory: { title: string; category: string | null; is_completed: boolean }[];
  completedTodayTitles: string[];
  currentStreak: number;
  totalCompletedMissions: number;
  currentRound: number;
  difficultyLevel: DifficultyLevel;

  // Category diversity
  overrepresentedCategories: string[];
  underrepresentedCategories: string[];

  // Family Growth Profile
  familyPersonalization: Record<string, unknown>;

  // Generation params
  requestedCount: number;
};

// ── Constants ───────────────────────────────────────────────────────────────

export const ALL_CATEGORIES = [
  'movement', 'responsibility', 'emotional_intelligence', 'learning',
  'creativity', 'family_connection', 'kindness', 'mindfulness',
  'healthy_habits', 'outdoor', 'adventure',
] as const;

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
] as const;

const DIFFICULTY_INSTRUCTIONS: Record<DifficultyLevel, (ctx: Pick<MissionContext, 'currentStreak' | 'totalCompletedMissions' | 'currentRound'>) => string> = {
  beginner:  () => 'Keep missions short and achievable — 5-10 min each. Build confidence with easy wins. Screen time reward: 5 coins per mission.',
  standard:  () => 'Standard difficulty. Mix quick wins (5 min) with moderate challenges (15 min). Screen time: 5-10 coins.',
  advanced:  () => 'Increase challenge — include at least 2 missions requiring 20+ minutes or multi-step effort. Add stretch goals. Screen time: 10-15 coins for harder missions.',
  challenge: (ctx) => `This child is on a ${ctx.currentStreak}-day streak and has completed ${ctx.totalCompletedMissions} missions recently. Push them with genuinely challenging missions — teach someone what you learned, lead a family project, invent something, or take on a real responsibility. Include one "boss mission" worth 15 coins. This is Round ${ctx.currentRound + 1} of the day.`,
};

// ── Age-band fallbacks ───────────────────────────────────────────────────────

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

// ── Pure helpers ─────────────────────────────────────────────────────────────

export function ageBand(age: number): string {
  if (age <= 5) return '3-5';
  if (age <= 7) return '6-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14+';
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysAgoString(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function computeSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function computeTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// Returns the ideal mission count for a child based on mood and time of day.
// Late evening (8pm+) hard-caps at 3 regardless of mood.
function computeMissionCount(mood: string | null, hour: number): number {
  if (hour >= 20) return 3; // late evening hard cap
  const m = mood?.toLowerCase() ?? '';
  if (m === 'tired' || m === 'frustrated') return 3;
  if (m === 'calm') return 4;
  if (m === 'happy' || m === 'excited') return 5;
  return 5; // default
}

function computeDifficulty(
  currentStreak: number,
  totalCompletedMissions: number,
  currentRound: number,
): DifficultyLevel {
  if (currentStreak === 0 && totalCompletedMissions < 5) return 'beginner';
  if (currentStreak < 3 && currentRound === 0) return 'standard';
  if (currentStreak >= 7 || currentRound >= 2) return 'challenge';
  return 'advanced';
}

// ── Context builder ──────────────────────────────────────────────────────────

export async function buildMissionContext(params: {
  childId: string;
  childAge?: number | null;
  childRow: { age: number | null; location_label?: string | null; location_city?: string | null };
  mood?: string | null;
  location?: string | null;
  locationLabel?: string | null;
  locationCity?: string | null;
  weatherSummary?: string | null;
  missionRound?: number;
  requestedCount?: number;
  resolvedParentId: string;
  supabase: SupabaseClient;
  serviceSupabase: SupabaseClient;
}): Promise<MissionContext> {
  const {
    childId, childAge, childRow, mood, location, locationLabel, locationCity,
    weatherSummary, missionRound = 0, requestedCount = 10,
    resolvedParentId, supabase, serviceSupabase,
  } = params;

  const currentRound = Math.max(0, missionRound);
  const resolvedAge: number | null = childAge ?? childRow.age ?? null;
  const band = resolvedAge ? ageBand(resolvedAge) : '8-10';

  const nowDate = new Date();
  const hour = nowDate.getHours();
  const dayOfWeek = nowDate.getDay();
  const month = nowDate.getMonth();

  const sevenDaysAgoStr = daysAgoString(7);

  // ── Parallel DB fetch ─────────────────────────────────────────────────────
  let recentMissionHistory: { title: string; category: string | null; is_completed: boolean }[] = [];
  let completedTodayTitles: string[] = [];
  let currentStreak = 0;
  let familyPersonalization: Record<string, unknown> = {};

  try {
    const [historyRes, streakRes, planRes] = await Promise.all([
      supabase
        .from('missions')
        .select('title, category, is_completed')
        .eq('child_id', childId)
        .gte('mission_date', sevenDaysAgoStr)
        .order('mission_date', { ascending: false })
        .limit(80),
      supabase
        .from('streaks')
        .select('current_streak')
        .eq('child_id', childId)
        .maybeSingle(),
      serviceSupabase
        .from('family_plans')
        .select('personalization_data')
        .eq('parent_id', resolvedParentId)
        .maybeSingle(),
    ]);

    if (!historyRes.error && historyRes.data) {
      recentMissionHistory = historyRes.data as { title: string; category: string | null; is_completed: boolean }[];
      completedTodayTitles = recentMissionHistory.filter(m => m.is_completed).map(m => m.title);
    } else if (historyRes.error) {
      console.warn('[mission-intelligence] mission history fetch failed:', historyRes.error.message);
    }

    if (!streakRes.error && streakRes.data) {
      currentStreak = (streakRes.data as { current_streak: number }).current_streak ?? 0;
    } else if (streakRes.error) {
      console.warn('[mission-intelligence] streak fetch failed:', streakRes.error.message);
    }

    familyPersonalization = (planRes.data?.personalization_data as Record<string, unknown>) ?? {};
    if (planRes.error) {
      console.warn('[mission-intelligence] family plan fetch failed:', planRes.error.message);
    }
  } catch (err) {
    console.warn('[mission-intelligence] context fetch error (non-fatal):', err);
  }

  // ── Category diversity ────────────────────────────────────────────────────
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
  const underrepresentedCategories = (ALL_CATEGORIES as readonly string[])
    .filter(cat => (categoryCounts[cat] ?? 0) === 0);

  const totalCompletedMissions = recentMissionHistory.filter(m => m.is_completed).length;
  const difficultyLevel = computeDifficulty(currentStreak, totalCompletedMissions, currentRound);

  // ── Weather ───────────────────────────────────────────────────────────────
  const resolvedLocationCity: string | null =
    locationCity ?? childRow.location_city ?? (familyPersonalization.location as string | null) ?? null;
  const resolvedLocationLabel: string =
    locationLabel ?? childRow.location_label ?? 'home';

  let resolvedWeatherSummary: string | null = weatherSummary ?? null;
  let isOutdoorFriendly = false;
  let weatherHint: string | null = null;
  let weatherDetails: string | null = null;

  try {
    if (!resolvedWeatherSummary) {
      const resolvedLocation: string | null =
        location ?? resolvedLocationCity ?? (familyPersonalization.location as string | null) ?? null;
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
    // Weather is always optional
  }

  return {
    childId,
    ageBand: band,
    resolvedAge,
    mood: mood ?? null,
    timeOfDay: computeTimeOfDay(hour),
    dayType: [0, 6].includes(dayOfWeek) ? 'weekend' : 'weekday',
    season: computeSeason(month),
    dayTheme: THEMES[dayOfWeek],
    locationLabel: resolvedLocationLabel,
    locationCity: resolvedLocationCity,
    weatherDetails,
    weatherHint,
    isOutdoorFriendly,
    recentMissionHistory,
    completedTodayTitles,
    currentStreak,
    totalCompletedMissions,
    currentRound,
    difficultyLevel,
    overrepresentedCategories,
    underrepresentedCategories,
    familyPersonalization,
    requestedCount: computeMissionCount(mood ?? null, hour),
  };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: MissionContext): string {
  const fp = ctx.familyPersonalization;
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

  const locationLine = ctx.locationCity
    ? `Location: ${ctx.locationLabel} in ${ctx.locationCity}.`
    : `Location: ${ctx.locationLabel}.`;

  const diversityLines = [
    ctx.overrepresentedCategories.length > 0
      ? `AVOID these over-used categories (used 3+ times this week): ${ctx.overrepresentedCategories.join(', ')}.`
      : '',
    ctx.underrepresentedCategories.length > 0
      ? `PRIORITISE these under-used categories (not used this week): ${ctx.underrepresentedCategories.join(', ')}.`
      : '',
    ctx.completedTodayTitles.length > 0
      ? `NEVER repeat these missions already completed today: ${ctx.completedTodayTitles.slice(0, 15).join(' | ')}.`
      : '',
  ].filter(Boolean).join('\n');

  const moodLine = ctx.mood && MOOD_MISSION_HINTS[ctx.mood as MoodKey]
    ? ` → ${MOOD_MISSION_HINTS[ctx.mood as MoodKey]}`
    : '';

  const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[ctx.difficultyLevel]({
    currentStreak: ctx.currentStreak,
    totalCompletedMissions: ctx.totalCompletedMissions,
    currentRound: ctx.currentRound,
  });

  const weatherLine = ctx.weatherDetails
    ? `- Weather: ${ctx.weatherDetails}.${ctx.weatherHint ? ` ${ctx.weatherHint}` : ''} ${ctx.isOutdoorFriendly ? 'Outdoor missions are appropriate.' : 'Prefer indoor missions.'}`
    : '- Weather: unavailable — skip weather-specific missions.';

  // Extract temp for weather rules (parse first number from weatherDetails)
  const tempMatch = ctx.weatherDetails?.match(/(-?\d+)°C/);
  const tempC = tempMatch ? parseInt(tempMatch[1], 10) : null;
  const isEvening = ctx.timeOfDay === 'evening';
  const isLateEvening = new Date().getHours() >= 20;
  const weatherCondLower = (ctx.weatherDetails ?? '').toLowerCase();
  const isRainyOrCloudy = weatherCondLower.includes('rain') || weatherCondLower.includes('shower') || weatherCondLower.includes('cloud') || weatherCondLower.includes('overcast');

  const outdoorRule = (() => {
    if (tempC !== null && tempC < 5) return 'Temperature is below 5°C — strictly indoor missions only. No outdoor missions.';
    if (tempC !== null && tempC < 10) return 'Temperature is below 10°C — no outdoor missions. Replace with indoor movement, creative, or mindfulness alternatives.';
    if (isRainyOrCloudy && isEvening) return 'Rainy or cloudy evening — no outdoor missions. Replace with indoor alternatives.';
    if (tempC !== null && tempC >= 18 && ctx.isOutdoorFriendly) return 'Sunny and warm — outdoor missions are encouraged and should appear in at least 1-2 slots.';
    return ctx.isOutdoorFriendly ? 'Outdoor missions are appropriate.' : 'Prefer indoor missions.';
  })();

  return `You are BrytThrive's AI parenting coach and mission designer.
Your job: generate exactly ${ctx.requestedCount} personalized child missions that feel fresh, meaningful, and age-appropriate.

CHILD CONTEXT:
- Age band: ${ctx.ageBand}
- Mood: ${ctx.mood ?? 'not set'}${moodLine}
- Streak: ${ctx.currentStreak} day${ctx.currentStreak !== 1 ? 's' : ''}
- Current mission round today: ${ctx.currentRound} (0 = first pack, 1+ = bonus rounds)
- ${locationLine}
- Time: ${ctx.timeOfDay}${isLateEvening ? ' (late evening — wind-down only)' : ''}, ${ctx.dayType}, ${ctx.season}
- Today's theme: ${ctx.dayTheme.name} — lean toward ${ctx.dayTheme.focusCategories.join(', ')}
${weatherLine}
${growthProfileSection}

MOOD ENERGY RULES — follow these strictly:
- tired or calm: NO high-energy missions (no running, dancing, jumping, outdoor adventures). Choose reading, drawing, breathing exercises, gentle creative tasks, journaling, quiet family connection.
- frustrated: Begin with ONE physical release mission (movement), then transition to calm creative or connection missions.
- excited or happy: Full variety allowed. Prioritise outdoor and movement if weather permits.
- Any mood in evening (after 6pm): Favour wind-down missions — mindfulness, reading, gratitude, family connection, creative calm. No outdoor missions after dark or in cold weather (below 15°C).

WEATHER RULES:
- ${outdoorRule}
- Below 10°C or rainy/cloudy evening: No outdoor missions. Replace with indoor movement, creative, or mindfulness alternatives.
- Below 5°C: Strictly indoor missions only.
- Sunny and above 18°C: Outdoor missions are encouraged and should appear in at least 1-2 slots.

DIFFICULTY LEVEL: ${ctx.difficultyLevel.toUpperCase()}
${difficultyInstruction}

DIVERSITY RULES:
${diversityLines || 'No recent history — good variety encouraged.'}
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
- Exactly ${ctx.requestedCount} missions in the array.
- Child-friendly language — no adult jargon.
- Varied and fun — missions should feel like adventures, not chores.
- Never expose the parent's raw onboarding answers to the child (reframe them naturally).
- Every title must be unique — no duplicates within the pack.`;
}

// ── Main generation function ──────────────────────────────────────────────────

export async function generateMissionPack(ctx: MissionContext): Promise<MissionPack> {
  let missions: MissionDraft[] = [];
  let packName = '';

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1536,
      system: buildSystemPrompt(ctx),
      messages: [
        {
          role: 'user',
          content: `Generate exactly ${ctx.requestedCount} missions for the ${ctx.ageBand} age range. Return only the JSON object.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(stripped);

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
      packName = typeof parsed.pack === 'string' ? parsed.pack : '';
      missions = parsed.missions as MissionDraft[];

      if (process.env.NODE_ENV !== 'production' || process.env.LOG_MISSION_REASONING === '1') {
        console.log(`[mission-intelligence] Pack: "${packName}" | Round: ${ctx.currentRound} | Difficulty: ${ctx.difficultyLevel} | Streak: ${ctx.currentStreak}`);
        for (const m of missions as (MissionDraft & { reasoning?: string })[]) {
          if (m.reasoning) console.log(`  [${m.category}] ${m.title} — ${m.reasoning}`);
        }
      }
    } else if (Array.isArray(parsed) && parsed.length > 0) {
      // Fallback: Claude returned old array format
      missions = parsed as MissionDraft[];
    } else {
      console.warn('[mission-intelligence] Claude returned unexpected structure, falling back');
    }
  } catch (err) {
    console.error('[mission-intelligence] Claude call failed, using fallback:', err);
  }

  if (missions.length === 0) {
    const fallbacks = FALLBACK[ctx.ageBand] ?? FALLBACK['default'];
    missions = fallbacks.slice(0, ctx.requestedCount);
    console.warn(`[mission-intelligence] Using static fallback for age band: ${ctx.ageBand}`);
  }

  return {
    name: packName,
    missions: missions.slice(0, ctx.requestedCount),
    difficultyLevel: ctx.difficultyLevel,
    isWeatherAvailable: ctx.weatherDetails !== null,
  };
}
