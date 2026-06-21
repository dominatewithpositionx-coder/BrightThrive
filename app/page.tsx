import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-navy">

      {/* ── 1. Hero ── */}
      <section className="bg-gradient-to-b from-green-50 to-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-widest mb-4">
            Positive Behavior Technology for families
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-navy mb-6">
            Turn Screen Time<br />Into Growth Time
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-xl mx-auto">
            Healthy habits. Emotional intelligence. Calmer homes.
          </p>
          <p className="text-base text-gray-500 mb-10 max-w-xl mx-auto">
            BrightThrive is not a screen blocker. We motivate growth, not punishment.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-md transition-colors"
          >
            Get started free
          </Link>
          <p className="mt-4 text-sm text-gray-400">No credit card required · Takes 2 minutes</p>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-white border-y border-gray-100 py-4 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
          <span>🇨🇦 Data stored in Canada</span>
          <span className="hidden sm:inline">·</span>
          <span>No ads</span>
          <span className="hidden sm:inline">·</span>
          <span>No tracking</span>
          <span className="hidden sm:inline">·</span>
          <span>Parents own their data</span>
          <span className="hidden sm:inline">·</span>
          <span>Built on CASEL &amp; Atomic Habits research</span>
        </div>
      </section>

      {/* ── 2. Problem ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">The problem isn&apos;t screens.</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
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
      <section className="py-24 px-4 bg-green-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How BrightThrive works</h2>
            <p className="text-lg text-gray-600">Three simple steps. One calmer family.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', emoji: '😊', heading: 'Check in on mood', body: 'Each day starts with a simple mood check-in. Your child taps how they feel — happy, calm, tired, frustrated — in one tap.' },
              { step: '2', emoji: '🎯', heading: 'Get personalized missions', body: 'BrightThrive generates 5 missions matched to their mood and the weather outside. Short, fun, and built for growth.' },
              { step: '3', emoji: '⭐', heading: 'Earn screen time', body: 'Completing missions earns stars and coins. Redeem them for screen time, treats, or any reward parents set.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-6 shadow-sm">
                <div className="absolute -top-4 -left-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className="text-3xl mb-3 mt-2">{item.emoji}</div>
                <h3 className="font-semibold text-lg mb-2">{item.heading}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Mood + Weather missions ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Missions that meet your child where they are</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              A tired child and an energetic child need different things. BrightThrive uses their mood and your local weather to generate missions that match how they&apos;re feeling right now.
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
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Today&apos;s missions for Mia</p>
            <p className="text-sm text-gray-400 mb-6 italic">Feeling happy · Sunny, 22°C</p>
            <div className="space-y-3">
              {[
                '🌿 Go outside and find 3 different leaves',
                '📖 Read for 15 minutes',
                '💌 Write a kind note to someone you love',
                '🏃 Do 20 jumping jacks',
                '🎨 Draw what made you smile today',
              ].map((m) => (
                <div key={m} className="flex items-center gap-3 bg-white rounded-xl p-3 text-sm shadow-sm">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-300 flex-shrink-0" />
                  <span className="text-gray-700">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Parent clarity / Child confidence ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Parents get clarity.<br />Kids get confidence.<br />Families get calm.
          </h2>
          <p className="text-gray-600 text-lg mb-16 max-w-xl mx-auto">
            No more screen negotiations. No more guilt. Just a clear system your whole family understands.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              {
                who: 'For parents',
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
                bg: 'bg-green-50',
                border: 'border-green-100',
                items: [
                  'Earn screen time — instead of having it taken away',
                  'Feel proud of what they accomplish each day',
                  'Build emotional awareness one mood check at a time',
                  'Always know exactly what to do next',
                ],
              },
            ].map((col) => (
              <div key={col.who} className={`${col.bg} border ${col.border} rounded-2xl p-6`}>
                <h3 className="font-semibold text-lg mb-4">{col.who}</h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Trust + Data Promise ── */}
      <section className="py-24 px-4 bg-navy text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Your family&apos;s data is yours. Always.</h2>
          <p className="text-gray-300 mb-12 max-w-xl mx-auto text-lg">
            BrightThrive is built on a foundation of trust. We will never sell, share, or profit from your family&apos;s data.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: '🇨🇦', heading: 'Stored in Canada', body: 'All family data is stored in Canadian data centres, subject to Canadian privacy law.' },
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
            Built on research from UCLA, Daniel Goleman, CASEL, and Atomic Habits.
          </p>
        </div>
      </section>

      {/* ── 7. Founder note ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl mx-auto mb-6">
            👋
          </div>
          <blockquote className="text-xl text-gray-700 leading-relaxed mb-8">
            &ldquo;I built BrightThrive because I needed it for my own family. I didn&apos;t want to take screens away — I wanted to give my kids a reason to earn them. Everything we build starts with one question: does this make family life calmer?&rdquo;
          </blockquote>
          <p className="font-semibold text-gray-900">Wayne</p>
          <p className="text-sm text-gray-500">Founder, BrightThrive · Dad of two</p>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to turn screen time into growth time?</h2>
          <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
            Join families using BrightThrive to build calmer routines, stronger kids, and fewer screen battles.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-md transition-colors"
          >
            Start your free trial
          </Link>
          <p className="mt-4 text-sm text-gray-400">No credit card required · Cancel any time</p>
        </div>
      </section>

    </div>
  );
}
