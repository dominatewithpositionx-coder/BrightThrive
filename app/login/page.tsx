'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { loginAction, resetPasswordAction } from '@/app/actions/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // loginAction runs server-side: sets cookies in the response, then
    // server-redirects to /dashboard. No cookie-write race on the client.
    const result = await loginAction(email, password);

    // If we reach here, loginAction returned an error (redirect throws, so it
    // never returns on success).
    if (result?.error) {
      setMessage(result.error);
    }
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setResetLoading(true);

    const result = await resetPasswordAction(resetEmail);
    setResetLoading(false);
    if (result?.error) {
      setResetError(result.error);
    } else {
      setResetMessage('Check your email for a reset link.');
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
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
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => { setShowReset(!showReset); setResetEmail(email); setResetMessage(''); setResetError(''); }}
                  className="text-xs text-green-600 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold text-base min-h-[44px] transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          {showReset && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Reset your password</p>
              {resetMessage ? (
                <p className="text-sm text-green-600">{resetMessage}</p>
              ) : (
                <form onSubmit={handleResetPassword} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="border border-gray-200 rounded-xl px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
                  >
                    {resetLoading ? '…' : 'Send'}
                  </button>
                </form>
              )}
              {resetError && <p className="mt-2 text-xs text-red-600">{resetError}</p>}
            </div>
          )}

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
