'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function HomePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();
    if (res.ok) toast.success(data.message || 'Welcome to BrainThrive!');
    else toast.error(data.error || 'Something went wrong');
  }

  return (
    <section className="text-center py-24">
      <h1 className="text-4xl font-bold text-navy mb-4">BrainThrive</h1>
      <p className="text-gray-600 mb-6">
        Balance screen time with real-world wins. Join the waitlist to get early access.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-md w-full px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-md w-full px-3 py-2"
          required
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-2 rounded-md w-full font-medium"
        >
          Join Waitlist
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3">
        By joining, you agree to our <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </section>
  );
}
