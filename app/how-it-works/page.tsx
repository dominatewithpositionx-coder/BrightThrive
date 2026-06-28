import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How BrytThrive Works | BrytThrive',
  description:
    'See exactly how BrytThrive helps families build better habits — from daily missions and mood check-ins to earned rewards, parent insights, and long-term family growth.',
};

// ── Design primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${light ? 'text-teal-200' : 'text-teal-600'}`}>
      {children}
    </p>
  );
}

function StepBadge({ n, color }: { n: number; color: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mb-4 ${color}`}>
      {n}
    </span>
  );
}

// ── UI Mockup Components ───────────────────────────────────────────────────────

function GoalSetupCard() {
  const goals = [
    { icon: '🌅', label: 'Morning routine', selected: true },
    { icon: '📱', label: 'Less screen battles', selected: true },
    { icon: '📚', label: 'Homework & reading', selected: false },
    { icon: '💛', label: 'Kindness & empathy', selected: true },
    { icon: '🏃', label: 'Physical activity', selected: false },
    { icon: '🦋', label: 'More independence', selected: false },
  ];
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-teal-400" />
        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Family Growth Profile</p>
      </div>
      <h3 className="font-bold text-navy text-base mb-4">What matters most to your family?</h3>
      <div className="grid grid-cols-2 gap-2">
        {goals.map((g) => (
          <div
            key={g.label}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              g.selected
                ? 'border-teal-400 bg-teal-50 text-teal-800'
                : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}
          >
            <span>{g.icon}</span>
            <span className="leading-tight text-xs">{g.label}</span>
            {g.selected && <span className="ml-auto text-teal-500 text-xs">✓</span>}
          </div>
        ))}
      </div>
      <div className="mt-4 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl py-2.5 text-center text-white text-sm font-semibold">
        Build my family plan →
      </div>
    </div>
  );
}

function FamilyProfileCard() {
  const signals = [
    { icon: '👦', label: 'Liam, age 9', val: 'Energetic · Loves movement' },
    { icon: '🎯', label: 'Primary goal', val: 'Reduce screen battles' },
    { icon: '⭐', label: 'Motivation', val: 'Achievements & streaks' },
    { icon: '🕐', label: 'Routine timing', val: 'After school' },
    { icon: '🌤️', label: "Today's weather", val: 'Sunny, 22°C — outdoor friendly' },
    { icon: '😊', label: 'Current mood', val: 'Excited' },
  ];
  return (
    <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl shadow-xl p-6 max-w-sm mx-auto text-white">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">✨</div>
        <div>
          <p className="font-bold text-sm">BrytThrive AI</p>
          <p className="text-teal-200 text-xs">Building today's plan…</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {signals.map((s) => (
          <div key={s.label} className="flex items-start gap-3 bg-white/10 rounded-xl px-3 py-2">
            <span className="text-lg flex-shrink-0">{s.icon}</span>
            <div>
              <p className="text-teal-200 text-xs">{s.label}</p>
              <p className="text-white text-sm font-medium leading-snug">{s.val}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-white/20 rounded-xl py-2 text-center text-white text-xs font-semibold">
        10 signals combined → personalised day ✓
      </div>
    </div>
  );
}

function MoodPickerCard() {
  const moods = [
    { emoji: '😄', label: 'Happy', selected: false },
    { emoji: '😌', label: 'Calm', selected: false },
    { emoji: '⚡', label: 'Excited', selected: true },
    { emoji: '😴', label: 'Tired', selected: false },
    { emoji: '😤', label: 'Frustrated', selected: false },
  ];
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 max-w-sm mx-auto">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
          👦
        </div>
        <p className="font-bold text-navy">Hey Liam!</p>
        <p className="text-gray-500 text-sm mt-0.5">How are you feeling right now?</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {moods.map((m) => (
          <div
            key={m.label}
            className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all cursor-pointer ${
              m.selected
                ? 'border-amber-400 bg-amber-50 scale-105 shadow-sm'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs font-medium text-gray-600">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-amber-400 rounded-xl py-2.5 text-center text-white text-sm font-semibold shadow-sm">
        Show me my missions! →
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">BrytThrive adjusts missions to match your energy</p>
    </div>
  );
}

function MissionStackCard() {
  const missions = [
    { done: true,  emoji: '🏃', cat: 'Movement',    text: 'Sprint outside for 5 minutes',         coins: 10 },
    { done: true,  emoji: '📚', cat: 'Learning',    text: 'Read for 15 minutes',                  coins: 10 },
    { done: false, emoji: '💝', cat: 'Kindness',    text: 'Do something kind for a sibling',      coins: 10 },
    { done: false, emoji: '🎨', cat: 'Creativity',  text: 'Draw your favourite superhero',        coins: 10 },
    { done: false, emoji: '🧘', cat: 'Mindfulness', text: 'Take 5 slow deep breaths',             coins:  5 },
  ];
  const done = missions.filter(m => m.done).length;
  const total = missions.length;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-navy text-sm">Liam's missions · Wednesday</p>
          <p className="text-xs text-gray-400 mt-0.5">Excited · Sunny, 22°C · After school</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-amber-500">{done}/{total}</p>
          <p className="text-xs text-gray-400">done</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-green-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-2.5">
        {missions.map((m) => (
          <div key={m.text} className={`flex items-center gap-3 rounded-xl p-3 border ${m.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${m.done ? 'bg-teal-500 text-white' : 'border-2 border-gray-200'}`}>
              {m.done ? '✓' : ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug font-medium ${m.done ? 'line-through text-gray-400' : 'text-navy'}`}>{m.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.emoji} {m.cat}</p>
            </div>
            <span className="text-xs font-bold text-amber-500 flex-shrink-0">🪙{m.coins}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-100">
        <span className="text-sm font-semibold text-amber-700">🪙 20 BrytCoins earned</span>
        <span className="text-xs text-amber-500">🔥 5 day streak</span>
      </div>
    </div>
  );
}

function ParentDashboardCard() {
  const children = [
    { name: 'Liam', age: 9, done: 3, total: 5, coins: 140, streak: 5, color: 'bg-teal-500' },
    { name: 'Sofia', age: 7, done: 5, total: 5, coins: 210, streak: 12, color: 'bg-purple-500' },
  ];
  const wins = [
    { text: 'Sofia finished homework without being asked 🎉', time: 'Today' },
    { text: 'Liam chose to read instead of asking for screen time', time: 'Yesterday' },
  ];
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-navy">Parent Dashboard</p>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Today</span>
      </div>
      <div className="space-y-3 mb-4">
        {children.map((c) => (
          <div key={c.name} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full ${c.color} text-white text-sm font-bold flex items-center justify-center`}>
                {c.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-navy text-sm">{c.name}, {c.age}</p>
                <p className="text-xs text-gray-400">{c.done}/{c.total} missions · 🔥{c.streak} days · 🪙{c.coins}</p>
              </div>
              <div className="text-xs font-bold text-teal-600">{Math.round(c.done/c.total*100)}%</div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-1.5 bg-teal-400 rounded-full" style={{ width: `${Math.round(c.done/c.total*100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📔 Win Journal</p>
        <div className="space-y-2">
          {wins.map((w) => (
            <div key={w.text} className="flex gap-2 text-xs">
              <span className="text-teal-500 flex-shrink-0 mt-0.5">✓</span>
              <div>
                <p className="text-gray-700 leading-snug">{w.text}</p>
                <p className="text-gray-400 mt-0.5">{w.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RewardWalletCard() {
  const rewards = [
    { emoji: '📱', name: '30 min screen time',    cost: 30, available: true },
    { emoji: '🎮', name: 'Roblox session',         cost: 50, available: true },
    { emoji: '🍦', name: 'Ice cream after dinner', cost: 40, available: false },
    { emoji: '🎬', name: 'Family movie night',     cost: 80, available: false },
  ];
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 max-w-sm mx-auto">
      {/* Wallet balance */}
      <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-4 mb-5 text-white text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-100 mb-1">BrytCoin Wallet</p>
        <p className="text-4xl font-black">🪙 65</p>
        <p className="text-amber-100 text-xs mt-1">Earned this week</p>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rewards you can unlock</p>
      <div className="space-y-2.5">
        {rewards.map((r) => (
          <div key={r.name} className={`flex items-center gap-3 rounded-xl p-3 border ${r.available ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <span className="text-2xl">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy leading-snug">{r.name}</p>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${r.available ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
              🪙{r.cost}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-gray-400 mt-3">Earn 15 more coins to unlock Ice Cream 🍦</p>
    </div>
  );
}

function GrowthTimelineCard() {
  const milestones = [
    { week: 'Week 1', title: 'First habit built', detail: 'Liam completes morning routine 5 days in a row', emoji: '🌱' },
    { week: 'Week 3', title: 'Streak milestone', detail: 'Sofia hits a 14-day streak — longest ever', emoji: '🔥' },
    { week: 'Month 2', title: 'AI learns patterns', detail: 'Missions shift to match after-school energy peaks', emoji: '✨' },
    { week: 'Month 3', title: 'Family transformed', detail: 'Screen arguments down 80%. Kids ask to do missions.', emoji: '🏡' },
  ];
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 max-w-sm mx-auto">
      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-4">Growth Timeline</p>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-teal-100" />
        <div className="space-y-5">
          {milestones.map((m, i) => (
            <div key={m.week} className="flex gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10 ${
                i === milestones.length - 1 ? 'bg-gradient-to-br from-teal-400 to-green-400 shadow-md' : 'bg-white border-2 border-teal-200'
              }`}>
                {m.emoji}
              </div>
              <div className="pt-0.5">
                <span className="text-xs font-bold text-teal-600">{m.week}</span>
                <p className="font-semibold text-navy text-sm">{m.title}</p>
                <p className="text-gray-500 text-xs leading-snug mt-0.5">{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GrowthLoop() {
  const steps = [
    { emoji: '🎯', label: 'Family Goals', color: 'bg-teal-500' },
    { emoji: '✅', label: 'Daily Missions', color: 'bg-green-500' },
    { emoji: '🧒', label: 'Child Action', color: 'bg-amber-500' },
    { emoji: '🎉', label: 'Parent Celebrates', color: 'bg-purple-500' },
    { emoji: '🧠', label: 'AI Learns', color: 'bg-cyan-500' },
    { emoji: '⬆️', label: 'Better Tomorrow', color: 'bg-teal-600' },
  ];
  return (
    <div className="relative max-w-xs mx-auto">
      {/* Circular arrangement */}
      <div className="relative w-72 h-72 mx-auto">
        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex flex-col items-center justify-center shadow-lg">
            <span className="text-2xl">🔁</span>
            <span className="text-white text-xs font-bold mt-0.5">Growth</span>
          </div>
        </div>
        {/* Orbit ring */}
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-teal-200" />
        {/* Steps positioned around the circle */}
        {steps.map((s, i) => {
          const angle = (i / steps.length) * 360 - 90; // start at top
          const rad = (angle * Math.PI) / 180;
          const r = 120; // radius in px from center
          const cx = 144; // center x
          const cy = 144; // center y
          const x = cx + r * Math.cos(rad) - 28; // 28 = half of w-14
          const y = cy + r * Math.sin(rad) - 28;
          return (
            <div
              key={s.label}
              className="absolute w-14 flex flex-col items-center gap-1"
              style={{ left: x, top: y }}
            >
              <div className={`w-10 h-10 rounded-full ${s.color} text-white flex items-center justify-center text-lg shadow-md`}>
                {s.emoji}
              </div>
              <span className="text-xs font-semibold text-navy text-center leading-tight w-16">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <main className="text-navy">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-teal-50 via-green-50 to-white pt-14 pb-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>The BrytThrive System</SectionLabel>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
            How BrytThrive Works
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto">
            A simple daily system that helps children build habits while giving parents meaningful insight — one small win at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center text-white font-semibold text-base px-8 py-4 rounded-xl shadow-md transition-opacity hover:opacity-90 min-h-[44px]"
              style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
            >
              Start Free
            </Link>
            <Link
              href="#growth-loop"
              className="inline-flex items-center justify-center text-teal-700 font-semibold text-base px-7 py-3.5 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-colors min-h-[44px]"
            >
              See the Daily Loop
            </Link>
          </div>
          {/* Trust chips */}
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            {[
              '⚡ Set up in 2 minutes',
              '🔒 Privacy first',
              '✨ AI-powered',
              '🍁 Data in Canada',
            ].map((t) => (
              <span key={t} className="bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Family Growth Profile
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <StepBadge n={1} color="bg-teal-600" />
            <SectionLabel>Getting started</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              You create a<br />Family Growth Profile.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              BrytThrive starts by learning what matters most to your family. You tell us about your goals, your child's personality, what motivates them, and what success looks like for you.
            </p>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                { icon: '🎯', text: 'Family goals — routines, kindness, reading, movement' },
                { icon: '👦', text: "Your child's age and personality" },
                { icon: '⭐', text: 'What motivates them — achievements, praise, rewards' },
                { icon: '🕐', text: 'When routines matter — morning, after school, evenings' },
                { icon: '⏱️', text: 'Screen-time preferences and daily budget' },
                { icon: '🌟', text: 'What success looks like for your family' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <GoalSetupCard />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — BrytThrive Learns Your Family
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <FamilyProfileCard />
          </div>
          <div className="order-1 md:order-2">
            <StepBadge n={2} color="bg-cyan-600" />
            <SectionLabel>Personalisation</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              BrytThrive learns<br />your family.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Every day, BrytThrive combines your family profile with real-time signals to build a personalised plan — not a generic list of tasks.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '👦', label: 'Child age & stage' },
                { icon: '🎯', label: 'Family goals' },
                { icon: '⭐', label: 'Motivation style' },
                { icon: '😊', label: "Today's mood" },
                { icon: '🌤️', label: 'Local weather' },
                { icon: '🏠', label: 'Location & setting' },
                { icon: '🕐', label: 'Routine timing' },
                { icon: '📈', label: 'Previous progress' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-medium text-navy">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-teal-700 font-medium">
              → Combines into one perfectly personalised day.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Mood Check-In
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <StepBadge n={3} color="bg-amber-500" />
            <SectionLabel>Kid Mode</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              Your child checks in<br />emotionally. One tap.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Before missions begin, your child opens Kid Mode and taps how they feel. This single tap is surprisingly powerful — it helps them build emotional awareness, and it tells BrytThrive how to set the right energy for the day.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="font-semibold text-amber-800 mb-3 text-sm">How mood shapes the day:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  { m: '⚡ Excited', missions: 'Big physical challenges and outdoor adventures' },
                  { m: '😌 Calm', missions: 'Creative tasks, reading, and mindfulness' },
                  { m: '😴 Tired', missions: 'Short, gentle tasks — easy wins that build confidence' },
                  { m: '😤 Frustrated', missions: 'Movement missions to release energy, then connection' },
                ].map((item) => (
                  <li key={item.m} className="flex items-start gap-2">
                    <span className="font-semibold text-amber-700 w-24 flex-shrink-0">{item.m}</span>
                    <span className="text-gray-600">{item.missions}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <MoodPickerCard />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Daily Missions
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50 to-teal-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <MissionStackCard />
          </div>
          <div className="order-1 md:order-2">
            <StepBadge n={4} color="bg-teal-600" />
            <SectionLabel>The heart of BrytThrive</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              Personalised missions<br />appear. Not chores.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              BrytThrive generates a set of purposeful, achievable missions — each one matched to your child's mood, age, goals, and what the day looks like outside. No two days are the same.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { emoji: '🏃', cat: 'Movement' },
                { emoji: '📚', cat: 'Learning' },
                { emoji: '💛', cat: 'Kindness' },
                { emoji: '🎨', cat: 'Creativity' },
                { emoji: '🧘', cat: 'Mindfulness' },
                { emoji: '🤝', cat: 'Family' },
                { emoji: '🌿', cat: 'Outdoor' },
                { emoji: '📝', cat: 'Homework' },
                { emoji: '🌱', cat: 'Responsibility' },
              ].map((c) => (
                <div key={c.cat} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
                  <span>{c.emoji}</span>
                  <span className="text-xs font-medium text-navy">{c.cat}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">Each mission earns BrytCoins · Takes 5–20 minutes</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — Parent Insights
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <StepBadge n={5} color="bg-sky-600" />
            <SectionLabel>Parent dashboard</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              You see real insight,<br />not just activity.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              The parent dashboard gives you a clear view of what's working — and what each child needs. No overwhelming reports. Just the things that matter most.
            </p>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                { icon: '✅', text: 'Missions completed today — at a glance' },
                { icon: '🔥', text: 'Streaks and momentum for each child' },
                { icon: '🪙', text: 'BrytCoin balance and reward history' },
                { icon: '📔', text: 'Win Journal — record family breakthroughs' },
                { icon: '📈', text: 'Weekly progress and habit trends' },
                { icon: '😊', text: 'Mood patterns over time' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ParentDashboardCard />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — Rewards
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <RewardWalletCard />
          </div>
          <div className="order-1 md:order-2">
            <StepBadge n={6} color="bg-amber-500" />
            <SectionLabel>BrytCoin rewards</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              Children earn rewards<br />they actually want.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              BrytCoins are a real currency — earned through effort, saved with intention, and redeemed for rewards that genuinely motivate your child. You set the rewards. They earn them.
            </p>
            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">Parents set rewards like:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  '📱 Screen time', '🎮 Roblox session', '🍦 Ice cream', '🎬 Movie night',
                  '🌙 Stay up late', '🛒 Choose dinner', '🎲 Board game', '🚗 Special outing',
                ].map((r) => (
                  <span key={r} className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">No mystery. No moving goalposts. Rewards your child can see, save toward, and trust.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — Growth Over Time
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <StepBadge n={7} color="bg-purple-600" />
            <SectionLabel>Long-term growth</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              BrytThrive gets smarter<br />the longer you use it.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Unlike chore charts or sticker boards that repeat the same things forever, BrytThrive learns from your family. What motivates each child. When they struggle. Which routines hold. What kind of encouragement helps.
            </p>
            <div className="space-y-3">
              {[
                { icon: '📅', title: 'Week 1', body: 'Habits take root. Kids understand the system.' },
                { icon: '🔥', title: 'Week 3', body: 'Streaks build momentum. Progress becomes visible.' },
                { icon: '✨', title: 'Month 2', body: 'AI adapts to each child\'s patterns and peaks.' },
                { icon: '🏡', title: 'Month 3+', body: 'Less conflict. Stronger routines. Calmer home.' },
              ].map((m) => (
                <div key={m.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="font-semibold text-navy text-sm">{m.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <GrowthTimelineCard />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAMILY GROWTH LOOP
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="growth-loop" className="py-24 px-4 bg-gradient-to-b from-teal-50 to-white scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel>The virtuous cycle</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The Family Growth Loop</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-14">
            Each day feeds the next. Each win teaches the AI. Each mission builds the child. The loop never stops growing.
          </p>

          <div className="bg-white rounded-3xl border border-teal-100 shadow-sm p-8 md:p-12 mb-12">
            <GrowthLoop />

            {/* Linear fallback labels for clarity on all screen sizes */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { emoji: '🎯', label: 'Family Goals', detail: 'You set the values & priorities' },
                { emoji: '✅', label: 'Daily Missions', detail: 'AI builds a personalised plan' },
                { emoji: '🧒', label: 'Child Acts', detail: 'Missions completed, coins earned' },
                { emoji: '🎉', label: 'Parent Celebrates', detail: 'Dashboard, win journal, rewards' },
                { emoji: '🧠', label: 'AI Learns', detail: 'Patterns noticed, plan improved' },
                { emoji: '⬆️', label: 'Better Tomorrow', detail: 'Every day is smarter than the last' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <p className="font-semibold text-navy text-sm">{s.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-snug">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-b from-navy to-gray-900 rounded-3xl p-10 text-white">
            <div className="w-14 h-14 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-2xl mx-auto mb-6">
              💚
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Ready to start the loop?</h3>
            <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
              Set up your family's first Growth Profile in 2 minutes. No credit card. No commitment. Just a calmer family, one small win at a time.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center text-white font-semibold text-base px-10 py-4 rounded-xl shadow-lg transition-opacity hover:opacity-90 min-h-[44px]"
              style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
            >
              Start Your Family Growth Journey
            </Link>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-500">
              <Link href="/login" className="hover:text-gray-300 transition-colors">Parent login</Link>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy policy</Link>
              <Link href="/" className="hover:text-gray-300 transition-colors">Back to home</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
