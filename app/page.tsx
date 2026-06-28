import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BrytThrive — Helping Families Grow Stronger, One Small Win at a Time',
  description:
    'BrytThrive helps parents turn daily challenges into positive habits, meaningful conversations, and real family progress — without the battles.',
  openGraph: {
    title: 'BrytThrive — AI-Powered Family Growth Platform',
    description: 'Helping families grow stronger, one small win at a time.',
  },
};

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${light ? 'text-teal-200' : 'text-teal-700'}`}>
      {children}
    </p>
  );
}

function GradientButton({ href, children, secondary }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  if (secondary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center text-teal-700 font-semibold text-base px-7 py-3.5 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-colors min-h-[44px]"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center text-white font-semibold text-base px-8 py-4 rounded-xl shadow-md transition-opacity hover:opacity-90 min-h-[44px]"
      style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
    >
      {children}
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="text-navy">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO — Lead with the parent's world, not the product
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-green-50 via-teal-50 to-white pt-12 pb-20 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel>For parents raising kids in a screen-first world</SectionLabel>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-navy mb-6">
            Helping families grow stronger,<br className="hidden sm:block" />
            <span className="text-teal-600"> one small win at a time.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            BrytThrive helps parents turn daily challenges into positive habits,
            meaningful conversations, and real family progress — without the battles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GradientButton href="/onboarding">Start Your Family Growth Journey</GradientButton>
            <GradientButton href="/how-it-works" secondary>Take the Product Tour</GradientButton>
          </div>
          <p className="mt-5 text-sm text-gray-400">Free to start · No credit card required · Built by parents</p>
        </div>

        {/* Emotional proof strip */}
        <div className="max-w-3xl mx-auto mt-14 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '💚', stat: 'Less conflict', sub: 'around screen time' },
            { emoji: '🔥', stat: 'Daily habits', sub: 'that actually stick' },
            { emoji: '💛', stat: 'Stronger bonds', sub: 'through small wins' },
          ].map((item) => (
            <div key={item.stat} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="font-bold text-navy text-sm">{item.stat}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-white border-y border-gray-100 py-4 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
          <span>🍁 Data stored in Canada</span>
          <span className="hidden sm:inline text-gray-200">·</span>
          <span>No ads. Ever.</span>
          <span className="hidden sm:inline text-gray-200">·</span>
          <span>No third-party data sharing</span>
          <span className="hidden sm:inline text-gray-200">·</span>
          <span>Parents own their data</span>
          <span className="hidden sm:inline text-gray-200">·</span>
          <span>Built by parents, for families</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FOUNDER STORY — Why this exists
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-green-100 flex items-center justify-center text-4xl shadow-sm">
                👨‍👧‍👦
              </div>
              <p className="font-semibold text-gray-900 text-sm text-center md:text-left">Wayne</p>
              <p className="text-xs text-gray-400 text-center md:text-left">Founder · Dad of three</p>
            </div>
            <div>
              <SectionLabel>Why BrytThrive exists</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                I built this because<br />my family needed it.
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base">
                <p>
                  A few years ago, I was in the middle of another argument with my kids about screens. Not a big argument — just the same small one we seemed to have every single day. iPad down. Not yet. Five more minutes. You promised.
                </p>
                <p>
                  I wasn&apos;t angry at my children. I was exhausted from the pattern. And I felt guilty — because I wanted to raise kind, confident, emotionally healthy kids, and this didn&apos;t feel like the way to do it.
                </p>
                <p>
                  I tried chore charts. Reward stickers. Screen-time apps. Nothing felt right. Either too rigid, too complicated, or too easy to ignore after a week.
                </p>
                <p className="font-medium text-navy">
                  So I built BrytThrive — the tool I wished I had. Not to punish. Not to control. But to create a calmer, more connected family through small daily wins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. THE PROBLEM — Show deep empathy before offering any solution
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>The problem parents know too well</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              You&apos;re not failing as a parent.<br />The tools are failing you.
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Modern parenting is genuinely hard. The pressures are real, the guilt is heavy, and the daily struggles are exhausting.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { emoji: '📱', heading: 'Too much screen time', body: 'Every day feels like a negotiation. You set limits; they push back. Nobody feels good about it.' },
              { emoji: '😤', heading: 'Behaviour challenges', body: 'Defiance, meltdowns, and daily battles that leave everyone drained and disconnected.' },
              { emoji: '😥', heading: 'Emotional regulation', body: 'You want to help your child name and manage feelings — but it\'s hard to know where to start.' },
              { emoji: '📋', heading: 'Inconsistent routines', body: 'You know routines matter. Building them — and keeping them — is another story.' },
              { emoji: '😔', heading: 'Parental guilt', body: 'You love your kids fiercely. But some days, you wonder if you\'re doing enough of the right things.' },
              { emoji: '🌱', heading: 'Wanting more', body: 'You want to raise kind, resilient, independent children — and you need real support to get there.' },
            ].map((card) => (
              <div key={card.heading} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h3 className="font-semibold text-navy text-base mb-2">{card.heading}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. EXISTING OPTIONS — Validate the search, name the compromise
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Why existing tools fall short</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              You&apos;ve probably tried some of these.
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Each one solves part of the problem. None of them solve the whole thing.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                tool: 'Chore charts & sticker boards',
                emoji: '📋',
                good: 'Simple to start',
                gap: 'No emotional intelligence, no growth context, no insights. Kids lose interest within a week.',
              },
              {
                tool: 'Reward & behaviour apps',
                emoji: '⭐',
                good: 'Creates short-term motivation',
                gap: 'Rewards without meaning fade fast. The habit doesn\'t outlast the novelty.',
              },
              {
                tool: 'Screen-time controls',
                emoji: '📵',
                good: 'Reduces screen usage',
                gap: 'Restriction without positive alternatives creates resentment, not growth.',
              },
              {
                tool: 'Behaviour trackers',
                emoji: '📊',
                good: 'Identifies patterns',
                gap: 'Knowing the problem doesn\'t guide daily action. Parents still don\'t know what to do tomorrow.',
              },
              {
                tool: 'Parenting books & courses',
                emoji: '📚',
                good: 'Helpful frameworks',
                gap: 'Hard to apply consistently across a busy household with multiple children.',
              },
            ].map((item) => (
              <div key={item.tool} className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy text-sm mb-1">{item.tool}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <span className="text-green-600 font-medium">✓ {item.good}</span>
                    <span className="hidden sm:inline text-gray-300">·</span>
                    <span className="text-red-500 font-medium">✗ {item.gap}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* The Forced Compromise callout */}
          <div className="mt-10 bg-amber-50 border border-amber-100 rounded-3xl p-8 text-center">
            <p className="text-2xl mb-4">⚖️</p>
            <h3 className="text-xl font-bold text-navy mb-3">The impossible choice</h3>
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
              Parents are forced to choose between tools that are <strong>easy to start but don&apos;t create lasting change</strong>, or systems that <strong>might work but are too overwhelming to maintain</strong>.
            </p>
            <p className="mt-4 font-semibold text-teal-700">There is a better way.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. NEW CATEGORY — Introduce BrytThrive as something genuinely different
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-teal-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel light>A new category</SectionLabel>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Introducing the<br />
            <span className="text-green-300">AI-Powered Family Growth Platform.</span>
          </h2>
          <p className="text-teal-100 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            BrytThrive isn&apos;t a chore app. It isn&apos;t a reward app. It isn&apos;t a screen-time manager.
            It&apos;s something new — built on behaviour science, powered by AI, and designed for real family life.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {[
              { emoji: '🧠', label: 'Behaviour Science', body: 'Built on positive reinforcement — not punishment, shame, or coercion.' },
              { emoji: '✨', label: 'AI That Cares', body: 'Missions adapt to each child\'s mood, age, location, and what they need that day.' },
              { emoji: '🎯', label: 'Daily Missions', body: 'Not chores. Missions — purposeful, achievable activities that build real character.' },
              { emoji: '📊', label: 'Parent Insights', body: 'You see patterns, progress, and growth across your whole family at a glance.' },
              { emoji: '🤝', label: 'Family Collaboration', body: 'Everyone knows the system. No surprises. No arguments about who decides what.' },
              { emoji: '🌱', label: 'Meaningful Growth', body: 'Emotional intelligence, responsibility, kindness — built one small win at a time.' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <h3 className="font-semibold text-white mb-1">{item.label}</h3>
                <p className="text-teal-100 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 bg-white/10 border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-white font-semibold text-lg">
              Simple enough for busy families. Powerful enough to create meaningful growth.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. HOW IT WORKS — 4 clear steps
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>How BrytThrive works</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Four steps. One calmer family.</h2>
            <p className="text-gray-500 text-lg">Set it up in minutes. See results in days.</p>
          </div>
          <div className="relative">
            {/* Connector line — desktop only */}
            <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-teal-100 z-0" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {[
                {
                  step: '1',
                  emoji: '🎯',
                  heading: 'Set family goals',
                  body: 'Tell BrytThrive what matters to your family — independence, kindness, reading, movement, or all of it.',
                },
                {
                  step: '2',
                  emoji: '✅',
                  heading: 'Children complete missions',
                  body: 'Each day, kids get a personalised set of fun, purposeful missions matched to their mood and the day ahead.',
                },
                {
                  step: '3',
                  emoji: '🧩',
                  heading: 'AI finds patterns',
                  body: 'BrytThrive tracks what\'s working, notices trends, and adapts to help each child grow at their own pace.',
                },
                {
                  step: '4',
                  emoji: '🎉',
                  heading: 'Parents celebrate wins',
                  body: 'You see real progress. Your child earns real rewards. Your family builds real habits — together.',
                },
              ].map((item) => (
                <div key={item.step} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-center relative">
                  <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4 shadow-sm">
                    {item.step}
                  </div>
                  <div className="text-3xl mb-3">{item.emoji}</div>
                  <h3 className="font-semibold text-navy mb-2">{item.heading}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission mockup */}
          <div className="mt-14 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 border border-amber-100">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Today&apos;s missions for Liam, 9</p>
                <p className="text-sm text-gray-400 mb-5 italic">Feeling excited · Sunny, 21°C · Wednesday</p>
                <div className="space-y-2.5">
                  {[
                    { done: true,  cat: '🏃 Movement',    text: 'Run around outside for 10 minutes' },
                    { done: true,  cat: '📚 Learning',    text: 'Read a chapter of your book' },
                    { done: false, cat: '💝 Kindness',    text: 'Do something kind for a sibling without being asked' },
                    { done: false, cat: '🎨 Creativity',  text: 'Draw your favourite place in the world' },
                    { done: false, cat: '🧘 Mindfulness', text: 'Take 5 slow deep breaths and notice how you feel' },
                  ].map((m) => (
                    <div key={m.text} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${m.done ? 'bg-teal-500' : 'border-2 border-amber-300'}`}>
                        {m.done && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${m.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{m.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.cat}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex flex-col items-center justify-center shadow-lg mx-auto">
                  <p className="text-white font-black text-3xl leading-none">2</p>
                  <p className="text-amber-100 text-xs mt-1">of 5 done</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-amber-700">🪙 20 BrytCoins earned</p>
                <p className="text-xs text-gray-400 mt-1">30 more available today</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. OUTCOMES — Benefits, not features
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50 to-teal-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>What changes for families</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The outcomes that matter most.
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Not metrics. Not engagement rates. Real changes in real families.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                who: 'For your children',
                border: 'border-teal-100',
                accent: 'text-teal-600',
                outcomes: [
                  { emoji: '💪', text: 'More independence — they know what to do, without being told' },
                  { emoji: '🎓', text: 'Stronger confidence from completing real challenges every day' },
                  { emoji: '💛', text: 'Better emotional awareness — they name feelings instead of acting out' },
                  { emoji: '🤝', text: 'More responsibility, taken willingly — not forced' },
                  { emoji: '📱', text: 'Healthier screen habits — earned, not given or taken' },
                ],
              },
              {
                who: 'For your family',
                border: 'border-green-100',
                accent: 'text-green-600',
                outcomes: [
                  { emoji: '😮‍💨', text: 'Less arguing about screens, chores, and routines' },
                  { emoji: '🗣️', text: 'More meaningful conversations — not just corrections' },
                  { emoji: '🔄', text: 'Consistent daily routines that hold themselves together' },
                  { emoji: '🌟', text: 'More moments of genuine pride in who your children are becoming' },
                  { emoji: '🏡', text: 'A calmer, more connected home — the one you always pictured' },
                ],
              },
            ].map((col) => (
              <div key={col.who} className={`bg-white rounded-3xl p-7 border ${col.border} shadow-sm`}>
                <h3 className={`font-bold text-lg ${col.accent} mb-5`}>{col.who}</h3>
                <ul className="space-y-4">
                  {col.outcomes.map((o) => (
                    <li key={o.text} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="text-xl flex-shrink-0">{o.emoji}</span>
                      <span>{o.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. TRUST — Social proof and safety signals
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Built to earn your trust</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Not just another app.<br />A platform your family can count on.
            </h2>
          </div>

          {/* Trust pillars */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {[
              { emoji: '👨‍👩‍👧', label: 'Built for real families', body: 'Designed by a parent of three, tested in real family life — not a lab.' },
              { emoji: '🔒', label: 'Privacy-first', body: 'No ads. No data sharing. Your family\'s information belongs to your family.' },
              { emoji: '🧭', label: 'Parent-led, AI-supported', body: 'You set the values and goals. AI handles the daily personalisation.' },
              { emoji: '🔬', label: 'Behaviour-science inspired', body: 'Every feature is grounded in positive reinforcement and developmental research.' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-navy text-sm mb-2">{item.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. FINAL CTA — Hopeful, human, and clear
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-b from-navy to-gray-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-3xl mx-auto mb-8">
            💚
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            You don&apos;t need to be<br />a perfect parent.
          </h2>
          <p className="text-gray-300 text-xl mb-4 leading-relaxed">
            You just need better support.
          </p>
          <p className="text-gray-400 text-base mb-12 max-w-lg mx-auto leading-relaxed">
            Every small win matters. Every completed mission is a step toward the family life you know is possible. BrytThrive is here to help you get there — one day at a time.
          </p>
          <GradientButton href="/onboarding">Start Your Family Growth Journey</GradientButton>
          <p className="mt-5 text-sm text-gray-500">Free to start · No credit card required · Set up in 2 minutes</p>

          {/* Secondary links */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-500">
            <Link href="/how-it-works" className="hover:text-gray-300 transition-colors">How it works</Link>
            <Link href="/login" className="hover:text-gray-300 transition-colors">Parent login</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy policy</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
