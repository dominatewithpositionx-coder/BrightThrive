#!/usr/bin/env node
// Deployment verification script — run before every production deploy
// Usage: node scripts/verify-env.js
// In CI: add to package.json "prebuild": "node scripts/verify-env.js"

const REQUIRED = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    validate: (v) => v.startsWith('https://') && v.includes('.supabase.co') && !v.includes('placeholder'),
    hint: 'Must be https://<project-ref>.supabase.co — get it from Supabase → Project Settings → API',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    validate: (v) => v.length > 20 && v !== 'placeholder',
    hint: 'Must be the anon/public key from Supabase → Project Settings → API',
  },
];

const OPTIONAL = [
  { key: 'SUPABASE_SERVICE_ROLE_KEY', hint: 'Needed for admin routes and server-side operations' },
  { key: 'RESEND_API_KEY', hint: 'Needed for email notifications' },
  { key: 'ANTHROPIC_API_KEY', hint: 'Needed for AI mission generation' },
  { key: 'NEXT_PUBLIC_POSTHOG_KEY', hint: 'Needed for analytics' },
];

let hasError = false;

console.log('\n── BrytThrive Environment Check ──────────────────\n');

for (const { key, validate, hint } of REQUIRED) {
  const val = process.env[key] || '';
  const ok = val && validate(val);
  if (ok) {
    console.log(`✅  ${key} — configured`);
  } else {
    console.error(`❌  ${key} — MISSING or INVALID`);
    console.error(`    ${hint}`);
    hasError = true;
  }
}

console.log('');
for (const { key, hint } of OPTIONAL) {
  const val = process.env[key] || '';
  if (val && val !== 'placeholder') {
    console.log(`✅  ${key} — configured`);
  } else {
    console.warn(`⚠️   ${key} — not set (${hint})`);
  }
}

console.log('\n────────────────────────────────────────────────────\n');

if (hasError) {
  console.error('🚨  CRITICAL: Required environment variables are missing.');
  console.error('    Set them in Vercel → Settings → Environment Variables,');
  console.error('    then trigger a fresh Production deployment.\n');
  process.exit(1);
} else {
  console.log('🚀  All required env vars are present. Safe to deploy.\n');
}
