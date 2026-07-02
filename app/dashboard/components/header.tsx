// app/(dashboard)/_components/Header.tsx
'use client';

import type { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useCallback } from 'react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type HeaderProps = {
  user?: User | null;
};

export default function Header({ user }: HeaderProps) {
  const onLogout = useCallback(async () => {
    try {
      // Best effort: sign out from Supabase if a client is available
      await supabase.auth.signOut();
    } catch {
      // no-op — still continue with local cleanup & redirect
    }

    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }

    // Always redirect home
    window.location.assign('/');
  }, []);

  return (
    <header className="flex items-center justify-between bg-white border-b p-4 shadow-sm">
      <h1 className="text-xl font-semibold">
        {user?.email ? `Welcome, ${user.email}` : 'Welcome'}
      </h1>

      <button
        type="button"
        onClick={onLogout}
        className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
        aria-label="Log out"
      >
        Log Out
      </button>
    </header>
  );
}
