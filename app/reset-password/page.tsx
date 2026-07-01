'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { BRAND } from '@/lib/brand';

// Cookie-aware client so the session is written to cookies (not localStorage)
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type State = 'loading' | 'ready' | 'invalid' | 'success';

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<State>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const type = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (type !== 'recovery' || !accessToken || !refreshToken) {
      setPageState('invalid');
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setPageState('invalid');
        } else {
          setPageState('ready');
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPageState('success');
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            width={BRAND.logoWidth}
            height={BRAND.logoHeight}
            priority
            className="w-[140px] sm:w-[180px] h-auto object-contain mb-2"
          />
          <p className="text-sm text-gray-500">Earn your play. Enjoy your day.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {pageState === 'loading' && (
            <p className="text-sm text-gray-500 text-center">Verifying reset link…</p>
          )}

          {pageState === 'invalid' && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Link expired</h2>
              <p className="text-sm text-gray-500">
                Invalid or expired reset link. Request a new one.
              </p>
              <Link href="/login" className="text-green-600 font-medium hover:underline text-sm">
                Back to login
              </Link>
            </div>
          )}

          {pageState === 'success' && (
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Password updated!</h2>
              <p className="text-sm text-gray-500">Redirecting you to the dashboard…</p>
            </div>
          )}

          {pageState === 'ready' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Set new password</h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Choose a new password for your account.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={loading}
                  className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3 rounded-xl font-semibold text-base min-h-[44px] transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
