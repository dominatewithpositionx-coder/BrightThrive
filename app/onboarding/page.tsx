'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Sparkles, CheckCircle } from 'lucide-react';

const brandGradient = 'linear-gradient(90deg, #22C55E 0%, #14B8A6 50%, #0EA5E9 100%)';

type Step = 'goals' | 'kids' | 'ages' | 'account' | 'done';

const GOALS = [
  { id: 'screen', label: 'Reduce screen time battles' },
  { id: 'chores', label: 'Build responsibility & chores' },
  { id: 'mood', label: 'Support emotional well-being' },
  { id: 'learning', label: 'Encourage reading & learning' },
  { id: 'movement', label: 'Get kids moving more' },
  { id: 'routine', label: 'Establish healthy daily routines' },
];

const AGE_RANGES = ['Under 5', '5–7', '8–10', '11–13', '14+'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goals');
  const [goals, setGoals] = useState<string[]>([]);
  const [numKids, setNumKids] = useState<number | null>(null);
  const [ages, setAges] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps: Step[] = ['goals', 'kids', 'ages', 'account'];
  const stepIndex = steps.indexOf(step);
  const progress = step === 'done' ? 100 : ((stepIndex) / steps.length) * 100;

  function toggleGoal(id: string) {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }

  function toggleAge(age: string) {
    setAges(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = getSupabase();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          onboarding_goals: goals,
          onboarding_num_kids: numKids,
          onboarding_age_ranges: ages,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setStep('done');
  }

  async function handleGoogle() {
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  if (step === 'done') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: brandGradient }}>
          <CheckCircle size={32} color="white" />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#0F172A' }}>You&apos;re all set!</h2>
        <p className="text-base mb-2" style={{ color: '#64748B' }}>Check your email to confirm your account.</p>
        <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>Once confirmed, you can log in and set up your family.</p>
        <button
          onClick={() => router.push('/login')}
          className="text-white px-8 py-3 rounded-full font-semibold transition-opacity hover:opacity-90"
          style={{ background: brandGradient }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2" style={{ color: '#94A3B8' }}>
          <span>Step {stepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: brandGradient }}
          />
        </div>
      </div>

      {/* Step: Goals */}
      {step === 'goals' && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: '#14B8A6' }} />
            <span className="text-xs font-medium" style={{ color: '#0F766E' }}>Let&apos;s personalize your plan</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>What are your goals?</h1>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>Select all that apply — we&apos;ll tailor missions to match.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className="text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: goals.includes(g.id) ? '#14B8A6' : '#E2E8F0',
                  background: goals.includes(g.id) ? '#F0FDFA' : 'white',
                  color: goals.includes(g.id) ? '#0F766E' : '#0F172A',
                }}
              >
                {goals.includes(g.id) && <span className="mr-2">✓</span>}
                {g.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('kids')}
            disabled={goals.length === 0}
            className="w-full text-white py-3 rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: brandGradient }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step: Number of kids */}
      {step === 'kids' && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>How many children?</h1>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>You can always add more later.</p>
          <div className="flex gap-3 flex-wrap mb-8">
            {[1, 2, 3, 4, '5+'].map(n => (
              <button
                key={n}
                onClick={() => setNumKids(typeof n === 'number' ? n : 5)}
                className="w-16 h-16 rounded-2xl border text-lg font-bold transition-all"
                style={{
                  borderColor: numKids === (typeof n === 'number' ? n : 5) ? '#14B8A6' : '#E2E8F0',
                  background: numKids === (typeof n === 'number' ? n : 5) ? '#F0FDFA' : 'white',
                  color: numKids === (typeof n === 'number' ? n : 5) ? '#0F766E' : '#0F172A',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('goals')} className="flex-1 py-3 rounded-full border font-semibold text-sm" style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
              Back
            </button>
            <button
              onClick={() => setStep('ages')}
              disabled={numKids === null}
              className="flex-[2] text-white py-3 rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: brandGradient }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Ages */}
      {step === 'ages' && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>What are their ages?</h1>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>We&apos;ll match missions to the right age group.</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {AGE_RANGES.map(age => (
              <button
                key={age}
                onClick={() => toggleAge(age)}
                className="px-5 py-2.5 rounded-full border text-sm font-medium transition-all"
                style={{
                  borderColor: ages.includes(age) ? '#14B8A6' : '#E2E8F0',
                  background: ages.includes(age) ? '#F0FDFA' : 'white',
                  color: ages.includes(age) ? '#0F766E' : '#0F172A',
                }}
              >
                {ages.includes(age) && '✓ '}{age}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('kids')} className="flex-1 py-3 rounded-full border font-semibold text-sm" style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
              Back
            </button>
            <button
              onClick={() => setStep('account')}
              disabled={ages.length === 0}
              className="flex-[2] text-white py-3 rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: brandGradient }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Create account */}
      {step === 'account' && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>Create your free account</h1>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>Your personalized plan is ready — let&apos;s save it.</p>

          <button
            onClick={handleGoogle}
            className="w-full border py-3 rounded-full flex items-center justify-center gap-2 text-sm font-medium mb-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
          >
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs" style={{ color: '#94A3B8' }}>or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
              required
            />
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
              required
              minLength={6}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: brandGradient }}
            >
              {loading ? 'Creating account…' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: '#94A3B8' }}>
            Already have an account?{' '}
            <a href="/login" className="underline" style={{ color: '#0F766E' }}>Log in</a>
          </p>

          <button onClick={() => setStep('ages')} className="w-full mt-3 text-xs text-center" style={{ color: '#94A3B8' }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
