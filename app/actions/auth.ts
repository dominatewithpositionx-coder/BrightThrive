'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server Action: login
 *
 * Calls signInWithPassword on the SERVER using createServerClient.
 * The cookie adapter writes the Supabase session into the response cookies
 * directly from the server, so the middleware (which also uses createServerClient)
 * is guaranteed to see the session on the very next request to /dashboard.
 *
 * This eliminates the client-side cookie-write race that caused the
 * "login flash + redirect back to /login" bug.
 */
export async function loginAction(email: string, password: string): Promise<{ error: string } | never> {
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
            // setAll can be called from a Server Component where cookies are read-only.
            // Safe to ignore in that context.
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Server-side redirect: the session cookies are already in the response,
  // so the middleware will see a valid session when /dashboard is requested.
  redirect('/dashboard');
}

/**
 * Server Action: resetPassword
 * Sends a password reset email via the server (no browser client needed).
 */
export async function resetPasswordAction(email: string): Promise<{ error?: string; success?: boolean }> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
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

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://brytthrive.com/reset-password',
  });

  if (error) return { error: error.message };
  return { success: true };
}
