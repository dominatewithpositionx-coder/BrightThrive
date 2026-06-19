'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Smile,
  Gift,
  Sparkles,
  Clock,
  ShieldCheck,
  ChevronRight,
  Star,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-7 border border-green-100">
          <Star size={13} className="text-green-500" />
          Pilot-ready for families and after-school programs
        </div>

        {/* H1 */}
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-5">
          Build better habits.<br />
          <span className="text-green-600">Reward brighter moments.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-4 leading-relaxed">
          BrightThrive helps parents guide routines, screen time, and rewards through a positive
          AI-powered family dashboard kids actually enjoy using.
        </p>

        {/* Control line */}
        <p className="text-base font-medium text-gray-700 mb-9">
          Parents stay in control. Kids stay motivated.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-green-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-green-700 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors"
          >
            Parent Login <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-5">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-gray-500 font-medium">
          <span>Designed for pilot programs, parents, and children ages 5–14</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span>AI-powered insights</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span>Positive, habit-first approach</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span>Parent-controlled rewards</span>
        </div>
      </section>

      {/* ── FEATURE SECTIONS ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Everything your family needs</h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
          One platform for parents to guide and kids to grow — with the tools to make it stick.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Parent Dashboard */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-7">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <LayoutDashboard size={22} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Parent Dashboard</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Set routines, assign tasks, track progress, and manage rewards — all in one calm,
              organised place. See what your kids are working toward every day.
            </p>
          </div>

          {/* Child Mode */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-7">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Smile size={22} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Child Mode</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              A PIN-protected, gamified view kids genuinely enjoy. Big buttons, streaks, points,
              and visible rewards give children a clear and motivating goal each day.
            </p>
          </div>

          {/* Rewards & Screen Time */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-7">
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <Gift size={22} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Rewards & Screen Time</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              You choose what's worth earning. Outings, treats, allowance, or extra screen time.
              Roblox and screen time can be included as parent-approved rewards.
            </p>
          </div>

          {/* AI Insights */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-7">
            <div className="w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
              <Sparkles size={22} className="text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Weekly summaries, behaviour patterns, wins, and practical coaching suggestions —
              generated for your family. Supportive, never critical.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">How it works</h2>
          <p className="text-center text-gray-500 mb-14">Three steps to a more positive family routine.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: LayoutDashboard,
                color: 'text-green-600',
                bg: 'bg-green-100',
                title: 'Set up your family',
                desc: 'Add your children, create routines and tasks, and build a reward catalog that works for your household.',
              },
              {
                step: '2',
                icon: Flame,
                color: 'text-orange-500',
                bg: 'bg-orange-50',
                title: 'Kids complete tasks',
                desc: 'Children log in to their own view, check off tasks, build streaks, and watch their points grow.',
              },
              {
                step: '3',
                icon: Gift,
                color: 'text-purple-500',
                bg: 'bg-purple-50',
                title: 'Earn rewards together',
                desc: 'When kids reach their goal, parents approve the reward. Positive reinforcement the whole family can celebrate.',
              },
            ].map(({ step, icon: Icon, color, bg, title, desc }) => (
              <div key={step} className="text-center">
                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={26} className={color} />
                </div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Step {step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCREEN TIME SUPPORT ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={28} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Screen time as a reward, not a battle</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
              Instead of restricting screen time by default, BrightThrive lets kids earn it.
              Parents set the rules; kids learn that habits and effort unlock the things they love.
              No conflict. No negotiation. Just a clear, fair system everyone understands.
            </p>
          </div>
        </div>
      </section>

      {/* ── PILOT SECTION ────────────────────────────────────────── */}
      <section className="bg-green-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Built for real families</h2>
          <p className="text-green-100 text-base leading-relaxed mb-2">
            BrightThrive is currently in a focused pilot with after-school programs and families.
            Designed for children ages 5–14, it's built to be simple enough for a child to use
            independently and powerful enough for a parent to trust.
          </p>
          <p className="text-green-200 text-sm mt-3">
            Parents stay in control. Kids stay motivated.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to build better habits together?</h2>
        <p className="text-gray-500 mb-9 max-w-lg mx-auto">
          Join families who are turning screen time into something kids earn — and parents feel good about.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-green-600 text-white px-10 py-4 rounded-xl font-semibold text-base hover:bg-green-700 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 text-gray-700 px-10 py-4 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

    </div>
  );
}
