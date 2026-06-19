// app/(dashboard)/_components/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Users, BarChart3, Gift, Settings, ClipboardList } from 'lucide-react';

const brand = {
  name: 'BrightThrive',
  logo: '/brand/brightthrive/BrightThrive-logo.svg',
};

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const navLinks: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Children', href: '/dashboard/children', icon: Users },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-white shadow-md">
      <div className="p-4 text-center">
        <Link href="/" className="inline-flex items-center justify-center">
          <Image
            src={brand.logo}
            alt={brand.name}
            width={140}
            height={28}
            priority
          />
        </Link>
      </div>

      <nav className="mt-2 space-y-1">
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
      </nav>
    </aside>
  );
}
