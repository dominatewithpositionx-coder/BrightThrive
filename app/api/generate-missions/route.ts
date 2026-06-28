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

function makeRequestId() {
  return Math.random().toString(36).slice(2, 10);
}

type MissionDraft = {
  title: string;
  category?: string;
  screen_time_reward?: number;
};

// Structured logger — every line is prefixed with the request ID for easy log filtering.
// Usage: log(rid, 'step_name', { key: value })
function log(rid: string, step: string, data?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { debugRequestId: rid, step };
  if (data) Object.assign(payload, data);
  console.log(`[mission-debug ${rid}]`, JSON.stringify(payload));
}

// Build a structured error response. The `error` field is always user-safe.
function errResponse(
  rid: string,
  status: number,
  safeMessage: string,
  opts: {
    errorStep: string;
    errorType: string;
    fallbackAttempted?: boolean;
    fallbackSucceeded?: boolean;
    detail?: string;
  }
) {
  log(rid, 'error_response', { status, errorStep: opts.errorStep, errorType: opts.errorType, safeMessage, detail: opts.detail });
  return NextResponse.json(
    {
      error: safeMessage,
      debugRequestId: rid,
      errorStep: opts.errorStep,
      errorType: opts.errorType,
      fallbackAttempted: opts.fallbackAttempted ?? false,
      fallbackSucceeded: opts.fallbackSucceeded ?? false,
    },
    { status }
  );
}

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

const CATEGORIES = ['movement', 'responsibility', 'emotional_intelligence', 'learning', 'creativity', 'family_connection', 'kindness', 'mindfulness'];

export async function POST(req: NextRequest) {
  const rid = makeRequestId();
  log(rid, 'request_received', { url: req.url, method: req.method });

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    log(rid, 'body_parse_error', { error: String(e) });
    return errResponse(rid, 400, 'Invalid request.', { errorStep: 'body_parse', errorType: 'parse_error' });
  }

  const {
    childId, childAge, parentId, location, locationLabel, locationCity,
    mood, weatherSummary, count,
  } = body as {
    childId?: string; childAge?: number; parentId?: string; location?: string;
    locationLabel?: string; locationCity?: string; mood?: string;
    weatherSummary?: string; count?: number;
  };

  log(rid, 'params', {
    hasChildId: !!childId,
    hasChildAge: childAge != null,
    hasParentId: !!parentId,
    hasMood: !!mood,
    hasWeather: !!weatherSummary,
    count: count ?? null,
  });

  if (!childId) {
    return errResponse(rid, 400, 'childId is required.', { errorStep: 'params_validation', errorType: 'missing_param' });
  }

  const requestedCount = Math.min(15, Math.max(8, Number(count) || 10));

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  log(rid, 'auth_header_check', { hasToken: !!callerToken, path: callerToken ? 'bearer_session' : parentId ? 'kid_view_parentId' : 'none' });

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
    // Parent dashboard — Bearer token path
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser();
    if (authError || !user) {
      log(rid, 'auth_getUser_failed', { error: authError?.message ?? 'no user returned' });
      return errResponse(rid, 401, 'Session expired. Please refresh and try again.', {
        errorStep: 'auth_getUser', errorType: 'auth_error', detail: authError?.message,
      });
    }
    log(rid, 'auth_getUser_ok', { userId: user.id });
    resolvedParentId = (parentId as string | undefined) ?? user.id;

    const { data, error: childError } = await anonSupabase
      .from('children')
      .select('id, age, location_label, location_city')
      .eq('id', childId)
      .eq('parent_id', resolvedParentId)
      .single();

    if (childError || !data) {
      log(rid, 'child_lookup_session_failed', {
        error: childError?.message ?? 'no data', code: childError?.code,
        hint: childError?.hint, details: childError?.details,
      });
      return errResponse(rid, 403, 'Child not found.', {
        errorStep: 'child_lookup_session', errorType: childError?.code ?? 'not_found',
        detail: childError?.message,
      });
    }
    log(rid, 'child_lookup_session_ok', { childId: (data as { id: string }).id, hasAge: (data as { age: number | null }).age != null });
    childRow = data as { id: string; age: number | null; location_label?: string | null; location_city?: string | null };

  } else if (parentId) {
    // Kid View — no session; verify child↔parent via service role read
    let serviceSupabase;
    try {
      serviceSupabase = createServiceSupabaseClient();
      log(rid, 'service_client_created_kid_view');
    } catch (err) {
      log(rid, 'service_client_creation_failed', { error: String(err) });
      return errResponse(rid, 500, 'Server configuration error.', {
        errorStep: 'service_client_init', errorType: 'config_error', detail: String(err),
      });
    }

    const { data, error: childError } = await serviceSupabase
      .from('children')
      .select('id, age, parent_id, location_label, location_city')
      .eq('id', childId)
      .single();

    const parentMatch = data && (data as { parent_id: string }).parent_id === parentId;
    if (childError || !parentMatch) {
      log(rid, 'child_lookup_kid_view_failed', {
        error: childError?.message ?? 'parent mismatch', code: childError?.code,
      });
      return errResponse(rid, 403, 'Child not found.', {
        errorStep: 'child_lookup_kid_view', errorType: childError?.code ?? 'parent_mismatch',
        detail: childError?.message,
      });
    }
    log(rid, 'child_lookup_kid_view_ok', { childId: (data as { id: string }).id });
    resolvedParentId = parentId as string;
    childRow = {
      id: (data as { id: string }).id,
      age: (data as { age: number | null }).age,
      location_label: (data as { location_label?: string | null }).location_label,
      location_city: (data as { location_city?: string | null }).location_city,
    };
  } else {
    log(rid, 'no_auth_no_parentId');
    return errResponse(rid, 401, 'Unauthorized.', { errorStep: 'auth_check', errorType: 'no_credentials' });
  }

  // ── Rate limit ───────────────────────────────────────────────────────────────
  const rlKey = `child:${childId}`;
  const now = Date.now();
  const lastGen = rateLimitMap.get(rlKey);
  if (lastGen && now - lastGen < RATE_LIMIT_MS) {
    const secondsLeft = Math.ceil((RATE_LIMIT_MS - (now - lastGen)) / 1000);
    log(rid, 'rate_limited', { secondsLeft });
    return errResponse(rid, 429, `Please wait ${secondsLeft} seconds before generating new missions.`, {
      errorStep: 'rate_limit', errorType: 'rate_limited',
    });
  }
  rateLimitMap.set(rlKey, now);
  if (rateLimitMap.size > 5000) {
    for (const [k, ts] of rateLimitMap) {
      if (now - ts > RATE_LIMIT_MS * 10) rateLimitMap.delete(k);
    }
  }
  log(rid, 'rate_limit_passed');

  // ── Supabase write client ────────────────────────────────────────────────────
  const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY);
  log(rid, 'supabase_write_client', { hasServiceKey, strategy: hasServiceKey ? 'service_role' : 'anon_with_token' });

  const supabase = hasServiceKey
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : anonSupabase;

  // ── Age band + family personalization ────────────────────────────────────────
  const resolvedAge: number | null = (childAge as number | undefined) ?? childRow?.age ?? null;
  const band = resolvedAge ? ageBand(resolvedAge) : '8-10';
  log(rid, 'age_resolved', { resolvedAge, band });

  let familyPersonalization: Record<string, unknown> = {};
  try {
    const planClient = createServiceSupabaseClient();
    const { data: plan, error: planError } = await planClient
      .from('family_plans')
      .select('personalization_data')
      .eq('parent_id', resolvedParentId)
      .maybeSingle();
    if (planError) {
      log(rid, 'family_plan_lookup_failed', { error: planError.message, code: planError.code });
    } else {
      familyPersonalization = (plan?.personalization_data as Record<string, unknown>) ?? {};
      log(rid, 'family_plan_loaded', { hasData: Object.keys(familyPersonalization).length > 0 });
    }
  } catch (err) {
    log(rid, 'family_plan_exception', { error: String(err) });
    // Non-fatal — generation continues without personalization
  }

  // ── Location resolution ───────────────────────────────────────────────────────
  const resolvedLocationCity: string | null =
    (locationCity as string | undefined) ?? childRow?.location_city ?? (familyPersonalization.location as string | null) ?? null;
  const resolvedLocationLabel: string =
    (locationLabel as string | undefined) ?? childRow?.location_label ?? 'home';

  // ── Weather ───────────────────────────────────────────────────────────────────
  let resolvedWeatherSummary: string | null = (weatherSummary as string | undefined) ?? null;
  let isOutdoorFriendly = false;
  let weatherHint = '';
  let weatherDetails = '';

  try {
    if (!resolvedWeatherSummary) {
      const resolvedLocation = (location as string | undefined) ?? resolvedLocationCity ?? (familyPersonalization.location as string | null) ?? null;
      log(rid, 'weather_lookup', { resolvedLocation: resolvedLocation ?? 'none' });
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
          log(rid, 'weather_loaded', { condition: wxData.condition, isOutdoorFriendly });
        } else {
          log(rid, 'weather_no_data');
        }
      } else {
        log(rid, 'weather_skipped_no_location');
      }
    } else {
      isOutdoorFriendly = /outdoor friendly/i.test(resolvedWeatherSummary);
      weatherDetails = resolvedWeatherSummary;
      log(rid, 'weather_from_request', { isOutdoorFriendly });
    }
  } catch (err) {
    log(rid, 'weather_exception', { error: String(err) });
    // Weather is optional — proceed without it
  }

  // ── Build prompt ──────────────────────────────────────────────────────────────
  const neededCategories = isOutdoorFriendly
    ? `${CATEGORIES.join(', ')}, outdoor, adventure`
    : CATEGORIES.join(', ');

  const ageBandNum = parseInt(band, 10);
  const healthyHabitsLine = ageBandNum >= 6
    ? '\nInclude one healthy_habits mission (hydration, sleep, nutrition, or hygiene).'
    : '';

  const dayTheme = THEMES[new Date().getDay()];
  const themeLine = `\nToday is ${dayTheme.name} — lean toward ${dayTheme.focusCategories.join(', ')} missions but ensure good variety.`;

  const nowDate = new Date();
  const hour = nowDate.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dayType = [0, 6].includes(nowDate.getDay()) ? 'weekend' : 'weekday';
  const month = nowDate.getMonth();
  const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';

  const locationLine = resolvedLocationCity
    ? `\nLocation: child is at ${resolvedLocationLabel} in ${resolvedLocationCity}.`
    : `\nLocation: child is at ${resolvedLocationLabel}.`;
  const contextLine = `\nContext: ${timeOfDay}, ${dayType}, ${season}.`;

  const fp = familyPersonalization;
  const growthProfileLines: string[] = [];
  if (fp.primary_goal)          growthProfileLines.push(`Parent's Primary Goal: ${fp.primary_goal}`);
  if (fp.child_description)     growthProfileLines.push(`Child Profile: ${fp.child_description}`);
  if (fp.parent_involvement)    growthProfileLines.push(`Parent Involvement Style: ${fp.parent_involvement}`);
  if (fp.motivation_preference) growthProfileLines.push(`What Motivates This Child: ${fp.motivation_preference}`);
  if (Array.isArray(fp.selected_habits) && fp.selected_habits.length > 0)
    growthProfileLines.push(`Priority Habits: ${(fp.selected_habits as string[]).join(', ')}`);
  if (fp.screen_time_preference) growthProfileLines.push(`Screen Time Earned Per Day: ${fp.screen_time_preference}`);
  if (fp.routine_timing)         growthProfileLines.push(`Routine Timing: ${fp.routine_timing}`);
  if (fp.success_definition)     growthProfileLines.push(`Parent's Definition of Success: ${fp.success_definition}`);

  const growthProfileSection = growthProfileLines.length > 0
    ? `\n\nFamily Growth Profile Context:\n${growthProfileLines.join('\n')}\nUse this context to shape mission selection, wording, difficulty, emotional encouragement, and whether to include family collaboration or screen-replacement activities.`
    : '';

  const systemPrompt = `You are BrytThrive's mission engine. Generate exactly ${requestedCount} child missions for age band "${band}".
Weather: ${weatherDetails || 'not available'}.${weatherHint ? ` ${weatherHint}` : ''}
Mood: ${mood ?? 'not set'}.${mood && MOOD_MISSION_HINTS[mood as MoodKey] ? ` ${MOOD_MISSION_HINTS[mood as MoodKey]}` : ''}${locationLine}${contextLine}${themeLine}${growthProfileSection}
Required distribution:
- Daily (3-4): movement, responsibility, learning, healthy_habits
- Bonus (3-4): creativity, kindness, mindfulness${isOutdoorFriendly ? ', outdoor, adventure' : ''}
- Special (2-3): family_connection, emotional_intelligence
Available categories: ${neededCategories}.${healthyHabitsLine}
Tailor missions to the child's location (${resolvedLocationLabel}) and current context. ${isOutdoorFriendly ? 'Weather permits outdoor activities.' : 'Prioritise indoor activities.'}
Rules: child-friendly language, max 10 words per title, no repetition, varied and fun. Never expose personalization answers directly to the child.
Coins: easy=5, medium=10, challenging=15.
Format: JSON array only — [{"title":"...","category":"...","screen_time_reward":5}]`;

  // ── Claude call ───────────────────────────────────────────────────────────────
  let missions: MissionDraft[] = [];
  let usedFallback = false;
  const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY);
  log(rid, 'claude_attempt', { hasAnthropicKey, model: 'claude-haiku-4-5-20251001', requestedCount, band });

  try {
    if (!hasAnthropicKey) throw new Error('ANTHROPIC_API_KEY not set');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        // Privacy: only the age band string is sent — never the child's name or exact age.
        content: `Generate exactly ${requestedCount} missions for a child in the ${band} age range. Return only a JSON array.`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    log(rid, 'claude_response_received', { textLength: text.length, preview: text.slice(0, 300) });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      log(rid, 'claude_json_parse_error', { error: String(parseErr), rawPreview: text.slice(0, 500) });
      throw parseErr;
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      missions = parsed as MissionDraft[];
      log(rid, 'claude_success', { missionCount: missions.length });
    } else {
      log(rid, 'claude_unexpected_format', { type: typeof parsed, preview: JSON.stringify(parsed).slice(0, 200) });
    }
  } catch (err) {
    log(rid, 'claude_failed_using_fallback', { error: String(err) });
  }

  if (missions.length === 0) {
    usedFallback = true;
    const fallbacks = FALLBACK[band] ?? FALLBACK['default'];
    missions = fallbacks.slice(0, requestedCount);
    log(rid, 'fallback_missions_loaded', { band, count: missions.length });
  }

  missions = missions.slice(0, requestedCount);

  // ── Delete existing incomplete missions for today ─────────────────────────────
  const missionDate = today();
  log(rid, 'delete_start', { childId, missionDate });

  const delWithDate = await supabase
    .from('missions')
    .delete()
    .eq('child_id', childId)
    .eq('is_completed', false)
    .eq('mission_date', missionDate);

  if (delWithDate.error) {
    log(rid, 'delete_with_date_failed', {
      error: delWithDate.error.message, code: delWithDate.error.code,
      details: delWithDate.error.details, hint: delWithDate.error.hint,
    });
    // Retry without mission_date filter (column may not exist)
    const delFallback = await supabase
      .from('missions')
      .delete()
      .eq('child_id', childId)
      .eq('is_completed', false);
    if (delFallback.error) {
      log(rid, 'delete_without_date_failed', {
        error: delFallback.error.message, code: delFallback.error.code,
      });
    } else {
      log(rid, 'delete_without_date_ok');
    }
  } else {
    log(rid, 'delete_ok');
  }

  // ── Insert missions ───────────────────────────────────────────────────────────
  const rowsWithDate = missions.map((m) => ({
    child_id: childId,
    title: m.title,
    category: m.category ?? 'general',
    screen_time_reward: m.screen_time_reward ?? 5,
    is_completed: false,
    mission_date: missionDate,
  }));

  log(rid, 'insert_start', {
    strategy: 'with_mission_date',
    rowCount: rowsWithDate.length,
    sampleRow: { ...rowsWithDate[0], title: '[redacted]' },
  });

  let { data, error } = await supabase.from('missions').insert(rowsWithDate).select();

  if (error) {
    log(rid, 'insert_with_date_failed', {
      error: error.message, code: error.code, details: error.details, hint: error.hint,
    });

    // Retry without mission_date (column may not exist in older schema)
    const rowsNoDate = missions.map((m) => ({
      child_id: childId,
      title: m.title,
      category: m.category ?? 'general',
      screen_time_reward: m.screen_time_reward ?? 5,
      is_completed: false,
    }));

    log(rid, 'insert_retry', { strategy: 'without_mission_date', rowCount: rowsNoDate.length });
    const retry = await supabase.from('missions').insert(rowsNoDate).select();

    if (retry.error) {
      log(rid, 'insert_without_date_failed', {
        error: retry.error.message, code: retry.error.code,
        details: retry.error.details, hint: retry.error.hint,
      });
      return errResponse(rid, 500, 'Mission setup is taking longer than expected. Please try again.', {
        errorStep: 'supabase_insert',
        errorType: retry.error.code ?? 'insert_error',
        fallbackAttempted: usedFallback,
        fallbackSucceeded: false,
        detail: retry.error.message,
      });
    }

    log(rid, 'insert_ok', { rowsInserted: retry.data?.length ?? 0, strategy: 'without_mission_date', usedFallback });
    data = retry.data;
    error = null;
  } else {
    log(rid, 'insert_ok', { rowsInserted: data?.length ?? 0, strategy: 'with_mission_date', usedFallback });
  }

  log(rid, 'complete', { tasksReturned: data?.length ?? 0, generated: missions.length, usedFallback });

  return NextResponse.json({
    tasks: data,
    generated: missions.length,
    debugRequestId: rid,
    usedFallback,
  });
}
