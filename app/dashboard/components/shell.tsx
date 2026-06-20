'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import {
  Home, Users, BarChart3, Gift, Settings, ClipboardList,
  Gamepad2, History, Menu, X, LogOut, ChevronRight,
} from 'lucide-react';

const NAV = [
  { name: 'Overview',  href: '/dashboard',           icon: Home },
  { name: 'Children',  href: '/dashboard/children',  icon: Users },
  { name: 'Tasks',     href: '/dashboard/tasks',      icon: ClipboardList },
  { name: 'Rewards',   href: '/dashboard/rewards',    icon: Gift },
  { name: 'Analytics', href: '/dashboard/analytics',  icon: BarChart3 },
  { name: 'History',   href: '/dashboard/history',    icon: History },
  { name: 'Settings',  href: '/dashboard/settings',   icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-3">
      {NAV.map(({ name, href, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              active ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={18} className={active ? 'text-green-600' : ''} />
            {name}
            {active && <ChevronRight size={14} className="ml-auto text-green-400" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onClose, onLogout, firstName }: { onClose?: () => void; onLogout: () => void; firstName: string }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-between border-b bg-gradient-to-r from-green-50 to-teal-50">
        <Link href="/dashboard" onClick={onClose}>
          <Image src="/brand/BrightThrive.png" alt="BrightThrive" width={180} height={44} priority className="h-11 w-auto" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User greeting */}
      <div className="px-5 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
            {firstName[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{firstName}</p>
            <p className="text-xs text-gray-400">Parent</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-3 overflow-y-auto">
        <NavLinks onClick={onClose} />
      </div>

      {/* Kid View + Logout */}
      <div className="px-3 pb-4 space-y-1 border-t pt-3">
        <Link
          href="/child"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          <Gamepad2 size={18} />
          Kid View
          <span className="ml-auto text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">↗</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [firstName, setFirstName] = useState('there');

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.assign('/login');
        return;
      }
      const email = data.user.email || '';
      setFirstName(email.split('@')[0] || 'there');
    });
  }, []);

  async function handleLogout() {
    try {
      const sb = getSupabase();
      await sb.auth.signOut();
    } catch {}
    try { localStorage.clear(); } catch {}
    window.location.assign('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r bg-white flex-col shadow-sm">
        <SidebarContent onLogout={handleLogout} firstName={firstName} />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setDrawerOpen(false)} onLogout={handleLogout} firstName={firstName} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Image src="/brand/BrightThrive.png" alt="BrightThrive" width={150} height={36} className="h-9 w-auto" />
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
            {firstName[0]?.toUpperCase() || '?'}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
