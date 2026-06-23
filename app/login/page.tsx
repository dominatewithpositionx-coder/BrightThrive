'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard');
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/brand/BrytThrive.png"
            alt="BrytThrive"
            width={200}
            height={133}
            priority
            className="h-14 w-auto object-contain mb-2"
          />
          <p className="text-sm text-gray-500">Earn your play. Enjoy your day.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Welcome back</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold text-base min-h-[44px] transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          {/* Google OAuth is hidden until the Google provider is enabled in Supabase.
              To enable: Supabase Dashboard → Authentication → Providers → Google
              → toggle on → paste your Google OAuth Client ID and Client Secret
              → add https://[project].supabase.co/auth/v1/callback as an Authorized Redirect URI in Google Cloud Console. */}

          {message && <p className="mt-4 text-sm text-red-600 text-center">{message}</p>}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          New here?{' '}
          <Link href="/onboarding" className="text-green-600 font-medium hover:underline">
            Get started free
          </Link>
        </p>
      </div>
    </div>
  );
}
