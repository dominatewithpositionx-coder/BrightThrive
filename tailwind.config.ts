import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          light: '#f0fdf4',
        },
        mood: {
          happy:      { DEFAULT: '#fbbf24', light: '#fffbeb', border: '#fde68a' },
          calm:       { DEFAULT: '#38bdf8', light: '#f0f9ff', border: '#bae6fd' },
          energetic:  { DEFAULT: '#fb923c', light: '#fff7ed', border: '#fed7aa' },
          tired:      { DEFAULT: '#a78bfa', light: '#faf5ff', border: '#e9d5ff' },
          sad:        { DEFAULT: '#60a5fa', light: '#eff6ff', border: '#bfdbfe' },
          frustrated: { DEFAULT: '#fb7185', light: '#fff1f2', border: '#fecdd3' },
        },
        coin: '#f59e0b',
        streak: '#f97316',
        navy: '#0b1a27',
      },
      borderRadius: {
        card: '16px',
        modal: '24px',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'bounce-once': 'bounce 0.6s ease-in-out 1',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
