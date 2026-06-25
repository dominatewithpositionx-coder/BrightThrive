export const BRAND = {
  name: 'BrytThrive',
  tagline: 'Earn your play. Enjoy your day.',
  description: 'Tools to help families build better screen habits with rewards, tasks, and positive routines.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Full horizontal logo (SVG — use in <img> or CSS; for Next.js <Image> use logoPng).
  logo: '/brand/BrytThrive-logo.svg',
  // Icon-only mark — same file for compact/mobile use.
  mark: '/brand/BrytThrive-logo.svg',
  // PNG for Next.js <Image> optimization and OG/email (no SVG in email clients).
  logoPng: '/brand/BrytThrive-logo.png',
  ogImage: '/brand/BrytThrive-logo.png',

  // Logo natural dimensions (full horizontal)
  logoWidth: 360,
  logoHeight: 90,
  // Mark natural dimensions
  markWidth: 144,
  markHeight: 144,

  twitter: '@brytthrive',
  color: {
    primary: '#14B8A6',     // teal-500
    primaryDark: '#0F766E', // teal-700
    accent: '#06B6D4',      // cyan-500
    bg: '#0b1a27',
  },
  font: {
    display: 'Poppins',
  },
  emailFromName: 'BrytThrive',
  emailFromAddress: 'notifications@resend.dev',
};
