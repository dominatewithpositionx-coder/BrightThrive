import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback — handles Supabase PKCE email confirmation.
 *
 * When a user confirms their email, Supabase redirects here with ?code=xxx.
 * We exchange that code for a real session (written to cookies), then send
 * the user to /dashboard so they land fully authenticated.
 *
 * emailRedirectTo in onboarding must point at this route:
 *   `${window.location.origin}/auth/callback`
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
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
            } catch {
              // Safe to ignore — can't set cookies from a read-only context.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session is now in cookies — redirect to dashboard (or wherever next points).
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — send to login with a hint.
  return NextResponse.redirect(`${origin}/login?error=confirmation-failed`);
}
