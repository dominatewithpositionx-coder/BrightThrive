// lib/brand.ts
export const BRAND = {
  name: 'BrightThrive',
  tagline: 'Earn your play. Enjoy your day.',
  description: 'Tools to help families build better screen habits with rewards, tasks, and positive routines.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  logo: '/brand/brightthrive/brightthrive-logo.svg',
  mark: '/brand/brightthrive/brightthrive-mark.svg',
  ogImage: '/brand/brightthrive/og-cover.png',
  twitter: '@brightthrive',
  color: {
    primary: '#22c55e', // Green 500
    primaryDark: '#16a34a',
    bg: '#0b1a27',      // if you keep a dark hero somewhere
  },
  font: {
    display: 'Poppins', // you selected Poppins Bold
  },
  emailFromName: 'BrightThrive',
  emailFromAddress: 'notifications@resend.dev', // update once you have your domain
};
