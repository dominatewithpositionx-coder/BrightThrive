import Link from 'next/link';
import {
  FamilyHeroIllustration,
  AppMockupIllustration,
  StepMoodCheckIllustration,
  StepMissionsIllustration,
  StepCoinsIllustration,
} from '@/components/brightthrive/Illustrations';

export default function HomePage() {
  return (
    <div className="text-navy">

      {/* ── 1. Hero ── */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 md:py-20 px-4 animate-fade-in overflow-hidden">
        <div className="max-w-5xl mx-auto">
          {/* Top row: text + family illustration */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
            <div className="text-center md:text-left">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-widest mb-4">
                Positive Behavior Technology For Families
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-navy mb-6">
                Turn Screen Time<br />Into Growth Time
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Healthy habits.{' '}
                <span className="block sm:inline">Emotional intelligence.</span>{' '}
                <span className="block sm:inline">Calmer homes.</span>
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center w-full md:w-auto text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-md transition-opacity hover:opacity-90 min-h-[44px]"
                style={{ background: 'linear-gradient(90deg, #14B8A6 0%, #06B6D4 100%)' }}
              >
                Get Started Free
              </Link>
              <p className="mt-4 text-sm text-gray-400">No credit card required · Takes 2 minutes</p>
              <p className="mt-3 text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium underline">
                  Parent Login
                </Link>
              </p>
            </div>

            {/* Family illustration — hidden on mobile so hero stays clean */}
            <div className="hidden md:flex justify-center items-center">
              <FamilyHeroIllustration className="w-full max-w-sm" />
            </div>
          </div>

          {/* App mockup preview — centered below on all sizes */}
          <div className="flex justify-center md:hidden">
            <AppMockupIllustration className="w-48 drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-white border-y border-gray-100 py-4 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
          <span>🍁 Data stored in Canada</span>
          <span className="hidden sm:inline">·</span>
          <span>No ads</span>
          <span className="hidden sm:inline">·</span>
          <span>No tracking</span>
          <span className="hidden sm:inline">·</span>
          <span>Parents own their data</span>
          <span className="hidden sm:inline">·</span>
          <span>Built by parents, for families</span>
        </div>
      </section>

      {/* ── 2. Problem ── */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The problem isn&apos;t screens.</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            It&apos;s what screens replace. When kids go straight to YouTube or Roblox, they skip reading, movement, creativity, and connection — the building blocks of a thriving childhood.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left mt-12">
            {[
              { emoji: '😤', heading: 'Daily battles', body: 'Screen time negotiations drain everyone. Parents give in; kids tune out.' },
              { emoji: '📉', heading: 'Missed growth', body: 'Hours lost to passive scrolling are hours not spent building real skills.' },
              { emoji: '😞', heading: 'Guilt on both sides', body: 'Parents feel like they\'re failing. Kids feel controlled. Nobody wins.' },
            ].map((card) => (
              <div key={card.heading} className="bg-gray-50 rounded-2xl p-6">
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h3 className="font-semibold text-lg mb-2">{card.heading}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How it works ── */}
      <section className="py-16 md:py-24 px-4 bg-teal-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How BrytThrive works</h2>
            <p className="text-lg text-gray-600">Three simple steps. One calmer family.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                Illustration: StepMoodCheckIllustration,
                heading: 'Check in on mood',
                body: 'Each day starts with a simple mood check-in. Your child taps how they feel — happy, calm, tired, frustrated — in one tap.',
              },
              {
                step: '2',
                Illustration: StepMissionsIllustration,
                heading: 'Get personalized missions',
                body: 'BrytThrive generates 5 missions matched to their mood and the weather outside. Short, fun, and built for growth.',
              },
              {
                step: '3',
                Illustration: StepCoinsIllustration,
                heading: 'Earn screen time',
                body: 'Completing missions earns BrytCoins. Redeem them for screen time, treats, or any reward parents set.',
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-6 shadow-sm">
                <div className="absolute -top-4 -left-2 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                {/* Illustration */}
                <div className="flex justify-center mb-4 mt-2">
                  <item.Illustration className="w-24 h-24" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.heading}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/how-it-works" className="text-sm font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2">
              See the full 7-step flow →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Mood + Weather missions ── */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Missions that meet your child where they are</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              A tired child and an energetic child need different things. BrytThrive uses their mood and your local weather to generate missions that match how they&apos;re feeling right now.
            </p>
            <ul className="space-y-3 text-sm">
              {[
                { emoji: '⚡', text: 'Energetic? Movement missions and outdoor challenges.' },
                { emoji: '😴', text: 'Tired? Gentle, short tasks — small wins that build confidence.' },
                { emoji: '😔', text: 'Sad? Kindness acts and connection missions.' },
                { emoji: '🌧️', text: 'Rainy day? Indoor creative and reading missions.' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-gray-600">
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-6 md:p-8">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Today&apos;s missions for Mia</p>
            <p className="text-sm text-gray-400 mb-6 italic">Feeling happy · Sunny, 22°C</p>
            <div className="space-y-3">
              {[
                { done: true,  text: '🌿 Go outside and find 3 different leaves' },
                { done: true,  text: '📖 Read for 15 minutes' },
                { done: false, text: '💌 Write a kind note to someone you love' },
                { done: false, text: '🏃 Do 20 jumping jacks' },
                { done: false, text: '🎨 Draw what made you smile today' },
              ].map((m) => (
                <div key={m.text} className="flex items-center gap-3 bg-white rounded-xl p-3 text-sm shadow-sm">
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${m.done ? 'bg-teal-500' : 'border-2 border-amber-300'}`}>
                    {m.done && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-gray-700 ${m.done ? 'line-through text-gray-400' : ''}`}>{m.text}</span>
                </div>
              ))}
            </div>
            {/* Coin earned indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-semibold">
              <span>🪙</span>
              <span>20 BrytCoins earned so far today</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Features grid ── */}
      <section className="py-16 md:py-24 px-4 bg-teal-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything your family needs. Nothing you don&apos;t.</h2>
          <p className="text-gray-600 mb-12">Built for real family life — not a classroom, not a clinic.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {[
              { emoji: '✨', label: 'AI-Powered Missions',    body: 'Personalized daily missions generated by AI, matched to mood and weather.' },
              { emoji: '😊', label: 'Emotional Check-ins',   body: 'Kids rate their mood in one tap. BrytThrive responds — not ignores it.' },
              { emoji: '🔥', label: 'Streaks & Momentum',    body: 'Daily streaks build habits. Kids celebrate every consecutive win.' },
              { emoji: '🪙', label: 'BrytCoin Rewards',      body: 'A visible, tangible reward system kids actually understand and trust.' },
              { emoji: '📊', label: 'Parent Insights',       body: 'See what your child completed, earned, and achieved — at a glance.' },
              { emoji: '🔒', label: 'Privacy First',         body: 'No ads. No tracking. No third-party data sharing. Ever.' },
            ].map((f) => (
              <div key={f.label} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl mb-3">
                  {f.emoji}
                </div>
                <h3 className="font-semibold text-navy mb-1">{f.label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Parent clarity / Child confidence ── */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Parents get clarity.<br />Kids get confidence.<br />Families get calm.
          </h2>
          <p className="text-gray-600 text-lg mb-16 max-w-xl mx-auto">
            No more screen negotiations. No more guilt. Just a clear system your whole family understands.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              {
                who: 'For parents',
                icon: '🧑‍💼',
                bg: 'bg-sky-50',
                border: 'border-sky-100',
                items: [
                  'See exactly what your child has completed today',
                  'Set custom rewards that matter to your family',
                  'Know your child is growing every single day',
                  'Stop being the bad guy — the system holds the boundary',
                ],
              },
              {
                who: 'For children',
                icon: '🧒',
                bg: 'bg-teal-50',
                border: 'border-teal-100',
                items: [
                  'Earn screen time — instead of having it taken away',
                  'Feel proud of what they accomplish each day',
                  'Build emotional awareness one mood check at a time',
                  'Always know exactly what to do next',
                ],
              },
            ].map((col) => (
              <div key={col.who} className={`${col.bg} border ${col.border} rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{col.icon}</span>
                  <h3 className="font-semibold text-lg">{col.who}</h3>
                </div>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-teal-500 font-bold mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Trust + Data Promise ── */}
      <section className="py-16 md:py-24 px-4 bg-navy text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Your family&apos;s data is yours. Always.</h2>
          <p className="text-gray-300 mb-12 max-w-xl mx-auto text-lg">
            BrytThrive is built on a foundation of trust. We will never sell, share, or profit from your family&apos;s data.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: '🍁', heading: 'Stored in Canada', body: 'All family data is stored in Canadian data centres, subject to Canadian privacy law.' },
              { emoji: '🚫', heading: 'No ads. Ever.', body: 'We are funded by subscriptions, not advertising. Your children are not the product.' },
              { emoji: '🔒', heading: 'You own your data', body: 'Request a full export or delete your account at any time — no questions asked.' },
            ].map((item) => (
              <div key={item.heading} className="bg-white/10 rounded-2xl p-6 text-left">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold mb-2">{item.heading}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-gray-400">
            Built by parents, informed by lived experience, and designed to help families navigate the challenges of raising children in today&apos;s digital world — one small win at a time.
          </p>
        </div>
      </section>

      {/* ── 8. Founder note ── */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl mx-auto mb-6" aria-hidden="true">
            👋
          </div>
          <blockquote className="text-xl text-gray-700 leading-relaxed mb-8">
            &ldquo;I built BrytThrive because I needed it for my own family. I didn&apos;t want to take screens away — I wanted to give my kids a reason to earn them. Everything we build starts with one question: does this make family life calmer?&rdquo;
          </blockquote>
          <p className="font-semibold text-gray-900">Wayne</p>
          <p className="text-sm text-gray-500">Founder, BrytThrive · Dad of three</p>
        </div>
      </section>

      {/* ── 9. Final CTA ── */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to turn screen time into growth time?</h2>
          <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
            Join families using BrytThrive to build calmer routines, stronger kids, and fewer screen battles.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center w-full md:w-auto text-white font-semibold text-lg px-10 py-4 rounded-xl shadow-md transition-opacity hover:opacity-90 min-h-[44px]"
            style={{ background: 'linear-gradient(90deg, #14B8A6 0%, #06B6D4 100%)' }}
          >
            Start your free trial
          </Link>
          <p className="mt-4 text-sm text-gray-400">No credit card required · Cancel any time</p>
        </div>
      </section>

    </div>
  );
}
