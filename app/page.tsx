'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, Flame, Gift } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Flame size={14} /> Build better screen habits
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Earn your play.<br />
          <span className="text-green-600">Enjoy your day.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          BrightThrive helps families build better screen habits — kids earn screen time by completing tasks and collecting points.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-green-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/how-it-works"
            className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything your family needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', title: 'Points & Rewards', desc: 'Kids earn points for completing tasks and redeem them for rewards you set.' },
              { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Screen Time Control', desc: 'Set daily screen time limits and let kids earn extra minutes through good habits.' },
              { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Streaks', desc: 'Keep kids motivated with daily streaks that reward consistency.' },
              { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50', title: 'Custom Rewards', desc: 'Create rewards that matter to your family — from movie nights to extra playtime.' },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-gray-500 mb-8">Join families building healthier screen habits with BrightThrive.</p>
        <Link
          href="/login"
          className="inline-block bg-green-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
        >
          Create Your Family Account
        </Link>
      </section>
    </div>
  );
}
