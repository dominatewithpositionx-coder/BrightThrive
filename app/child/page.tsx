'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import Logo from '@/components/brightthrive/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, Gift, ChevronLeft, Flame, Lock, ChevronDown, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { type MoodKey, MOODS, EI_RESPONSES } from '@/lib/mood';
import { type WeatherData } from '@/lib/weather';
import { updateStreak } from '@/lib/streaks';
import {
  trackMoodSelected,
  trackMissionCompleted,
} from '@/lib/analytics';
import { KidWelcomeIllustration } from '@/components/brightthrive/Illustrations';
import ProgressRing from '@/components/brightthrive/ProgressRing';
import WeatherScene from '@/components/brightthrive/WeatherScene';
import WeatherWidget from '@/components/WeatherWidget';
import { getDayTheme } from '@/lib/themes';
import { getExplorerLevel } from '@/lib/levels';
import { getClothingSuggestions } from '@/lib/weather';

// ── PWA install prompt (shown after child profile selection) ──────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as unknown as { standalone?: boolean }).standalone) return;
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return prompt;
}

const INSTALL_DISMISSED_KEY = 'bt_install_dismissed_at';
const INSTALL_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isInstallDismissed(): boolean {
  try {
    const ts = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < INSTALL_DISMISS_TTL_MS;
  } catch { return false; }
}

function recordInstallDismiss() {
  try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now())); } catch {}
}

function KidInstallBanner({ prompt }: { prompt: BeforeInstallPromptEvent | null }) {
  const [visible, setVisible] = useState(() => !isInstallDismissed());
  if (!visible || !prompt) return null;

  function dismiss() { setVisible(false); recordInstallDismiss(); }
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
  }
  return (
    <div className="mx-4 mt-4 bg-white border border-teal-100 rounded-2xl shadow-sm p-4 flex items-start gap-3 animate-fade-in">
      <span className="text-2xl flex-shrink-0">📱</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-navy leading-tight">Add BrytThrive to your home screen</p>
        <p className="text-xs text-gray-500 mt-0.5">Access it like an app — no browser needed.</p>
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="text-gray-300 hover:text-gray-400 text-lg leading-none mt-0.5 flex-shrink-0">×</button>
    </div>
  );
}

function KidInstallBannerFull({ prompt }: { prompt: BeforeInstallPromptEvent | null }) {
  const [visible, setVisible] = useState(() => !isInstallDismissed());
  if (!visible || !prompt) return null;

  function dismiss() { setVisible(false); recordInstallDismiss(); }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setVisible(false); recordInstallDismiss(); }
  }
  return (
    <div className="mx-4 mt-4 animate-fade-in">
      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📱</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-navy">Add BrytThrive to your home screen</p>
          <p className="text-xs text-gray-500 mt-0.5">Access BrytThrive like an app — no browser needed.</p>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-gray-300 hover:text-gray-400 text-lg leading-none mt-0.5 flex-shrink-0">×</button>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={dismiss} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors min-h-[44px]">Not now</button>
        <button onClick={install} className="flex-[2] py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors min-h-[44px]">Add to Home Screen</button>
      </div>
    </div>
  );
}

type Child   = { id: string; name: string; age?: number | null; parent_id?: string | null; points: number; location_label?: string | null; location_name?: string | null; location_city?: string | null };
type Mission = { id: string; child_id: string; title: string; category?: string; screen_time_reward?: number; is_completed: boolean; generated_by?: string };
type Reward  = { id: string; title: string; coin_cost: number };

const CAT_EMOJI: Record<string, string> = {
  movement:               '🏃',
  responsibility:         '🧹',
  emotional_intelligence: '💛',
  learning:               '📚',
  creativity:             '🎨',
  family_connection:      '👨‍👩‍👧',
  outdoor:                '🌤️',
  healthy_habits:         '🥦',
  kindness:               '💝',
  mindfulness:            '🧘',
  adventure:              '🗺️',
  general:                '⭐',
};

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  movement:               { bg: 'bg-rose-50',    text: 'text-rose-600' },
  responsibility:         { bg: 'bg-amber-50',   text: 'text-amber-600' },
  emotional_intelligence: { bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  learning:               { bg: 'bg-blue-50',    text: 'text-blue-600' },
  creativity:             { bg: 'bg-purple-50',  text: 'text-purple-600' },
  family_connection:      { bg: 'bg-pink-50',    text: 'text-pink-600' },
  outdoor:                { bg: 'bg-sky-50',     text: 'text-sky-600' },
  healthy_habits:         { bg: 'bg-green-50',   text: 'text-green-600' },
  kindness:               { bg: 'bg-pink-50',    text: 'text-pink-600' },
  mindfulness:            { bg: 'bg-teal-50',    text: 'text-teal-600' },
  adventure:              { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  general:                { bg: 'bg-gray-50',    text: 'text-gray-600' },
};

// Time-of-day mission grouping — frontend-only, no DB column needed.
// Categories map to dayparts; "bonus" is the catch-all for kindness/general.
function getDaypartGroup(category: string): 'morning' | 'afternoon' | 'evening' | 'bonus' {
  const MORNING  = new Set(['responsibility', 'healthy_habits', 'family_connection']);
  const AFTERNOON = new Set(['movement', 'learning', 'outdoor', 'adventure']);
  const EVENING  = new Set(['mindfulness', 'emotional_intelligence', 'creativity']);
  if (MORNING.has(category))   return 'morning';
  if (AFTERNOON.has(category)) return 'afternoon';
  if (EVENING.has(category))   return 'evening';
  return 'bonus';
}

// Demo missions shown while real missions are loading or if generation is pending.
// These are client-side only — no DB writes. child_id is injected at render time.
const DEMO_MISSIONS: Omit<Mission, 'child_id'>[] = [
  { id: 'demo-1', title: 'Make your bed neatly', category: 'responsibility', screen_time_reward: 5, is_completed: false },
  { id: 'demo-2', title: 'Move your body for 15 minutes', category: 'movement', screen_time_reward: 10, is_completed: false },
  { id: 'demo-3', title: 'Read for 15 minutes', category: 'learning', screen_time_reward: 10, is_completed: false },
  { id: 'demo-4', title: 'Draw what you\'re grateful for today', category: 'emotional_intelligence', screen_time_reward: 5, is_completed: false },
  { id: 'demo-5', title: 'Do 20 jumping jacks', category: 'movement', screen_time_reward: 5, is_completed: false },
  { id: 'demo-6', title: 'Help clean one thing in the house', category: 'responsibility', screen_time_reward: 5, is_completed: false },
  { id: 'demo-7', title: 'Say something kind to someone today', category: 'kindness', screen_time_reward: 5, is_completed: false },
  { id: 'demo-8', title: 'Take 5 slow deep breaths', category: 'mindfulness', screen_time_reward: 5, is_completed: false },
  { id: 'demo-9', title: 'Drink 2 glasses of water', category: 'healthy_habits', screen_time_reward: 5, is_completed: false },
  { id: 'demo-10', title: 'Spend 10 minutes outside', category: 'outdoor', screen_time_reward: 10, is_completed: false },
];

const AVATAR_COLORS = [
  { bg: 'bg-emerald-400', glow: 'shadow-emerald-200', border: 'border-emerald-200', text: 'text-emerald-900', light: 'bg-emerald-50',  gradient: 'from-emerald-400 to-teal-400' },
  { bg: 'bg-blue-400',    glow: 'shadow-blue-200',    border: 'border-blue-200',    text: 'text-blue-900',    light: 'bg-blue-50',     gradient: 'from-blue-400 to-indigo-400'   },
  { bg: 'bg-violet-400',  glow: 'shadow-violet-200',  border: 'border-violet-200',  text: 'text-violet-900',  light: 'bg-violet-50',   gradient: 'from-violet-400 to-purple-400' },
  { bg: 'bg-orange-400',  glow: 'shadow-orange-200',  border: 'border-orange-200',  text: 'text-orange-900',  light: 'bg-orange-50',   gradient: 'from-orange-400 to-amber-400'  },
  { bg: 'bg-rose-400',    glow: 'shadow-rose-200',    border: 'border-rose-200',    text: 'text-rose-900',    light: 'bg-rose-50',     gradient: 'from-rose-400 to-pink-400'     },
  { bg: 'bg-teal-400',    glow: 'shadow-teal-200',    border: 'border-teal-200',    text: 'text-teal-900',    light: 'bg-teal-50',     gradient: 'from-teal-400 to-cyan-400'     },
];
function getColors(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'] });
}

// ── PinDialog ─────────────────────────────────────────────────────────────────

function PinDialog({ childId, childName, onUnlock, onCancel }: { childId: string; childName: string; onUnlock: () => void; onCancel: () => void }) {
  const [digits, setDigits] = useState('');
  const [error, setError]   = useState(false);

  function handleDigit(d: string) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError(false);
    if (next.length === 4) {
      // Check ID-based key first, then legacy name-based key.
      const stored = localStorage.getItem(`bt_pin_child_${childId}`)
        ?? localStorage.getItem(`bt_pin_${childName.toLowerCase()}`);
      if (!stored || stored === next) { onUnlock(); }
      else { setTimeout(() => { setDigits(''); setError(true); }, 300); }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-center animate-fade-in">
        <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock size={24} className="text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-navy mb-1">Hi, {childName}!</h2>
        <p className="text-sm text-gray-500 mb-5">Enter your PIN to continue</p>
        <div className="flex justify-center gap-3 mb-5">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${error ? 'bg-red-400' : i < digits.length ? 'bg-teal-500 scale-110' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
            <button
              key={k}
              onClick={() => { if (k === '⌫') setDigits((d) => d.slice(0,-1)); else if (k) handleDigit(k); }}
              disabled={!k}
              aria-label={k === '⌫' ? 'Delete' : k || undefined}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all ${k ? 'bg-gray-100 hover:bg-gray-200 active:scale-95 text-navy' : ''}`}
            >
              {k}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mb-3 animate-fade-in">Wrong PIN, try again</p>}
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors min-h-[44px]">Back</button>
      </div>
    </div>
  );
}

// ── ChildPicker ───────────────────────────────────────────────────────────────

function ChildHeader() {
  return (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-center px-6 pt-safe py-4 z-10">
      <Logo variant="full" className="h-[44px] w-auto" priority />
    </div>
  );
}

type LoadState = 'ok' | 'auth' | 'no-children' | 'query';

function ChildPicker({ children, loadState, onSelect }: { children: Child[]; loadState: LoadState; onSelect: (c: Child) => void }) {

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex flex-col items-center justify-center px-6 py-24 animate-fade-in relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-50/40 blur-3xl" />
      </div>

      {/* Auth gate */}
      {loadState === 'auth' && (
        <div className="relative text-center max-w-sm space-y-5">
          <div className="text-6xl mb-2">🔒</div>
          <h1 className="text-3xl font-black text-navy">Parent login required</h1>
          <p className="text-gray-500 leading-relaxed">
            Kid Mode is launched from the parent dashboard. Log in as a parent, then open Kid Mode from there.
          </p>
          <a href="/login" className="inline-block mt-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-4 rounded-2xl transition-colors text-base shadow-lg shadow-teal-200">
            Parent Login
          </a>
        </div>
      )}

      {/* Query / network error */}
      {loadState === 'query' && (
        <div className="relative text-center max-w-xs space-y-4">
          <div className="text-5xl mb-2">⚠️</div>
          <p className="font-bold text-gray-700 text-lg">Could not load profiles</p>
          <p className="text-gray-500 text-sm">Check your connection and try again, or ask a parent for help.</p>
          <button onClick={() => window.location.reload()} className="mt-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-3 rounded-2xl transition-colors text-sm shadow-sm hover:shadow-md">
            Try again
          </button>
        </div>
      )}

      {/* No children set up */}
      {loadState === 'no-children' && (
        <div className="relative text-center max-w-sm space-y-5">
          <div className="text-6xl mb-2">🌱</div>
          <h1 className="text-3xl font-black text-navy">Add a child first</h1>
          <p className="text-gray-500 leading-relaxed">
            No child profiles are set up yet. Go to the parent dashboard to add your first child, then come back here.
          </p>
          <a href="/dashboard/children" className="inline-block mt-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-4 rounded-2xl transition-colors text-base shadow-lg shadow-teal-200">
            Add a Child
          </a>
        </div>
      )}

      {/* ── Child picker ── */}
      {loadState === 'ok' && children.length > 0 && (
        <div className="relative w-full flex flex-col items-center">

          {/* Heading */}
          <div className="text-center mb-12">
            <p className="text-teal-600 font-semibold text-base tracking-wide mb-2">{timeGreeting}! 👋</p>
            <h1 className="text-4xl sm:text-5xl font-black text-navy leading-tight tracking-tight">
              Who&apos;s here today?
            </h1>
            <p className="text-gray-400 mt-3 text-lg font-medium">Tap your name to start your missions</p>
          </div>

          {/* Cards — 1 col on tiny screens, 2 col at sm, 3 col at md+ */}
          <div className={`grid gap-5 w-full
            ${children.length === 1 ? 'grid-cols-1 max-w-xs' : ''}
            ${children.length === 2 ? 'grid-cols-2 max-w-md' : ''}
            ${children.length >= 3 ? 'grid-cols-2 sm:grid-cols-3 max-w-2xl' : ''}
          `}>
            {children.map((child, i) => {
              const colors = getColors(child.name);
              return (
                <motion.button
                  key={child.id}
                  onClick={() => onSelect(child)}
                  aria-label={`${child.name} — tap to start`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className={`
                    group relative flex flex-col items-center
                    bg-white rounded-[2rem] p-8 pt-10 pb-7
                    border-2 ${colors.border}
                    shadow-xl ${colors.glow} shadow-2xl
                    hover:shadow-2xl transition-shadow duration-300
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400
                  `}
                >
                  {/* Avatar */}
                  <div className="relative mb-5">
                    {/* Outer glow ring */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.gradient} opacity-20 blur-md scale-110`} />
                    {/* Avatar circle */}
                    <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                      <span className="text-5xl font-black text-white leading-none select-none">
                        {child.name[0].toUpperCase()}
                      </span>
                    </div>
                    {/* Streak badge */}
                    {child.points > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white">
                        <Star size={13} fill="white" className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-2xl font-black text-navy tracking-tight leading-none mb-2">
                    {child.name}
                  </span>

                  {/* Points */}
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                    <Star size={12} fill="#F59E0B" className="text-amber-400 flex-shrink-0" />
                    <span className="text-amber-600 font-bold text-sm">{child.points} coins</span>
                  </div>

                  {/* Tap hint — only visible on hover/focus on devices that support hover */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium">Tap to start →</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}

// ── MoodCheckIn ───────────────────────────────────────────────────────────────
// Matches the MoodPickerCard design shown on /how-it-works

function MoodCheckIn({ childName, onSelect }: { childName: string; onSelect: (mood: MoodKey) => void }) {
  const [pick, setPick] = useState<MoodKey | null>(null);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">
            👦
          </div>
          <p className="font-bold text-navy text-lg">Hey {childName}!</p>
          <p className="text-gray-500 text-sm mt-1">How are you feeling right now?</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setPick(m.key)}
              aria-label={`I'm feeling ${m.label}`}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                pick === m.key
                  ? 'border-amber-400 bg-amber-50 scale-105 shadow-sm'
                  : 'border-gray-100 bg-gray-50 hover:border-amber-200'
              }`}
            >
              <span className="text-4xl leading-none">{m.emoji}</span>
              <span className="text-sm font-semibold text-gray-600 leading-tight text-center">{m.label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {pick && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => onSelect(pick)}
              className="w-full bg-amber-400 hover:bg-amber-500 rounded-xl py-3 text-white text-sm font-semibold shadow-sm transition-colors min-h-[44px]"
            >
              Show me my missions! →
            </motion.button>
          )}
        </AnimatePresence>
        <p className="text-center text-xs text-gray-400 mt-3">BrytThrive adjusts missions to match your energy</p>
      </div>
    </div>
  );
}

// ── ChildView (missions) ──────────────────────────────────────────────────────

// Estimated times per category
const CAT_TIMES: Record<string, string> = {
  movement: '15 min', responsibility: '10 min', emotional_intelligence: '5 min',
  learning: '15 min', creativity: '20 min', family_connection: '10 min',
  outdoor: '20 min', healthy_habits: '5 min', kindness: '5 min',
  mindfulness: '5 min', adventure: '20 min', general: '10 min',
};

// Encouraging subtitles per category
const CAT_SUBTITLES: Record<string, string> = {
  movement:               'Get your body moving!',
  responsibility:         'Be the hero at home.',
  emotional_intelligence: 'Know yourself better.',
  learning:               'Level up your brain!',
  creativity:             'Make something amazing.',
  family_connection:      'Moments that matter.',
  outdoor:                'Adventure awaits outside!',
  healthy_habits:         'Take care of yourself.',
  kindness:               'Spread the good vibes.',
  mindfulness:            'Breathe and be present.',
  adventure:              'Explore the world!',
  general:                'You got this!',
};

function MissionCard({ mission, onToggle, index }: { mission: Mission; onToggle: (m: Mission) => void; index: number }) {
  const emoji    = CAT_EMOJI[mission.category ?? 'general'] ?? '⭐';
  const reward   = mission.screen_time_reward ?? 10;
  const colors   = CAT_COLORS[mission.category ?? 'general'] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
  const catLabel = (mission.category ?? 'general').replace(/_/g, ' ');
  const time     = CAT_TIMES[mission.category ?? 'general'] ?? '10 min';
  const subtitle = CAT_SUBTITLES[mission.category ?? 'general'] ?? 'You got this!';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="mission-card bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card"
    >
      {/* Top accent strip */}
      <div className={`h-1 w-full ${colors.bg.replace('bg-', 'bg-').replace('-50', '-300')}`} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3.5">
          {/* Large icon */}
          <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center text-3xl flex-shrink-0 shadow-sm`}>
            {emoji}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-navy text-base leading-snug mb-1">{mission.title}</p>
            <p className={`text-xs font-medium ${colors.text} mb-1.5`}>{subtitle}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center text-xs font-semibold ${colors.text} ${colors.bg} rounded-full px-2.5 py-0.5 capitalize`}>
                {catLabel}
              </span>
              <span className="text-xs text-gray-400 font-medium">⏱ {time}</span>
            </div>
          </div>
          {/* Reward badges: coins + screen time */}
          <div className="flex-shrink-0 flex flex-col gap-1.5 ml-1">
            <div className="bg-gradient-to-b from-amber-400 to-amber-500 rounded-xl px-2.5 py-1.5 text-center shadow-coin">
              <p className="text-white font-black text-xs leading-none">+{reward}</p>
              <p className="text-amber-100 text-[10px] leading-none mt-0.5">🪙</p>
            </div>
            <div className="bg-gradient-to-b from-blue-400 to-blue-500 rounded-xl px-2.5 py-1.5 text-center shadow-sm">
              <p className="text-white font-black text-xs leading-none">+{reward}</p>
              <p className="text-blue-100 text-[10px] leading-none mt-0.5">📱</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggle(mission)}
          aria-label={`Complete "${mission.title}"`}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm hover:from-teal-600 hover:to-emerald-600 active:scale-[0.97] transition-all shadow-sm press-scale flex items-center justify-center gap-2"
        >
          <span>✓</span> Complete Mission
        </button>
      </div>
    </motion.div>
  );
}

function MissionGroup({ title, emoji, missions, onToggle, accent }: {
  title: string; emoji: string; missions: Mission[]; onToggle: (m: Mission) => void;
  accent?: string;
}) {
  if (missions.length === 0) return null;
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${accent ?? 'bg-gray-100'}`}>
          {emoji}
        </div>
        <h3 className="font-bold text-navy text-base tracking-tight">{title}</h3>
        <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold rounded-full px-2.5 py-0.5">
          {missions.length}
        </span>
      </div>
      <div className="space-y-3">
        <AnimatePresence>
          {missions.map((m, i) => (
            <MissionCard key={m.id} mission={m} onToggle={onToggle} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Mission loading screen — shown while auto-gen is in flight ────────────────

const LOADING_MESSAGES = [
  'Creating your mission pack…',
  'Checking your mood and goals…',
  "Matching missions to today's rhythm…",
  'Personalising your adventure…',
  'Almost there — missions incoming!',
];

function MissionLoadingScreen({ childName, onRetry, failed }: { childName: string; onRetry: () => void; failed: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (failed) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, [failed]);

  if (failed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="font-black text-navy text-lg mb-2">Couldn&apos;t load missions</p>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">Check your connection and try again — your progress is saved.</p>
          <button
            onClick={onRetry}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-3 rounded-xl text-sm transition-colors min-h-[44px]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        {/* Animated seedling */}
        <div className="flex justify-center mb-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 animate-pulse opacity-30" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-3xl">
              🌱
            </div>
          </div>
        </div>
        <p className="text-center font-black text-navy text-lg mb-1">Hey {childName}!</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-500 text-sm mb-6"
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
        {/* Skeleton mission rows */}
        <div className="space-y-3">
          {[0.9, 0.75, 0.85, 0.6, 0.8].map((w, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="h-4 rounded-full bg-gray-100 flex-1" style={{ width: `${w * 100}%` }} />
              <div className="w-10 h-4 rounded-full bg-amber-50 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mission row (flat list design matching How-It-Works mockup) ───────────────

function MissionRow({ mission, onToggle, isLast }: { mission: Mission; onToggle: (m: Mission) => void; isLast: boolean }) {
  const emoji    = CAT_EMOJI[mission.category ?? 'general'] ?? '⭐';
  const catLabel = (mission.category ?? 'general').replace(/_/g, ' ');
  return (
    <button
      onClick={() => onToggle(mission)}
      aria-label={mission.is_completed ? `Undo "${mission.title}"` : `Complete "${mission.title}"`}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${!isLast ? 'border-b border-gray-50' : ''}`}
    >
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${mission.is_completed ? 'bg-teal-500 text-white' : 'border-2 border-gray-200 bg-white'}`}>
        {mission.is_completed ? '✓' : ''}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${mission.is_completed ? 'line-through text-gray-400' : 'text-navy'}`}>{mission.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{emoji} {catLabel}</p>
      </div>
      <span className="text-xs font-bold text-amber-500 flex-shrink-0 whitespace-nowrap">🪙 10</span>
    </button>
  );
}

function ChildView({ child, missions, rewards, streak, mood, onBack, onMissionToggle, onGenerateMore, generatingMore, missionRound, missionPack, missionError, missionSuccess, weather, isDemoMode, isAutoGenerating, autoGenFailed, onRetryGen }: {
  child: Child; missions: Mission[]; rewards: Reward[]; streak: number; mood: MoodKey | null;
  onBack: () => void; onMissionToggle: (mission: Mission) => void;
  onGenerateMore: () => void; generatingMore: boolean; missionRound: number;
  missionPack: string | null;
  missionError: string | null; missionSuccess: string | null;
  weather: WeatherData | null; isDemoMode?: boolean;
  isAutoGenerating?: boolean; autoGenFailed?: boolean; onRetryGen?: () => void;
}) {
  const theme   = getDayTheme();
  const level   = getExplorerLevel(child.points);

  const clothing = weather ? getClothingSuggestions(weather) : [];

  const done    = missions.filter((m) => m.is_completed);
  const pending = missions.filter((m) => !m.is_completed);
  console.log(`[ChildView] render: total=${missions.length} active=${pending.length} completed=${done.length} round=${missionRound}`);
  // Only celebrate when a meaningful pack was actually completed (≥3 missions done, none left).
  // A single old completed mission from a previous session must never trigger this screen.
  const allDone = done.length >= 3 && pending.length === 0 && !isDemoMode;
  const progress = missions.length > 0 ? Math.round((done.length / missions.length) * 100) : 0;
  // Use `|| 5` (not `?? 5`) so parent-added tasks with explicit screen_time_reward=0 still earn 5 mins.
  const screenTimeEarned = done.reduce((sum, m) => sum + (m.screen_time_reward || 5), 0);
  const screenTimePotential = missions.reduce((sum, m) => sum + (m.screen_time_reward || 5), 0);

  const pendingMorning   = pending.filter(m => getDaypartGroup(m.category ?? '') === 'morning');
  const pendingAfternoon = pending.filter(m => getDaypartGroup(m.category ?? '') === 'afternoon');
  const pendingEvening   = pending.filter(m => getDaypartGroup(m.category ?? '') === 'evening');
  const pendingBonus     = pending.filter(m => getDaypartGroup(m.category ?? '') === 'bonus');

  const [showCompleted, setShowCompleted] = useState(false);
  const [showRewards, setShowRewards]     = useState(false);

  const sortedRewards      = [...rewards].sort((a, b) => a.coin_cost - b.coin_cost);
  const affordableRewards  = sortedRewards.filter((r) => r.coin_cost <= child.points);
  const nextReward         = sortedRewards.find((r) => r.coin_cost > child.points) ?? null;

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const timeLabel = (() => {
    const h = new Date().getHours();
    if (h >= 20 || h < 5) return 'Night';
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  })();
  const moodLabel = mood ? MOODS.find(m => m.key === mood)?.label ?? mood : null;
  const weatherLabel = weather ? `${weather.emoji} ${weather.tempC}°C` : null;
  const contextLine = [moodLabel, timeLabel, weatherLabel].filter(Boolean).join(' · ');

  const headerGradient = (() => {
    if (!weather) return null;
    const hour = new Date().getHours();
    if (hour >= 19) return 'from-indigo-50 to-purple-50';
    const lc = weather.condition.toLowerCase();
    if (lc.includes('snow') || lc.includes('freez')) return 'from-blue-50 to-white';
    if (lc.includes('rain') || lc.includes('shower') || lc.includes('drizzle')) return 'from-blue-50 to-slate-100';
    if (lc.includes('cloud') || lc.includes('overcast')) return 'from-slate-50 to-gray-100';
    if (lc.includes('partly') || lc.includes('mostly')) return 'from-sky-50 to-slate-50';
    if (lc.includes('sun') || lc.includes('clear')) return 'from-amber-50 to-orange-50';
    return null;
  })();

  // Show loading screen while auto-gen is in flight and no missions exist yet
  if ((isAutoGenerating || autoGenFailed) && missions.length === 0 && !isDemoMode) {
    return <MissionLoadingScreen childName={child.name} failed={!!autoGenFailed} onRetry={onRetryGen ?? (() => {})} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in pb-10">

      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          aria-label="Switch explorer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] font-medium"
        >
          <ChevronLeft size={16} /> Switch Explorer
        </button>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">

        {/* ── Main mission card — matches MissionStackCard from How It Works ── */}
        <div className={`rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${headerGradient ? `bg-gradient-to-br ${headerGradient}` : 'bg-white'}`}>
          {/* Amber top strip */}
          <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400" />

          {/* Header */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-black text-navy text-lg leading-tight">{child.name}&apos;s missions · {dayName}</h1>
                {contextLine && <p className="text-xs text-gray-400 mt-0.5">{contextLine}</p>}
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-black text-navy text-xl leading-none">
                  {done.length}<span className="text-gray-300 font-normal text-base">/{missions.length}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">done</p>
              </div>
            </div>
            {missions.length > 0 && (
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            )}
            {weather && (
              <div className="mt-4 flex justify-center border-t border-gray-100/60 pt-3">
                <WeatherWidget tempC={weather.tempC} condition={weather.condition} emoji={weather.emoji} size="lg" />
              </div>
            )}
          </div>

          {/* Pack / round label */}
          {missionPack && pending.length > 0 && (
            <div className="px-5 pb-2">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                {missionRound > 0 ? `🔄 Round ${missionRound + 1} — ` : '✨ '}{missionPack}
              </span>
            </div>
          )}

          {/* Pending missions */}
          {pending.length > 0 && (
            <div className="border-t border-gray-50">
              {pending.map((m, i) => (
                <MissionRow key={m.id} mission={m} onToggle={onMissionToggle} isLast={i === pending.length - 1} />
              ))}
            </div>
          )}

          {/* Completed (collapsible) */}
          {done.length > 0 && (
            <div className="border-t border-gray-50">
              <button
                onClick={() => setShowCompleted((v) => !v)}
                aria-label="Toggle completed missions"
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors min-h-[44px]"
              >
                <span>✓ {done.length} completed</span>
                <ChevronDown size={14} className={`transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {done.map((m, i) => (
                      <MissionRow key={m.id} mission={m} onToggle={onMissionToggle} isLast={i === done.length - 1} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Footer: BrytCoins + streak */}
          <div className="border-t border-gray-50 px-5 py-3.5 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm font-bold text-amber-500">🪙 {child.points} BrytCoins</span>
            <span className="text-sm font-bold text-gray-500">
              {streak > 0 ? '🔥' : '💤'} {streak} day streak
            </span>
          </div>
        </div>

        {/* Error / success banners */}
        {missionError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 text-center font-medium">
            {missionError}
          </div>
        )}
        {missionSuccess && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 text-sm text-teal-700 text-center font-medium"
          >
            {missionSuccess}
          </motion.div>
        )}

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center text-sm text-amber-700 font-medium">
            🔍 Parent Preview — sample missions only. Real missions appear when a child logs in.
          </div>
        )}

        {/* No missions yet */}
        {!isDemoMode && missions.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl px-6 py-10 text-center shadow-sm">
            <div className="text-4xl mb-3">🌟</div>
            <p className="font-bold text-navy text-lg mb-1">No missions yet today</p>
            <p className="text-gray-400 text-sm">Your missions are being prepared — check back in a moment!</p>
          </div>
        )}

        {/* All-done celebration */}
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 rounded-3xl p-8 text-center shadow-lift"
          >
            <div className="text-6xl mb-4 animate-float">🏆</div>
            <p className="font-black text-white text-2xl mb-2 tracking-tight">Amazing Work!</p>
            <p className="text-white/90 text-sm leading-relaxed mb-4 font-medium">
              You crushed every mission{missionRound > 0 ? ` in Round ${missionRound + 1}` : ' today'}!
            </p>
            <div className="inline-flex items-center gap-2.5 bg-white/25 rounded-2xl px-5 py-3 text-white font-bold text-sm mb-5 backdrop-blur-sm">
              <Trophy size={16} /> {done.length} mission{done.length !== 1 ? 's' : ''} · +{screenTimeEarned} iPad mins earned
            </div>
            <button
              onClick={onGenerateMore}
              disabled={generatingMore}
              className="w-full min-h-[44px] bg-white text-teal-700 font-bold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
            >
              {generatingMore ? '✨ Getting more missions…' : '🎯 Get More Missions'}
            </button>
          </motion.div>
        )}

        {/* Get more missions (when not all done) */}
        {!allDone && !isDemoMode && (
          <button
            onClick={onGenerateMore}
            disabled={generatingMore}
            className="w-full min-h-[44px] bg-white border border-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
          >
            {generatingMore ? '✨ Getting more missions…' : '🔄 Get More Missions'}
          </button>
        )}

        {/* Next reward progress */}
        {nextReward && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-purple-500" />
                <span className="font-semibold text-gray-700 text-sm">Next Reward</span>
              </div>
              <span className="text-xs text-gray-400">{child.points} / {nextReward.coin_cost} 🪙</span>
            </div>
            <p className="font-bold text-navy mb-3">{nextReward.title}</p>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.round((child.points / nextReward.coin_cost) * 100))}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">{nextReward.coin_cost - child.points} BrytCoins to go! 🎁</p>
          </div>
        )}

        {/* Ready to redeem */}
        {affordableRewards.length > 0 && (
          <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={16} className="text-teal-600" />
              <span className="font-bold text-teal-800">Ready to redeem!</span>
            </div>
            <div className="space-y-2">
              {affordableRewards.map((r) => (
                <div key={r.id} className="flex justify-between items-center bg-white/60 rounded-xl px-3 py-2">
                  <span className="text-gray-800 font-medium text-sm">{r.title}</span>
                  <span className="text-teal-600 font-bold text-sm">{r.coin_cost} 🪙</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-teal-600 mt-3 font-medium text-center">Ask a parent to redeem! 🎉</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

type AppPhase = 'picker' | 'mood-check' | 'missions';

export default function ChildPage() {
  const [children, setChildren]     = useState<Child[]>([]);
  const [missions, setMissions]     = useState<Mission[]>([]);
  const [rewards, setRewards]       = useState<Reward[]>([]);
  const [streaks, setStreaks]       = useState<Record<string, number>>({});
  const [selected, setSelected]     = useState<Child | null>(null);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [phase, setPhase]           = useState<AppPhase>('picker');
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [loading, setLoading]       = useState(true);
  const [loadState, setLoadState]   = useState<LoadState>('ok');
  const [missionError, setMissionError] = useState<string | null>(null);
  const [missionSuccess, setMissionSuccess] = useState<string | null>(null);
  const [weather, setWeather]       = useState<WeatherData | null>(null);
  const [missionRound, setMissionRound]     = useState(0);
  const [missionPack, setMissionPack]       = useState<string | null>(null);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [lastGenError, setLastGenError]     = useState<string | null>(null);
  const [weatherFetchedAt, setWeatherFetchedAt] = useState<string | null>(null);
  // Demo mode is ONLY active when the parent opens /child?demo=1 from the dashboard.
  // Normal child use never shows demo missions regardless of real-mission state.
  const [isExplicitDemo, setIsExplicitDemo] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsExplicitDemo(new URLSearchParams(window.location.search).get('demo') === '1');
    }
  }, []);
  const [isDebugMode] = useState(() =>
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('debug') === '1' || process.env.NODE_ENV === 'development')
  );
  const installPrompt               = useInstallPrompt();

  const supabase = getSupabase();

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  const fetchData = useCallback(async () => {
    // Require an authenticated parent session — no session means no data shown at all.
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) console.error('[child] session error:', sessionErr.message);

    if (!session) {
      setLoadState('auth');
      setLoading(false);
      return;
    }

    const parentId = session.user.id;

    const [
      childRes, walletRes, rewardRes, planRes, streakRes,
    ] = await Promise.all([
      // Explicit parent_id filter — defense-in-depth on top of RLS.
      // Ensures no other parent's children are ever returned, even if RLS is misconfigured.
      supabase.from('children').select('id, name, age, parent_id, location_label, location_name, location_city').eq('parent_id', parentId).order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('rewards').select('id, title, coin_cost').eq('parent_id', parentId).order('coin_cost', { ascending: true }),
      supabase.from('family_plans').select('personalization_data').eq('parent_id', parentId).maybeSingle(),
      supabase.from('streaks').select('child_id, current_streak'),
    ]);

    let childData = childRes.data;
    if (childRes.error) {
      // location_label / location_city columns may not exist yet — retry with base columns only.
      console.warn('[child] children query failed, retrying without location columns:', childRes.error.message);
      const retry = await supabase
        .from('children')
        .select('id, name, age, parent_id')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });
      if (retry.error) {
        console.error('[child] children retry failed:', retry.error.message);
        setLoadState('query');
        setLoading(false);
        return;
      }
      childData = (retry.data || []).map(c => ({ ...c, location_label: null, location_name: null, location_city: null }));
    }

    if (walletRes.error) console.error('[child] wallet query error:', walletRes.error.message);
    if (rewardRes.error) console.error('[child] rewards query error:', rewardRes.error.message);
    if (planRes.error)   console.error('[child] family_plans query error:', planRes.error.message);
    if (streakRes.error) console.error('[child] streaks query error:', streakRes.error.message);

    const kids = (childData || []);
    if (kids.length === 0) {
      setChildren([]);
      setLoadState('no-children');
      setLoading(false);
      return;
    }

    // Scope all mission queries to this parent's children — never show another family's missions.
    const kidIds = kids.map(c => c.id);
    const today = todayStr();
    let missionData: Mission[] | null = null;

    // Primary: filter by today's mission_date and this parent's child IDs.
    const missionRes = await supabase
      .from('missions')
      .select('id, child_id, title, category, screen_time_reward, is_completed, generated_by')
      .in('child_id', kidIds)
      .eq('mission_date', today);

    if (missionRes.error) {
      // mission_date column may not exist on older production DBs — fall back to updated_at filter.
      console.warn('[child] missions query with mission_date failed, retrying with updated_at:', missionRes.error.message);
      const fallback = await supabase
        .from('missions')
        .select('id, child_id, title, category, screen_time_reward, is_completed')
        .in('child_id', kidIds)
        .gte('updated_at', today + 'T00:00:00.000Z')
        .lte('updated_at', today + 'T23:59:59.999Z');

      if (fallback.error) {
        // Both date strategies failed — show empty rather than risk showing stale data.
        console.error('[child] missions fallback also failed:', fallback.error.message);
        missionData = [];
      } else {
        missionData = (fallback.data ?? []).map(m => ({ ...m, generated_by: undefined }));
      }
    } else {
      missionData = missionRes.data;
    }

    const planLoc = (planRes.data?.personalization_data as Record<string, unknown> | null)?.location as string | undefined;
    // Store plan location for fallback use in weather fetching
    if (planLoc) (window as unknown as Record<string, string>)['__bt_plan_loc'] = planLoc;
    const walletMap = Object.fromEntries((walletRes.data || []).map(w => [w.child_id, w.balance]));
    const enrichedKids = kids.map(c => ({ ...c, points: walletMap[c.id] ?? 0 }));
    const fetchedMissions = missionData || [];
    const activeFetched = fetchedMissions.filter(m => !m.is_completed);
    const completedFetched = fetchedMissions.filter(m => m.is_completed);
    console.log(`[child/fetchData] fetched=${fetchedMissions.length} active=${activeFetched.length} completed=${completedFetched.length}`);

    setChildren(enrichedKids);
    setMissions(fetchedMissions);
    setRewards(rewardRes.data || []);
    setStreaks(Object.fromEntries((streakRes.data || []).map(s => [s.child_id, s.current_streak])));
    setLoadState('ok');
    setLoading(false);
    if (selected) {
      const fresh = enrichedKids.find((c) => c.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [selected]);

  useEffect(() => { fetchData(); }, []);

  const autoGenDoneRef = useRef(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoGenFailed, setAutoGenFailed] = useState(false);

  // Auto-generate missions when none exist for today — uses the parent's active session.
  // Fires once per page load; the ref prevents re-triggering after missions are written.
  useEffect(() => {
    if (loading) return;
    if (children.length === 0) return;
    // Only skip auto-gen if there are already incomplete missions — completed missions from
    // a previous session or parent-added tasks should not block a fresh pack being generated.
    if (missions.some(m => !m.is_completed)) return;
    if (autoGenDoneRef.current) return;
    autoGenDoneRef.current = true;
    setAutoGenerating(true);
    setAutoGenFailed(false);
    console.log(`[child/autoGen] triggering auto-gen for ${children.length} child(ren). Total missions=${missions.length}, completed=${missions.filter(m => m.is_completed).length}, incomplete=0`);

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setAutoGenerating(false); setAutoGenFailed(true); return; }
      let anySuccess = false;
      for (const child of children) {
        try {
          const genRes = await fetch('/api/generate-missions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              childId: child.id,
              parentId: session.user.id,
              childAge: child.age,
              mood: selectedMood ?? null,
            }),
          });
          const genData = await genRes.json();
          console.log(`[child/autoGen] child=${child.name} status=${genRes.status} generated=${genData.generated} pack=${genData.pack ?? 'none'} error=${genData.error ?? 'none'}`);
          if (genRes.ok) anySuccess = true;
        } catch (e) {
          console.error('[child/autoGen] fetch error:', e);
        }
      }
      await fetchData();
      setAutoGenerating(false);
      if (!anySuccess) setAutoGenFailed(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, children.length, missions.length]);

  function handleRetryAutoGen() {
    autoGenDoneRef.current = false;
    setAutoGenFailed(false);
    setAutoGenerating(false);
    // Re-trigger by bumping missions.length dependency via fetchData
    fetchData();
  }

  async function fetchChildWeather(child: Child) {
    const city = child.location_city ?? (window as unknown as Record<string, string>)['__bt_plan_loc'];

    const applyJson = (json: Record<string, unknown>): boolean => {
      if (json && !json.error) {
        setWeather(json as unknown as WeatherData);
        setWeatherFetchedAt(new Date().toISOString());
        return true;
      }
      return false;
    };

    // Attempt 1: stored city name
    if (city) {
      try {
        const res = await fetch(`/api/weather?location=${encodeURIComponent(city)}`);
        const json = await res.json();
        if (applyJson(json)) return;
        console.warn('[child] stored city weather failed:', json?.error);
      } catch (err) {
        console.warn('[child] stored city fetch error, trying geolocation:', err);
      }
    }

    // Attempt 2: browser geolocation (runs if city missing OR city lookup failed)
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          const json = await res.json();
          if (!applyJson(json)) {
            console.warn('[child] geolocation weather fetch failed:', json);
          }
        } catch (err) {
          console.warn('[child] geolocation weather fetch error:', err);
        }
      },
      (err) => {
        console.warn('[child] geolocation denied or unavailable:', err.message);
      },
      { timeout: 8000 }
    );
  }

  function getChildPin(child: Child): string | null {
    // Prefer new ID-based key; migrate legacy name-based key if found.
    const newKey = `bt_pin_child_${child.id}`;
    const existing = localStorage.getItem(newKey);
    if (existing) return existing;
    const legacyKey = `bt_pin_${child.name.toLowerCase()}`;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      localStorage.setItem(newKey, legacy);
      localStorage.removeItem(legacyKey);
      return legacy;
    }
    return null;
  }

  function handleSelect(child: Child) {
    const pin = getChildPin(child);
    if (pin) { setPendingChild(child); }
    else { setSelected(child); fetchChildWeather(child); setPhase('mood-check'); }
  }

  function handleMoodSelect(mood: MoodKey) {
    setSelectedMood(mood);
    if (selected) trackMoodSelected({ mood, child_id: selected.id });
    setPhase('missions');
  }

  function handleBack() {
    setSelected(null);
    setSelectedMood(null);
    setPhase('picker');
    setMissionRound(0);
    setMissionPack(null);
  }

  async function handleGenerateMore() {
    if (!selected) return;
    setGeneratingMore(true);
    setLastGenError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLastGenError('No session — please log in again.');
        setGeneratingMore(false);
        return;
      }
      const res = await fetch('/api/generate-missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ childId: selected.id, count: 8, missionRound, mood: selectedMood ?? null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLastGenError(data.error ?? 'Could not generate more missions.');
      } else {
        setMissionRound(r => r + 1);
        if (data.pack) setMissionPack(data.pack);
        await fetchData();
      }
    } catch (e) {
      setLastGenError(String(e));
    }
    setGeneratingMore(false);
  }

  // Validation levels (future — not yet built):
  // 1. Child self-check (current) — tap to mark done
  // 2. Parent spot-check — periodic review notification
  // 3. Parent approval gate for high-value rewards (>100 BrytCoins)
  // 4. Optional photo proof — child photos completion
  // 5. Optional AI-assisted review of submitted photos
  async function handleMissionToggle(mission: Mission) {
    if (!selected) return;
    if (mission.id.startsWith('demo-')) {
      setMissionSuccess('✨ Your real missions are almost ready — check back in a moment!');
      setTimeout(() => setMissionSuccess(null), 3000);
      return;
    }
    const nowCompleted = !mission.is_completed;
    const { error: missionErr } = await supabase
      .from('missions')
      .update({ is_completed: nowCompleted })
      .eq('id', mission.id);
    if (missionErr) { setMissionError('Oops! Could not save that. Try again.'); return; }

    const pointsChange = mission.is_completed ? -10 : +10;
    const { error: coinsError } = await supabase.rpc('add_coins', {
      p_child_id: selected.id,
      p_amount: pointsChange,
      p_type: pointsChange > 0 ? 'earned' : 'deducted',
      p_description: mission.is_completed ? `Undid task: ${mission.title}` : `Completed task: ${mission.title}`,
      p_mission_id: mission.id,
    });
    if (coinsError) { setMissionError('Points could not be updated. Ask a parent.'); return; }

    if (nowCompleted) {
      fireConfetti();
      trackMissionCompleted({ child_id: selected.id, mission_id: mission.id, title: mission.title });
      const screenMin = mission.screen_time_reward ?? 5;
      setMissionSuccess(`✓ "${mission.title}" complete! +10 BrytCoins 🪙  +${screenMin} mins 📱`);
      setTimeout(() => setMissionSuccess(null), 3000);
    }

    setMissionError(null);
    setMissions((prev) => prev.map((m) => m.id === mission.id ? { ...m, is_completed: nowCompleted } : m));
    const newPoints = selected.points + pointsChange;
    setSelected((prev) => prev ? { ...prev, points: newPoints } : prev);
    setChildren((prev) => prev.map((c) => c.id === selected.id ? { ...c, points: newPoints } : c));

    // Streak reflects whether any mission is still completed today after this toggle.
    const stillHasCompleted = missions.some((m) =>
      m.child_id === selected.id && (m.id === mission.id ? nowCompleted : m.is_completed));
    try {
      const result = await updateStreak(supabase, selected.id, stillHasCompleted);
      setStreaks((prev) => ({ ...prev, [selected.id]: result.current }));
    } catch { /* streak update is non-blocking */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Header skeleton */}
        <div className="h-64 skeleton rounded-b-3xl" />
        <div className="px-4 -mt-4 space-y-3 max-w-lg mx-auto">
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-40 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const childMissions = selected ? missions.filter((m) => m.child_id === selected.id) : [];
  // Demo mode: ONLY when ?demo=1 is in the URL (parent explicitly previewing).
  // Real child sessions never show demo missions, even if real missions haven't loaded yet.
  const isDemoMode = isExplicitDemo;
  const displayMissions: Mission[] = isDemoMode && selected
    ? DEMO_MISSIONS.map(m => ({ ...m, child_id: selected.id }))
    : childMissions;

  return (
    <>
      {isDebugMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 text-green-400 text-xs font-mono p-3 max-h-56 overflow-y-auto border-t border-green-800">
          <p className="font-bold text-green-300 mb-1">🛠 BrytThrive Debug Panel (?debug=1)</p>
          <p>loadState: <span className="text-white">{loadState}</span> | phase: <span className="text-white">{phase}</span> | demo: <span className="text-white">{isDemoMode ? 'YES (?demo=1)' : 'NO'}</span></p>
          <p>childId: <span className="text-white">{selected?.id?.slice(0,8) ?? '—'}…</span> | selected: <span className="text-white">{selected?.name ?? 'none'}</span> | children: <span className="text-white">{children.length}</span></p>
          <p>missions: <span className="text-white">{displayMissions.length}</span> | source: <span className="text-white">{isDemoMode ? 'DEMO' : childMissions.length > 0 ? 'REAL' : 'NONE'}</span> | round: <span className="text-white">{missionRound}</span></p>
          <p>weather: <span className="text-white">{weather ? `${weather.tempC}°C ${weather.condition} (real API)` : 'unavailable'}</span>{weatherFetchedAt ? <span className="text-gray-500"> @ {weatherFetchedAt.slice(11,16)}</span> : null}</p>
          <p>mood: <span className="text-white">{selectedMood ?? 'not set'}</span> | streak: <span className="text-white">{selected ? (streaks[selected.id] ?? 0) : '—'}</span> | coins: <span className="text-white">{selected?.points ?? '—'}</span></p>
          {lastGenError && <p className="text-red-400">lastGenError: {lastGenError}</p>}
          {generatingMore && <p className="text-yellow-400">Generating more missions…</p>}
          <p className="text-gray-500 mt-1">Date: {new Date().toISOString().split('T')[0]}</p>
        </div>
      )}
      {pendingChild && (
        <PinDialog
          childId={pendingChild.id}
          childName={pendingChild.name}
          onUnlock={() => { setSelected(pendingChild); fetchChildWeather(pendingChild); setPendingChild(null); setPhase('mood-check'); }}
          onCancel={() => setPendingChild(null)}
        />
      )}

      {/* ChildHeader floats inside ChildPicker via absolute positioning.
          For mood-check, render it as a normal top bar. */}
      {phase === 'mood-check' && <ChildHeader />}

      {phase === 'picker' && (
        <>
          <ChildHeader />
          <ChildPicker children={children} loadState={loadState} onSelect={handleSelect} />
        </>
      )}

      {/* Install prompt shown on mood-check screen */}
      {phase === 'mood-check' && (
        <KidInstallBannerFull prompt={installPrompt} />
      )}

      {phase === 'mood-check' && selected && (
        <MoodCheckIn childName={selected.name} onSelect={handleMoodSelect} />
      )}

      {phase === 'missions' && selected && (
        <>
          <KidInstallBanner prompt={installPrompt} />
          <ChildView
            child={selected}
            missions={displayMissions}
            rewards={rewards}
            streak={streaks[selected.id] ?? 0}
            mood={selectedMood}
            onBack={handleBack}
            onMissionToggle={handleMissionToggle}
            onGenerateMore={handleGenerateMore}
            generatingMore={generatingMore}
            missionRound={missionRound}
            missionPack={missionPack}
            missionError={missionError}
            missionSuccess={missionSuccess}
            weather={weather}
            isDemoMode={isDemoMode}
            isAutoGenerating={autoGenerating}
            autoGenFailed={autoGenFailed}
            onRetryGen={handleRetryAutoGen}
          />
        </>
      )}
    </>
  );
}
