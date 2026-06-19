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

// Brand gradient shared across buttons and accents
const brandGradient = 'linear-gradient(90deg, #22C55E 0%, #14B8A6 50%, #0EA5E9 100%)';
const heroGradient  = 'linear-gradient(180deg, #F9FCFC 0%, #F3FBFA 45%, #EDF8F8 100%)';

export default function HomePage() {
  return (
    <div className="bg-white" style={{ color: '#0F172A' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="pb-20 pt-16 text-center px-4" style={{ background: heroGradient }}>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 bg-white text-sm font-medium px-4 py-1.5 rounded-full mb-7 shadow-sm"
          style={{ border: '1px solid #E2E8F0', color: '#0F766E' }}
        >
          <Sparkles size={13} style={{ color: '#14B8A6' }} />
          Helping families thrive together
        </div>

        {/* H1 */}
        <h1
          className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-5 max-w-3xl mx-auto"
          style={{ color: '#0F172A' }}
        >
          Help Your Kids Build{' '}
          <span
            style={{
              background: brandGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Healthy Habits
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl max-w-xl mx-auto mb-9 leading-relaxed" style={{ color: '#64748B' }}>
          BrightThrive turns daily routines into fun missions. Children earn screen time
          through mood check-ins, chores, learning, and kindness.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/onboarding"
            className="text-white px-8 py-3.5 rounded-full font-semibold text-base transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: brandGradient }}
          >
            Start Free Today
          </Link>
          <Link
            href="/login"
            className="bg-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-gray-50 transition-colors shadow-sm"
            style={{ border: '1px solid #E2E8F0', color: '#0F172A' }}
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* ── FEATURE CARDS ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3" style={{ color: '#0F172A' }}>
          Everything Your Family Needs
        </h2>
        <p className="text-center mb-14 max-w-xl mx-auto" style={{ color: '#64748B' }}>
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
              color: 'text-teal-500',
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
              bg: 'bg-green-50',
              color: 'text-green-500',
              title: 'Simple & Calm',
              desc: 'No gamification bloat — just clear, encouraging daily progress.',
            },
          ].map(({ icon: Icon, bg, color, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#0F172A' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: heroGradient }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ color: '#0F172A' }}>
            How It Works
          </h2>
          <p className="text-center mb-14" style={{ color: '#64748B' }}>
            A simple daily loop that builds real habits over time.
          </p>

          <div className="space-y-8">
            {[
              { n: '1', title: 'Child checks in',  desc: 'Start the day by selecting how they feel.' },
              { n: '2', title: 'Missions unlock',  desc: 'Personalized tasks appear based on age and mood.' },
              { n: '3', title: 'Complete & earn',  desc: 'Each mission earns screen time minutes.' },
              { n: '4', title: 'Parents track',    desc: 'View progress and celebrate wins together.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-5">
                <div
                  className="w-11 h-11 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-sm"
                  style={{ background: brandGradient }}
                >
                  {n}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1" style={{ color: '#0F172A' }}>{title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-3" style={{ color: '#0F172A' }}>
          Ready to Help Your Kids Thrive?
        </h2>
        <p className="mb-9 max-w-md mx-auto" style={{ color: '#64748B' }}>
          Join families building healthy habits, one mission at a time.
        </p>
        <Link
          href="/onboarding"
          className="inline-block text-white px-10 py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90 shadow-md"
          style={{ background: brandGradient }}
        >
          Create Your Free Account
        </Link>
      </section>

    </div>
  );
}
