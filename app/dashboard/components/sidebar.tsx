// app/(dashboard)/_components/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Settings, Gamepad2, LogOut } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { createBrowserClient } from '@supabase/ssr';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const navLinks: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const kidLink = { name: 'Kid View', href: '/child', icon: Gamepad2 };

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-64 shrink-0 border-r bg-white shadow-md">
      <div className="p-4 text-center">
        <Link href="/" className="inline-flex items-center justify-center">
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            width={BRAND.logoWidth}
            height={BRAND.logoHeight}
            priority
            className="w-[140px] sm:w-[180px] h-auto object-contain"
          />
        </Link>
      </div>

      <nav className="mt-2 space-y-1 flex flex-col h-[calc(100vh-80px)]">
        <div className="space-y-1 flex-1">
          {navLinks.map(({ name, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== '/dashboard' && pathname?.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex items-center gap-3 px-6 py-3 rounded-md transition-colors duration-150',
                  isActive
                    ? 'bg-gray-200 font-semibold text-black'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black',
                ].join(' ')}
              >
                <Icon size={18} />
                <span>{name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="px-4 pt-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>

        {/* Kid View launcher */}
        <div className="px-4 pb-4 border-t pt-3">
          <Link
            href={kidLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-medium text-sm transition-colors"
          >
            <kidLink.icon size={18} />
            <span>{kidLink.name}</span>
            <span className="ml-auto text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">New tab</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
