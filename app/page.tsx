'use client';

import Link from 'next/link';
import {
  Heart,
  Star,
  Clock,
  Brain,
  Users,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-teal-50 pb-20 pt-16 text-center px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-7 shadow-sm border border-green-100">
          <Sparkles size={13} className="text-green-500" />
          Helping families thrive together
        </div>

        {/* H1 */}
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-5 max-w-3xl mx-auto">
          Help Your Kids Build{' '}
          <span className="text-green-600">Healthy Habits</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-9 leading-relaxed">
          BrightThrive turns daily routines into fun missions. Children earn screen time
          through mood check-ins, chores, learning, and kindness.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-teal-500 text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-green-600 transition-colors shadow-sm"
          >
            Start Free Today
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 px-8 py-3.5 rounded-full font-semibold text-base hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* ── FEATURE CARDS ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Everything Your Family Needs</h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
          A complete system for building habits, not just blocking screens.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Heart,
              bg: 'bg-yellow-50',
              color: 'text-yellow-500',
              title: 'Mood Check-Ins',
              desc: 'Kids start each day by sharing how they feel, building emotional awareness.',
            },
            {
              icon: Star,
              bg: 'bg-purple-50',
              color: 'text-purple-500',
              title: 'Daily Missions',
              desc: 'Fun tasks across chores, learning, movement, kindness, and focus.',
            },
            {
              icon: Clock,
              bg: 'bg-blue-50',
              color: 'text-blue-500',
              title: 'Earned Screen Time',
              desc: 'Children earn minutes by completing missions — a positive reward system.',
            },
            {
              icon: Brain,
              bg: 'bg-teal-50',
              color: 'text-green-500',
              title: 'Age-Appropriate',
              desc: 'Missions adapt to each child, perfect for kids ages 5–14.',
            },
            {
              icon: Users,
              bg: 'bg-pink-50',
              color: 'text-pink-500',
              title: 'Parent Dashboard',
              desc: 'Track progress, set goals, and celebrate wins together as a family.',
            },
            {
              icon: CheckCircle,
              bg: 'bg-teal-50',
              color: 'text-green-500',
              title: 'Simple & Calm',
              desc: 'No gamification bloat — just clear, encouraging daily progress.',
            },
          ].map(({ icon: Icon, bg, color, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-teal-50 py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-center text-gray-500 mb-14">
            A simple daily loop that builds real habits over time.
          </p>

          <div className="space-y-8">
            {[
              {
                n: '1',
                title: 'Child checks in',
                desc: 'Start the day by selecting how they feel.',
              },
              {
                n: '2',
                title: 'Missions unlock',
                desc: 'Personalized tasks appear based on age and mood.',
              },
              {
                n: '3',
                title: 'Complete & earn',
                desc: 'Each mission earns screen time minutes.',
              },
              {
                n: '4',
                title: 'Parents track',
                desc: 'View progress and celebrate wins together.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-5">
                <div className="w-11 h-11 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                  {n}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to Help Your Kids Thrive?</h2>
        <p className="text-gray-500 mb-9 max-w-md mx-auto">
          Join families building healthy habits, one mission at a time.
        </p>
        <Link
          href="/login"
          className="inline-block bg-teal-500 text-white px-10 py-4 rounded-full font-semibold text-base hover:bg-green-600 transition-colors shadow-md"
        >
          Create Your Free Account
        </Link>
      </section>

    </div>
  );
}
