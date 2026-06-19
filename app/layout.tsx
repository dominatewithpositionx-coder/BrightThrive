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
    icon: '/brand/brainthrive/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="min-h-screen text-navy bg-white">
        {/* Header */}
        <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/BrightThrive.png"
              alt="BrightThrive"
              width={180}
              height={48}
              priority
              className="h-10 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-700">
            <Link href="/child" className="hover:text-gray-900 font-medium">Child Login</Link>
            <Link href="/login" className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-full hover:bg-gray-50 font-medium">Parent Login</Link>
            <Link href="/login" className="bg-teal-600 text-white px-4 py-1.5 rounded-full hover:bg-teal-700 font-medium">Get Started</Link>
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
