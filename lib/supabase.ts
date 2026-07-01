import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';


// Detect missing or placeholder values baked in at build time
export function getSupabaseConfigStatus(): { ok: boolean; reason?: string } {
  if (!url || url.includes('placeholder')) {
    return { ok: false, reason: 'NEXT_PUBLIC_SUPABASE_URL is missing or invalid. Redeploy after setting it in Vercel.' };
  }
  if (!key || key === 'placeholder') {
    return { ok: false, reason: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid. Redeploy after setting it in Vercel.' };
  }
  return { ok: true };
}

// Singleton — prevents "Multiple GoTrueClient instances" warning
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder',
    );
  }
  return _client;
}

// Server-only service-role client. Bypasses RLS — never import into client code.
export function createServiceSupabaseClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
