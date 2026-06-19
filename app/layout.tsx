// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import Image from 'next/image';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { Toaster } from 'sonner';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: 'BrightThrive — Earn your play. Enjoy your day.',
  description:
    'BrightThrive helps families build better screen habits with rewards, tasks, and positive routines.',
  icons: {
    icon: '/brand/brightthrive/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="min-h-screen text-navy bg-white">
        {/* Header */}
        <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl">
            <Image
              src="/brand/brightthrive/BrightThrive-logo.svg"
              alt="BrightThrive"
              width={160}
              height={40}
              priority
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </Link>
          <nav className="flex gap-6 text-sm text-gray-700">
            <Link href="/how-it-works" className="hover:text-gray-900">How it works</Link>
            <Link href="/parents" className="hover:text-gray-900">For Parents</Link>
            <Link href="/login" className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700">Sign in</Link>
          </nav>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto px-4 py-12 text-sm text-gray-600 border-t mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p>© {new Date().getFullYear()} BrightThrive. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/how-it-works" className="hover:text-gray-900">How it works</Link>
            </div>
          </div>
        </footer>

        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
