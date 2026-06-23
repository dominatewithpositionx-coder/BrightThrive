// lib/brand.ts
export const BRAND = {
  name: 'BrytThrive',
  tagline: 'Earn your play. Enjoy your day.',
  description: 'Tools to help families build better screen habits with rewards, tasks, and positive routines.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  logo: '/brand/BrytThrive.png', // SVG not yet produced; use PNG until brand assets delivered
  mark: '/brand/BrytThrive.png',
  ogImage: '/brand/BrytThrive.png',
  twitter: '@brytthrive',
  color: {
    primary: '#14B8A6',  // teal-500
    primaryDark: '#0F766E', // teal-700
    accent: '#06B6D4',   // cyan-500
    bg: '#0b1a27',
  },
  font: {
    display: 'Poppins', // you selected Poppins Bold
  },
  emailFromName: 'BrytThrive',
  emailFromAddress: 'notifications@resend.dev', // update once you have your domain
};
