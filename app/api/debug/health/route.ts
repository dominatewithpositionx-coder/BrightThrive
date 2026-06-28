import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// Only available when NEXT_PUBLIC_ENABLE_DEBUG_TOOLS === "true"
function debugEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEBUG_TOOLS === 'true';
}

export async function GET(req: NextRequest) {
  if (!debugEnabled()) {
    return NextResponse.json({ error: 'Debug tools are not enabled.' }, { status: 403 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Auth check ────────────────────────────────────────────────────────────────
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // ── Env var presence (never values) ──────────────────────────────────────────
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder'),
    SUPABASE_SERVICE_ROLE_KEY: !!(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ANTHROPIC_API_KEY: !!(process.env.ANTHROPIC_API_KEY),
    NEXT_PUBLIC_SITE_URL: !!(process.env.NEXT_PUBLIC_SITE_URL),
    RESEND_API_KEY: !!(process.env.RESEND_API_KEY),
  };

  // ── Children for this parent ──────────────────────────────────────────────────
  let childCount = 0;
  let childrenWithLocation = 0;
  let childIds: string[] = [];
  const { data: children, error: childErr } = await anonClient
    .from('children')
    .select('id, name, age, location_label, location_city')
    .eq('parent_id', userId);

  if (!childErr && children) {
    childCount = children.length;
    childIds = children.map((c: { id: string }) => c.id);
    childrenWithLocation = children.filter(
      (c: { location_city?: string | null }) => c.location_city
    ).length;
  }

  // ── Schema compatibility checks ───────────────────────────────────────────────
  // We detect column presence by attempting a minimal select and checking the error code.
  // Supabase returns code "42703" (undefined column) when a column doesn't exist.
  type SchemaCheck = { exists: boolean; error?: string };

  async function columnExists(table: string, column: string): Promise<SchemaCheck> {
    if (childIds.length === 0) {
      return { exists: true }; // Can't test without a child row — assume OK
    }
    try {
      let client;
      try {
        client = createServiceSupabaseClient();
      } catch {
        client = anonClient;
      }
      const { error } = await client
        .from(table)
        .select(column)
        .eq('child_id', childIds[0])
        .limit(1);

      if (!error) return { exists: true };
      if (error.code === '42703') return { exists: false, error: error.message };
      // Other errors (RLS, etc.) — assume column exists, error is something else
      return { exists: true, error: error.message };
    } catch (e) {
      return { exists: true, error: String(e) };
    }
  }

  const [missionDateCheck, screenTimeRewardCheck] = await Promise.all([
    columnExists('missions', 'mission_date'),
    columnExists('missions', 'screen_time_reward'),
  ]);

  // Check children table location columns
  let locationColumnsExist = true;
  let locationColumnError: string | undefined;
  if (childIds.length > 0) {
    try {
      let client;
      try {
        client = createServiceSupabaseClient();
      } catch {
        client = anonClient;
      }
      const { error } = await client
        .from('children')
        .select('location_label, location_city')
        .eq('id', childIds[0])
        .limit(1);
      if (error?.code === '42703') {
        locationColumnsExist = false;
        locationColumnError = error.message;
      }
    } catch { /* ignore */ }
  }

  const schema = {
    missions_mission_date: missionDateCheck,
    missions_screen_time_reward: screenTimeRewardCheck,
    children_location_columns: { exists: locationColumnsExist, error: locationColumnError },
  };

  // ── Service role connectivity ─────────────────────────────────────────────────
  let serviceRoleWorks = false;
  let serviceRoleError: string | undefined;
  if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const svc = createServiceSupabaseClient();
      const { error } = await svc.from('children').select('id').limit(1);
      serviceRoleWorks = !error;
      if (error) serviceRoleError = error.message;
    } catch (e) {
      serviceRoleError = String(e);
    }
  }

  return NextResponse.json({
    ok: true,
    userId,
    envVars,
    children: {
      count: childCount,
      withLocation: childrenWithLocation,
      error: childErr?.message,
    },
    schema,
    serviceRole: {
      keyPresent: envVars.SUPABASE_SERVICE_ROLE_KEY,
      works: serviceRoleWorks,
      error: serviceRoleError,
    },
    timestamp: new Date().toISOString(),
  });
}
