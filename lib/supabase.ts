import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Safe startup log — prints config status without exposing key values
if (typeof window !== 'undefined') {
  console.log(
    '[BrytThrive] Supabase config check — URL configured:',
    !!(url && !url.includes('placeholder')),
    '| Key configured:',
    !!(key && key !== 'placeholder'),
  );
}

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
