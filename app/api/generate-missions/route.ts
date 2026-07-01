import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { buildMissionContext, generateMissionPack, todayString } from '@/lib/mission-intelligence';

export const runtime = 'nodejs';

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

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

  // ── Auth ────────────────────────────────────────────────────────────────────
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

  // ── Rate limit ──────────────────────────────────────────────────────────────
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
  if (rateLimitMap.size > 5000) {
    for (const [k, ts] of rateLimitMap) {
      if (now - ts > RATE_LIMIT_MS * 10) rateLimitMap.delete(k);
    }
  }

  // ── Supabase client (prefer service role for writes) ─────────────────────
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : anonSupabase;

  let serviceSupabase;
  try {
    serviceSupabase = createServiceSupabaseClient();
  } catch {
    serviceSupabase = supabase;
  }

  // ── Build intelligence context + generate pack ───────────────────────────
  const ctx = await buildMissionContext({
    childId,
    childAge,
    childRow,
    mood,
    location,
    locationLabel,
    locationCity,
    weatherSummary,
    missionRound: currentRound,
    requestedCount,
    resolvedParentId,
    supabase,
    serviceSupabase,
  });

  const pack = await generateMissionPack(ctx);

  // ── DB write: delete today's incomplete missions, insert new pack ─────────
  const missionDate = todayString();

  const delWithDate = await supabase
    .from('missions')
    .delete()
    .eq('child_id', childId)
    .eq('is_completed', false)
    .eq('mission_date', missionDate);

  if (delWithDate.error) {
    const delFallback = await supabase
      .from('missions')
      .delete()
      .eq('child_id', childId)
      .eq('is_completed', false);
    if (delFallback.error) {
      console.error('[generate-missions] fallback delete failed:', delFallback.error.message);
    }
  }

  // Strip internal `reasoning` field — not a DB column
  const rowsWithDate = pack.missions.map((m) => ({
    child_id: childId,
    title: m.title,
    category: m.category ?? 'general',
    screen_time_reward: m.screen_time_reward ?? 5,
    is_completed: false,
    mission_date: missionDate,
  }));

  let { data, error } = await supabase.from('missions').insert(rowsWithDate).select();

  if (error) {
    const rowsNoDate = pack.missions.map((m) => ({
      child_id: childId,
      title: m.title,
      category: m.category ?? 'general',
      screen_time_reward: m.screen_time_reward ?? 5,
      is_completed: false,
    }));
    const retry = await supabase.from('missions').insert(rowsNoDate).select();
    if (retry.error) {
      console.error('[generate-missions] mission insert failed (both attempts):', retry.error);
      return NextResponse.json({ error: retry.error.message, code: retry.error.code }, { status: 500 });
    }
    data = retry.data;
    error = null;
  }

  return NextResponse.json({
    tasks: data,
    generated: data?.length ?? 0,
    requested: pack.missions.length,
    pack: pack.name || undefined,
  });
}
