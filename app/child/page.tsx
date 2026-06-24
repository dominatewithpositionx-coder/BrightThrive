'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';
import { BRAND } from '@/lib/brand';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, Gift, ChevronLeft, Flame, Lock, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { type MoodKey, MOODS, EI_RESPONSES } from '@/lib/mood';
import { type WeatherData } from '@/lib/weather';
import { updateStreak } from '@/lib/streaks';
import {
  trackMoodSelected,
  trackMissionCompleted,
} from '@/lib/analytics';
import { KidWelcomeIllustration } from '@/components/brightthrive/Illustrations';

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

type Child   = { id: string; name: string; age?: number | null; parent_id?: string | null; points: number };
type Mission = { id: string; child_id: string; title: string; category?: string; screen_time_reward?: number; is_completed: boolean; generated_by?: string };
type Reward  = { id: string; title: string; coin_cost: number };

const CAT_EMOJI: Record<string, string> = {
  movement: '🏃',
  responsibility: '🧹',
  emotional_intelligence: '💛',
  learning: '📚',
  creativity: '🎨',
  family_connection: '👨‍👩‍👧',
  outdoor: '🌤️',
  healthy_habits: '🥦',
  general: '⭐',
};

const AVATAR_COLORS = [
  { bg: 'bg-green-400',  ring: 'ring-green-300',  text: 'text-green-900',  light: 'bg-teal-50'  },
  { bg: 'bg-blue-400',   ring: 'ring-blue-300',   text: 'text-blue-900',   light: 'bg-blue-50'   },
  { bg: 'bg-purple-400', ring: 'ring-purple-300', text: 'text-purple-900', light: 'bg-purple-50' },
  { bg: 'bg-orange-400', ring: 'ring-orange-300', text: 'text-orange-900', light: 'bg-orange-50' },
  { bg: 'bg-pink-400',   ring: 'ring-pink-300',   text: 'text-pink-900',   light: 'bg-pink-50'   },
  { bg: 'bg-teal-400',   ring: 'ring-teal-300',   text: 'text-teal-900',   light: 'bg-teal-50'   },
];
function getColors(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'] });
}

function weatherGradient(data: WeatherData): string {
  const lc = data.condition.toLowerCase();
  if (lc.includes('rain') || lc.includes('shower') || lc.includes('storm')) return 'from-indigo-100 to-blue-100';
  if (lc.includes('snow')) return 'from-blue-100 to-cyan-100';
  if (lc.includes('cloud') || lc.includes('fog')) return 'from-slate-100 to-gray-100';
  return 'from-amber-100 to-orange-100';
}

function ChildWeatherCard({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;
  const outdoorMsg = weather.isOutdoorFriendly
    ? "Nice day outside! Let's earn points outdoors."
    : 'Stay cosy inside — great day for creative missions.';
  return (
    <div className={`mx-4 mt-4 rounded-2xl bg-gradient-to-br ${weatherGradient(weather)} p-4 flex items-center gap-4`}>
      <span className="text-4xl leading-none">{weather.emoji}</span>
      <div>
        <p className="text-base font-bold text-gray-800">{weather.tempC}° — {weather.condition}</p>
        <p className="text-sm text-gray-600 mt-0.5">{outdoorMsg}</p>
      </div>
    </div>
  );
}

// ── PinDialog ─────────────────────────────────────────────────────────────────

function PinDialog({ childName, onUnlock, onCancel }: { childName: string; onUnlock: () => void; onCancel: () => void }) {
  const [digits, setDigits] = useState('');
  const [error, setError]   = useState(false);

  function handleDigit(d: string) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError(false);
    if (next.length === 4) {
      const stored = localStorage.getItem(`bt_pin_${childName.toLowerCase()}`);
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
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
      <Image src={BRAND.mark} alt={BRAND.name} width={BRAND.markWidth} height={BRAND.markHeight} className="h-8 w-auto object-contain" priority />
    </div>
  );
}

type LoadState = 'ok' | 'auth' | 'no-children' | 'query';

function ChildPicker({ children, loadState, onSelect }: { children: Child[]; loadState: LoadState; onSelect: (c: Child) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">

      {/* Auth gate — full-screen redirect prompt, no illustration */}
      {loadState === 'auth' && (
        <div className="text-center max-w-sm space-y-4">
          <div className="text-5xl mb-2">🔒</div>
          <h1 className="text-2xl font-bold text-navy">Parent login required</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Kid Mode is launched from the parent dashboard. Please log in as a parent, then open Kid Mode from there.
          </p>
          <a
            href="/login"
            className="inline-block mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Parent Login
          </a>
        </div>
      )}

      {/* Query / network error */}
      {loadState === 'query' && (
        <div className="text-center max-w-xs space-y-3">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="font-semibold text-gray-700">Could not load profiles</p>
          <p className="text-sm text-gray-500">Check your connection and try again, or ask a parent for help.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Parent has no children set up */}
      {loadState === 'no-children' && (
        <div className="text-center max-w-sm space-y-4">
          <div className="text-5xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold text-navy">Add a child first</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            No child profiles are set up yet. Go to the parent dashboard to add your first child, then come back here.
          </p>
          <a
            href="/dashboard/children"
            className="inline-block mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Add a Child
          </a>
        </div>
      )}

      {/* Child picker */}
      {loadState === 'ok' && children.length > 0 && (
        <>
          <div className="text-center mb-10">
            <KidWelcomeIllustration className="w-64 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-navy">Who&apos;s doing tasks today?</h1>
            <p className="text-gray-500 mt-2 text-base">Tap your name to get started!</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full max-w-lg">
            {children.map((child) => {
              const colors = getColors(child.name);
              return (
                <button
                  key={child.id}
                  onClick={() => onSelect(child)}
                  aria-label={`Select ${child.name}`}
                  className={`${colors.light} border-2 ${colors.ring.replace('ring','border')} rounded-3xl p-6 flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-transform duration-150 shadow-sm`}
                >
                  <div className={`w-20 h-20 rounded-full ${colors.bg} flex items-center justify-center text-4xl font-bold text-white shadow-md`}>
                    {child.name[0].toUpperCase()}
                  </div>
                  <span className={`text-lg font-bold ${colors.text}`}>{child.name}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                    <Star size={14} fill="currentColor" />{child.points} pts
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── MoodCheckIn ───────────────────────────────────────────────────────────────

function MoodCheckIn({ childName, onSelect }: { childName: string; onSelect: (mood: MoodKey) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-10 max-w-xs">
        <p className="text-gray-400 text-sm font-medium mb-2">Hi, {childName}! 👋</p>
        <h1 className="text-2xl font-bold text-navy leading-snug">How are you feeling right now?</h1>
        <p className="text-gray-500 text-sm mt-2">Tap the one that feels most like you.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {MOODS.map((mood) => (
          <button
            key={mood.key}
            onClick={() => onSelect(mood.key)}
            aria-label={`I'm feeling ${mood.label}`}
            className={`${mood.cardBg} border-2 ${mood.cardBorder} rounded-3xl p-5 flex flex-col items-center gap-2 active:scale-95 hover:scale-[1.03] transition-all duration-150 shadow-sm hover:shadow-lg`}
          >
            <span className="text-5xl leading-none">{mood.emoji}</span>
            <span className="text-sm font-semibold text-gray-700">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MoodResponse ──────────────────────────────────────────────────────────────

function MoodResponse({ mood, onContinue }: { mood: MoodKey; onContinue: () => void }) {
  const r     = EI_RESPONSES[mood];
  const emoji = MOODS.find(m => m.key === mood)?.emoji ?? '😊';
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-br ${r.bg} animate-fade-in`}>
      <div className="w-full max-w-sm text-center">
        <div className="text-8xl mb-8 leading-none">{emoji}</div>
        <div className="space-y-3 mb-10">
          <h2 className="text-2xl font-bold text-navy leading-snug">{r.headline}</h2>
          <p className="text-gray-600 text-base leading-relaxed max-w-xs mx-auto">{r.message}</p>
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl text-base font-semibold active:scale-[0.98] hover:bg-gray-800 transition-all duration-150 shadow-lg"
        >
          {r.cta}
        </button>
        <p className="text-xs text-gray-400 mt-5">Your missions are ready for you</p>
      </div>
    </div>
  );
}

// ── ChildView (missions) ──────────────────────────────────────────────────────

function ChildView({ child, missions, rewards, streak, onBack, onMissionToggle, missionError, missionSuccess, weather }: {
  child: Child; missions: Mission[]; rewards: Reward[]; streak: number;
  onBack: () => void; onMissionToggle: (mission: Mission) => void;
  missionError: string | null; missionSuccess: string | null;
  weather: WeatherData | null;
}) {
  const colors = getColors(child.name);
  const pending = missions.filter((m) => !m.is_completed);
  const done    = missions.filter((m) => m.is_completed);
  const allDone = missions.length > 0 && pending.length === 0;
  const progress = missions.length > 0 ? Math.round((done.length / missions.length) * 100) : 0;
  const [showCompleted, setShowCompleted] = useState(false);
  const [showGenerateHint, setShowGenerateHint] = useState(false);

  const sortedRewards = [...rewards].sort((a, b) => a.coin_cost - b.coin_cost);
  const nextReward = sortedRewards.find((r) => r.coin_cost > child.points) || null;
  const affordableRewards = sortedRewards.filter((r) => r.coin_cost <= child.points);
  const rewardProgress = nextReward ? Math.min(100, Math.round((child.points / nextReward.coin_cost) * 100)) : 100;

  return (
    <div className="min-h-screen pb-10 animate-fade-in">
      {/* Header band */}
      <div className={`${colors.bg} pt-safe pb-8 px-5`}>
        <button
          onClick={onBack}
          aria-label="Switch child"
          className="flex items-center gap-1 min-h-[44px] text-white/80 hover:text-white text-sm mb-3 mt-2 transition-colors"
        >
          <ChevronLeft size={18} /> Switch child
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-white/30">
            {child.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Hey {child.name}! 🌟</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Star size={13} fill="white" className="text-white" />
                <span className="text-white font-bold text-sm">{child.points} pts</span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                  <Flame size={13} className="text-white" />
                  <span className="text-white text-sm font-medium">{streak} day streak</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChildWeatherCard weather={weather} />

      <div className="px-4 space-y-5 mt-5 max-w-lg mx-auto">

        {/* Mission progress bar */}
        {missions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-navy">{done.length}/{missions.length} missions done today</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Missions section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Adventures</h2>
          <p className="text-sm text-gray-500 mt-0.5 mb-3">
            {allDone ? '🎉 All done for today!' : `${missions.length} missions · ${pending.length} remaining`}
          </p>
          {(missions.some(m => m.category === 'outdoor') || missions.some(m => m.generated_by === 'claude')) && (
            <span className="inline-block mb-3 text-xs font-medium bg-sky-50 text-sky-600 rounded-full px-3 py-1">🌤 Weather missions included</span>
          )}

          {/* All done celebration — no generate button; only parents generate missions */}
          {allDone && (
            <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-2xl p-6 text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-bold text-teal-800 mb-1">You finished all your missions!</p>
              <p className="text-sm text-teal-600 leading-relaxed">
                Amazing work today! Come back tomorrow for new adventures,<br />
                or ask a parent to add more missions from the dashboard.
              </p>
              {showGenerateHint ? (
                <a
                  href="/dashboard"
                  className="inline-block mt-4 min-h-[44px] bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
                >
                  Go to Parent Dashboard
                </a>
              ) : (
                <button
                  onClick={() => setShowGenerateHint(true)}
                  className="mt-4 text-xs text-teal-500 hover:text-teal-700 underline underline-offset-2 transition-colors"
                >
                  Are you a parent?
                </button>
              )}
            </div>
          )}

          {/* Empty state — missions are generated by parents only */}
          {missions.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <p className="text-gray-700 text-base font-semibold mb-1">No missions yet today</p>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                Ask a parent to generate today&apos;s missions from the dashboard, then come back here.
              </p>
              <a
                href="/dashboard"
                className="inline-block min-h-[44px] bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 active:scale-95 transition-all"
              >
                Go to Parent Dashboard
              </a>
            </div>
          )}

          {missionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center mt-3">
              {missionError}
            </div>
          )}

          {missionSuccess && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-700 text-center mt-3 animate-fade-in">
              {missionSuccess}
            </div>
          )}

          {/* Pending missions */}
          <div className="space-y-3 mt-3">
            <AnimatePresence>
              {pending.map((mission, i) => {
                const emoji = CAT_EMOJI[mission.category ?? 'general'] ?? '⭐';
                const reward = mission.screen_time_reward ?? 10;
                return (
                  <motion.div
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-white rounded-2xl border-2 border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl leading-none">{emoji}</span>
                      <span className="text-lg font-semibold text-navy flex-1">{mission.title}</span>
                      <span className="bg-amber-50 text-amber-600 font-bold text-sm rounded-full px-2.5 py-1 whitespace-nowrap">+{reward} 🪙</span>
                    </div>
                    <button
                      onClick={() => onMissionToggle(mission)}
                      aria-label={`Mark "${mission.title}" as complete`}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-base hover:from-teal-600 hover:to-teal-700 active:scale-[0.98] transition-all"
                    >
                      Complete ✓
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* "New Missions" is only shown in the all-done state above, not while missions are pending */}

        {/* Completed missions (collapsible) */}
        {done.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              aria-label="Toggle completed missions"
              className="w-full min-h-[44px] flex items-center justify-between text-sm font-semibold text-gray-400 uppercase tracking-wide"
            >
              <span>Completed today ({done.length})</span>
              <ChevronDown size={16} className={`transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mt-2 overflow-hidden"
                >
                  {done.map((mission) => (
                    <button
                      key={mission.id}
                      onClick={() => onMissionToggle(mission)}
                      aria-label={`Undo "${mission.title}"`}
                      className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-4 text-left opacity-70 active:scale-[0.98] transition-all duration-150"
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={20} className="text-teal-500" />
                      </div>
                      <span className="text-gray-500 font-medium line-through text-base flex-1">{mission.title}</span>
                      <span className="text-xs text-gray-400">Undo</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Rewards progress */}
        {nextReward && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-purple-500" />
                <span className="font-semibold text-gray-700 text-sm">Next reward</span>
              </div>
              <span className="text-xs text-gray-400">{child.points} / {nextReward.coin_cost} BrytCoins</span>
            </div>
            <p className="font-bold text-navy mb-3">{nextReward.title}</p>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${rewardProgress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">{nextReward.coin_cost - child.points} BrytCoins to go!</p>
          </div>
        )}

        {/* Ready to redeem banner */}
        {affordableRewards.length > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-teal-600" />
              <span className="font-semibold text-teal-800 text-sm">Ready to redeem!</span>
            </div>
            <div className="space-y-1.5">
              {affordableRewards.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="text-green-900 font-medium">{r.title}</span>
                  <span className="text-teal-600 font-semibold">{r.coin_cost} pts</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-teal-600 mt-2 font-medium">Ask a parent to redeem! 🎁</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

type AppPhase = 'picker' | 'mood-check' | 'mood-response' | 'missions';

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
      supabase.from('children').select('id, name, age, parent_id').eq('parent_id', parentId).order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('rewards').select('id, title, coin_cost').eq('parent_id', parentId).order('coin_cost', { ascending: true }),
      supabase.from('family_plans').select('personalization_data').eq('parent_id', parentId).maybeSingle(),
      supabase.from('streaks').select('child_id, current_streak'),
    ]);

    if (childRes.error) {
      console.error('[child] children query error:', childRes.error.message);
      setLoadState('query');
      setLoading(false);
      return;
    }

    if (walletRes.error) console.error('[child] wallet query error:', walletRes.error.message);
    if (rewardRes.error) console.error('[child] rewards query error:', rewardRes.error.message);
    if (planRes.error)   console.error('[child] family_plans query error:', planRes.error.message);
    if (streakRes.error) console.error('[child] streaks query error:', streakRes.error.message);

    const kids = (childRes.data || []);
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

    const loc = (planRes.data?.personalization_data as Record<string, unknown> | null)?.location as string | undefined;
    if (loc && !weather) {
      fetch(`/api/weather?location=${encodeURIComponent(loc)}`)
        .then(r => r.json())
        .then(json => { if (!json.error) setWeather(json as WeatherData); })
        .catch(() => {});
    }
    const walletMap = Object.fromEntries((walletRes.data || []).map(w => [w.child_id, w.balance]));
    const enrichedKids = kids.map(c => ({ ...c, points: walletMap[c.id] ?? 0 }));
    setChildren(enrichedKids);
    setMissions(missionData || []);
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

  // Mission generation is parent-only. Kids display and complete missions; they never create them.

  function handleSelect(child: Child) {
    const pin = localStorage.getItem(`bt_pin_${child.name.toLowerCase()}`);
    if (pin) { setPendingChild(child); }
    else { setSelected(child); setPhase('mood-check'); }
  }

  function handleMoodSelect(mood: MoodKey) {
    setSelectedMood(mood);
    if (selected) trackMoodSelected({ mood, child_id: selected.id });
    setPhase('mood-response');
  }

  function handleBack() {
    setSelected(null);
    setSelectedMood(null);
    setPhase('picker');
  }

  async function handleMissionToggle(mission: Mission) {
    if (!selected) return;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="text-5xl">🌟</div>
          <div className="h-4 bg-gray-200 rounded-full w-32 mx-auto" />
          <div className="h-3 bg-gray-100 rounded-full w-20 mx-auto" />
        </div>
      </div>
    );
  }

  const childMissions = selected ? missions.filter((m) => m.child_id === selected.id) : [];

  return (
    <>
      {pendingChild && (
        <PinDialog
          childName={pendingChild.name}
          onUnlock={() => { setSelected(pendingChild); setPendingChild(null); setPhase('mood-check'); }}
          onCancel={() => setPendingChild(null)}
        />
      )}

      {phase !== 'missions' && <ChildHeader />}

      {phase === 'picker' && (
        <ChildPicker children={children} loadState={loadState} onSelect={handleSelect} />
      )}

      {/* Install prompt shown after child profile is selected (mood-check onwards) */}
      {phase !== 'picker' && phase !== 'missions' && (
        <KidInstallBannerFull prompt={installPrompt} />
      )}

      {phase === 'mood-check' && selected && (
        <MoodCheckIn childName={selected.name} onSelect={handleMoodSelect} />
      )}

      {phase === 'mood-response' && selectedMood && (
        <MoodResponse mood={selectedMood} onContinue={() => setPhase('missions')} />
      )}

      {phase === 'missions' && selected && (
        <>
          <KidInstallBanner prompt={installPrompt} />
          <ChildView
            child={selected}
            missions={childMissions}
            rewards={rewards}
            streak={streaks[selected.id] ?? 0}
            onBack={handleBack}
            onMissionToggle={handleMissionToggle}
            missionError={missionError}
            missionSuccess={missionSuccess}
            weather={weather}
          />
        </>
      )}
    </>
  );
}
