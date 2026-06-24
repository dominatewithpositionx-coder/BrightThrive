export const BRAND = {
  name: 'BrytThrive',
  tagline: 'Earn your play. Enjoy your day.',
  description: 'Tools to help families build better screen habits with rewards, tasks, and positive routines.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Full horizontal logo (icon + wordmark). Use in headers, nav, auth pages, emails.
  logo: '/brand/BrytThrive.png',
  // Icon-only mark. Use for favicon, PWA icons, compact/mobile headers, loading states.
  mark: '/brand/BrytThrive.png',
  // PNG fallback for OG/email (no SVG support in some email clients / crawlers).
  logoPng: '/brand/BrytThrive.png',
  ogImage: '/brand/BrytThrive.png',

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
