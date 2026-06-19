import type { ReactNode } from 'react';

export const metadata = { title: 'BrightThrive — Kid View' };

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {children}
      </body>
    </html>
  );
}
