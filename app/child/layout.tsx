import type { ReactNode } from 'react';

export const metadata = {
  title: 'BrytThrive — Kid View',
  robots: { index: false, follow: false },
};

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {children}
    </div>
  );
}
