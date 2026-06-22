'use client';

import { usePathname } from 'next/navigation';

// Hides the public marketing header/footer on app routes (dashboard, child).
// Those routes render their own chrome (DashboardShell / Kid View header).
export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/child')) return null;
  return <>{children}</>;
}
