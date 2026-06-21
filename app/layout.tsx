// app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { Toaster } from 'sonner';
import ServiceWorkerRegistrar from '@/components/brightthrive/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/brightthrive/InstallPrompt';
import MobileNav from '@/components/brightthrive/MobileNav';
import Logo from '@/components/brightthrive/Logo';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'] });

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'BrightThrive — Earn your play. Enjoy your day.',
  description:
    'BrightThrive helps families build healthy habits, emotional intelligence, and calmer homes — one mission at a time.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BrightThrive',
    startupImage: '/icons/icon-1024x1024.png',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/icon-192x192.png',sizes: '192x192',type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/icons/apple-touch-icon.png' },
    ],
  },
  openGraph: {
    title: 'BrightThrive — Turn Screen Time Into Growth Time',
    description: 'Healthy habits. Emotional intelligence. Calmer homes.',
    type: 'website',
    images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="min-h-screen text-navy bg-white">
        {/* Header */}
        <header className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Mobile: hamburger | Logo | CTA */}
          {/* Desktop: Logo | nav */}

          {/* Hamburger — mobile only */}
          <div className="flex md:hidden">
            <MobileNav />
          </div>

          {/* Logo — centered on mobile, left on desktop */}
          <div className="flex-1 flex justify-center md:justify-start">
            <Logo variant="full" />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-700" aria-label="Main navigation">
            <Link href="/login" className="hover:text-gray-900 font-medium transition-colors">
              Parent Login
            </Link>
            <Link
              href="/onboarding"
              className="text-white px-5 py-2.5 rounded-xl font-semibold min-h-[44px] flex items-center transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile: Get Started CTA */}
          <div className="flex md:hidden">
            <Link
              href="/onboarding"
              className="text-white text-sm font-semibold px-4 py-2.5 rounded-xl min-h-[44px] flex items-center transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
            >
              Get Started
            </Link>
          </div>
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
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  );
}
