import Link from 'next/link';
import {
  StepParentIllustration,
  StepMissionsIllustration,
  StepMoodCheckIllustration,
  StepCompleteIllustration,
  StepCoinsIllustration,
  StepRewardIllustration,
  StepProgressIllustration,
} from '@/components/brightthrive/Illustrations';

export const metadata = {
  title: 'How BrytThrive Works | BrytThrive',
  description: 'See exactly how BrytThrive helps families build better habits — from daily missions and mood check-ins to earned rewards and parent insights.',
};

const STEPS = [
  {
    number: 1,
    title: 'Parent sets goals',
    description:
      "Tell BrytThrive what matters most to your family — morning routines, homework, kindness, movement, or screen-time balance. Set a daily screen-time budget and choose the habits you want to build.",
    Illustration: StepParentIllustration,
    accent: 'bg-teal-50 border-teal-100',
    badge: 'bg-teal-600',
  },
  {
    number: 2,
    title: 'BrytThrive generates daily missions',
    description:
      "Every morning, our AI creates 5–8 personalized missions matched to your child's age, your family's goals, and today's weather. No two days are the same.",
    Illustration: StepMissionsIllustration,
    accent: 'bg-cyan-50 border-cyan-100',
    badge: 'bg-cyan-600',
  },
  {
    number: 3,
    title: 'Child checks in emotionally',
    description:
      "Your child opens Kid Mode and taps how they're feeling — happy, tired, frustrated, calm. BrytThrive adjusts today's missions to match their energy. One tap. Zero friction.",
    Illustration: StepMoodCheckIllustration,
    accent: 'bg-amber-50 border-amber-100',
    badge: 'bg-amber-500',
  },
  {
    number: 4,
    title: 'Child completes missions',
    description:
      "Kids tackle missions independently — movement, learning, creativity, kindness, family connection. Each one takes 5–20 minutes and earns a satisfying checkmark.",
    Illustration: StepCompleteIllustration,
    accent: 'bg-teal-50 border-teal-100',
    badge: 'bg-teal-600',
  },
  {
    number: 5,
    title: 'BrytCoins are earned',
    description:
      "Every completed mission earns BrytCoins. Kids watch their balance grow in real time — a clear, tangible reward for real effort. No mystery. No moving goalposts.",
    Illustration: StepCoinsIllustration,
    accent: 'bg-yellow-50 border-yellow-100',
    badge: 'bg-yellow-500',
  },
  {
    number: 6,
    title: 'Screen time and rewards unlock',
    description:
      "Coins are redeemed for the rewards you set — screen time, a special treat, a trip to the park, or anything that motivates your family. Kids earn it. Parents approve it.",
    Illustration: StepRewardIllustration,
    accent: 'bg-blue-50 border-blue-100',
    badge: 'bg-blue-600',
  },
  {
    number: 7,
    title: 'Parent sees progress',
    description:
      "Check the dashboard any time to see what was completed, track streaks, and record a family win in the Win Journal. Over time, patterns emerge — and confidence builds.",
    Illustration: StepProgressIllustration,
    accent: 'bg-teal-50 border-teal-100',
    badge: 'bg-teal-700',
  },
] as const;

export default function HowItWorksPage() {
  return (
    <main className="text-navy">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 md:py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-widest mb-3">
            The BrytThrive System
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            How BrytThrive works
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            A simple, repeatable loop that turns screen time into something your whole family feels good about.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
            {['Takes 2 minutes to set up', 'Works every day', 'Kids love it', 'Parents trust it'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1 shadow-sm">
                <span className="text-teal-500">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Step flow ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {STEPS.map((step, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={step.number}>
                <div className={`border ${step.accent} rounded-3xl p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center ${isEven ? '' : 'md:[direction:rtl]'}`}>
                  {/* Illustration */}
                  <div className={`flex justify-center ${isEven ? '' : 'md:[direction:ltr]'}`}>
                    <step.Illustration className="w-36 h-36 md:w-44 md:h-44 drop-shadow-sm" />
                  </div>

                  {/* Text */}
                  <div className={isEven ? '' : 'md:[direction:ltr]'}>
                    <div className={`inline-flex items-center gap-2 ${step.badge} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                      Step {step.number}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-navy mb-3">{step.title}</h2>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Connector arrow (not after last) */}
                {idx < STEPS.length - 1 && (
                  <div className="flex justify-center py-2 text-teal-300 text-2xl select-none" aria-hidden="true">
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Loop callout ── */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white border border-teal-100 rounded-3xl shadow-sm px-8 py-10">
            <p className="text-3xl mb-4" aria-hidden="true">🔁</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Then it repeats — and compounds.</h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-xl mx-auto">
              After a week, kids build streaks. After a month, habits stick. After a year, you have a child who understands cause and effect, takes pride in their work, and earns their downtime with confidence.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-left mt-8">
              {[
                { emoji: '🔥', label: 'Daily streaks', body: "Kids celebrate every consecutive day of missions completed." },
                { emoji: '🪙', label: 'Growing wallet', body: "A coin balance they can see, save, and spend on things they love." },
                { emoji: '📊', label: 'Parent insights', body: "A clear picture of what your child is building — day by day." },
              ].map((f) => (
                <div key={f.label} className="bg-teal-50 rounded-2xl p-4">
                  <p className="text-2xl mb-2">{f.emoji}</p>
                  <p className="font-semibold text-navy mb-1">{f.label}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to try it with your family?</h2>
          <p className="text-gray-600 mb-8">Takes 2 minutes to set up. No credit card required.</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-md transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, #14B8A6 0%, #06B6D4 100%)' }}
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-sm text-gray-400">Already have an account? <Link href="/login" className="text-teal-600 hover:text-teal-700 underline font-medium">Sign in</Link></p>
        </div>
      </section>

    </main>
  );
}
