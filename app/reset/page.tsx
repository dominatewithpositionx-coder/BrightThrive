'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset/update`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('📬 A password reset email has been sent! Check your inbox.');
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow text-center">
      <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
      <form onSubmit={handleReset} className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      {message && (
        <p className="mt-4 text-sm text-gray-700">{message}</p>
      )}
      <p className="mt-6 text-gray-600 text-sm">
        <a href="/login" className="underline">
          Back to login
        </a>
      </p>
    </div>
  );
}
