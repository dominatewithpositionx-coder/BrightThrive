'use client';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('🎉 Account created! Check your email to confirm.');
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) setMessage(error.message);
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow text-center">
      <h2 className="text-2xl font-bold mb-6">Create Parent Account</h2>

      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 text-gray-500"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md"
        >
          Sign Up
        </button>
      </form>

      <div className="mt-6 text-gray-600 text-sm">
        <p>Already have an account? <a href="/login" className="underline">Login</a></p>
      </div>

      <div className="mt-8">
        <button
          onClick={handleGoogleLogin}
          className="w-full border border-gray-300 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 transition"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
    </div>
  );
}
