import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/set-session
 *
 * Receives the access_token + refresh_token from the browser after a
 * successful signInWithPassword call, then sets the Supabase session
 * server-side via createServerClient so the cookie is written into the
 * HTTP response — the same way the middleware reads it.
 *
 * This eliminates any race between createBrowserClient writing to
 * document.cookie and the middleware reading request cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
    }

    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message ?? 'Session exchange failed' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
