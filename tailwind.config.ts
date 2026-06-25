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
          DEFAULT: '#14B8A6',
          dark: '#0F766E',
          light: '#F0FDFA',
          accent: '#06B6D4',
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
        card: '20px',
        modal: '28px',
        xl2: '20px',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 4px -1px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        hover: '0 4px 16px -2px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.08)',
        lift:  '0 8px 24px -4px rgb(0 0 0 / 0.14), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
        glow:  '0 0 20px 2px rgb(20 184 166 / 0.25)',
        'coin': '0 2px 8px rgb(245 158 11 / 0.35)',
      },
      animation: {
        'bounce-once': 'bounce 0.6s ease-in-out 1',
        'fade-in':     'fadeIn 0.35s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'float':       'float 3s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s linear infinite',
        'sun-rotate':  'sunRotate 20s linear infinite',
        'sun-glow':    'sunGlow 3s ease-in-out infinite',
        'cloud-drift': 'cloudDrift 6s ease-in-out infinite',
        'rain-fall':   'rainFall 0.8s linear infinite',
        'snow-fall':   'snowFall 2s ease-in-out infinite',
        'twinkle':     'twinkle 2s ease-in-out infinite',
        'flame':       'flameFlicker 0.8s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 3s ease-in-out infinite',
        'coin-pop':    'coinPop 0.7s ease-out forwards',
        'level-up':    'levelBurst 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        sunRotate: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        sunGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' },
          '50%':      { filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.9))' },
        },
        cloudDrift: {
          '0%':   { transform: 'translateX(-8px)' },
          '50%':  { transform: 'translateX(8px)' },
          '100%': { transform: 'translateX(-8px)' },
        },
        rainFall: {
          '0%':   { transform: 'translateY(-20px)', opacity: '0' },
          '10%':  { opacity: '0.7' },
          '90%':  { opacity: '0.7' },
          '100%': { transform: 'translateY(80px)', opacity: '0' },
        },
        snowFall: {
          '0%':   { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '0.9' },
          '90%':  { opacity: '0.9' },
          '100%': { transform: 'translateY(80px) rotate(180deg)', opacity: '0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%':      { opacity: '1',   transform: 'scale(1.2)' },
        },
        flameFlicker: {
          '0%, 100%': { transform: 'scaleY(1) rotate(-2deg)' },
          '25%':      { transform: 'scaleY(1.08) rotate(2deg)' },
          '50%':      { transform: 'scaleY(0.95) rotate(-1deg)' },
          '75%':      { transform: 'scaleY(1.05) rotate(3deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.9', filter: 'brightness(1)' },
          '50%':      { opacity: '1',   filter: 'brightness(1.15)' },
        },
        coinPop: {
          '0%':   { opacity: '0', transform: 'scale(0.4) translateY(0)' },
          '50%':  { opacity: '1', transform: 'scale(1.3) translateY(-16px)' },
          '80%':  { transform: 'scale(0.95) translateY(-12px)' },
          '100%': { opacity: '0', transform: 'scale(1) translateY(-28px)' },
        },
        levelBurst: {
          '0%':   { transform: 'scale(1)',    filter: 'brightness(1)' },
          '30%':  { transform: 'scale(1.15)', filter: 'brightness(1.3)' },
          '60%':  { transform: 'scale(0.97)', filter: 'brightness(1.1)' },
          '100%': { transform: 'scale(1)',    filter: 'brightness(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
