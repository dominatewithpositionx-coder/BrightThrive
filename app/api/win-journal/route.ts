import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { user, supabase };
}

// GET /api/win-journal?limit=7
// Returns the last N wins for the authenticated parent.
export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, supabase } = auth;
  const limit = Math.min(30, Math.max(1, Number(new URL(req.url).searchParams.get('limit')) || 7));

  const { data, error } = await supabase
    .from('win_journal')
    .select('id, win_date, win_text, created_at')
    .eq('parent_id', user.id)
    .order('win_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[win-journal] GET failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wins: data ?? [] });
}

// POST /api/win-journal  { win_text: string, win_date?: string }
// Upserts today's win (one per parent per day).
export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, supabase } = auth;

  let body: { win_text?: string; win_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const winText = (body.win_text ?? '').trim();
  if (!winText || winText.length > 280) {
    return NextResponse.json({ error: 'win_text must be 1–280 characters' }, { status: 400 });
  }

  const winDate = body.win_date ?? today();

  const { data, error } = await supabase
    .from('win_journal')
    .upsert(
      { parent_id: user.id, win_date: winDate, win_text: winText },
      { onConflict: 'parent_id,win_date' }
    )
    .select()
    .single();

  if (error) {
    console.error('[win-journal] POST failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ win: data });
}
