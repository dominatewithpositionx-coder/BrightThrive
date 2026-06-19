'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else setMessage('✅ Password updated successfully! You can now log in.');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow text-center">
      <h2 className="text-2xl font-bold mb-6">Set a New Password</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md"
        >
          Update Password
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      <p className="mt-6 text-gray-600 text-sm">
        <a href="/login" className="underline">
          Back to login
        </a>
      </p>
    </div>
  );
}
