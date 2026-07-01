'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase, getSupabaseConfigStatus } from '@/lib/supabase';
import { CheckCircle, Sparkles } from 'lucide-react';

const brandGradient = 'linear-gradient(90deg, #22C55E 0%, #14B8A6 50%, #0EA5E9 100%)';

// ── Question data ────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key: 'primary_goal',
    question: 'What would you most like help with right now?',
    subtitle: 'We\'ll build your family plan around this.',
    multi: false,
    options: [
      { label: 'Healthy routines',          icon: '🌅' },
      { label: 'Less screen time battles',  icon: '📵' },
      { label: 'More independence',         icon: '🦋' },
      { label: 'Homework and learning',     icon: '📚' },
      { label: 'Kindness and responsibility', icon: '💛' },
      { label: 'Better family balance',     icon: '⚖️' },
    ],
  },
  {
    key: 'child_description',
    question: 'What best describes your child?',
    subtitle: 'We\'ll tailor missions to fit their personality.',
    multi: false,
    options: [
      { label: 'Easily distracted',         icon: '🌀' },
      { label: 'Highly energetic',          icon: '⚡' },
      { label: 'Loves learning',            icon: '🔭' },
      { label: 'Needs encouragement',       icon: '🤗' },
      { label: 'Creative and imaginative',  icon: '🎨' },
      { label: 'Strong-willed',             icon: '💪' },
    ],
  },
  {
    key: 'parent_involvement',
    question: 'How involved do you want to be?',
    subtitle: 'You can always adjust this later.',
    multi: false,
    options: [
      { label: 'Very involved',             icon: '🙋' },
      { label: 'Some reminders are okay',   icon: '🔔' },
      { label: 'Mostly independent',        icon: '🪁' },
    ],
  },
  {
    key: 'motivation_preference',
    question: 'What motivates your child most?',
    subtitle: 'We\'ll use this to make rewards feel exciting.',
    multi: false,
    options: [
      { label: 'Screen time',               icon: '📱' },
      { label: 'Roblox',                    icon: '🎮' },
      { label: 'Time with family',          icon: '👨‍👩‍👧' },
      { label: 'Small rewards',             icon: '🎁' },
      { label: 'Achievements and streaks',  icon: '🏆' },
      { label: 'Praise and encouragement',  icon: '⭐' },
    ],
  },
  {
    key: 'selected_habits',
    question: 'What habits matter most?',
    subtitle: 'Pick up to 3 — these become your child\'s daily missions.',
    multi: true,
    maxSelect: 3,
    options: [
      { label: 'Morning routine',           icon: '🌞' },
      { label: 'Homework',                  icon: '✏️' },
      { label: 'Reading',                   icon: '📖' },
      { label: 'Chores',                    icon: '🧹' },
      { label: 'Physical activity',         icon: '🏃' },
      { label: 'Gratitude',                 icon: '🙏' },
      { label: 'Kindness',                  icon: '💚' },
      { label: 'Bedtime routine',           icon: '🌙' },
      { label: 'Healthy eating',            icon: '🥦' },
    ],
  },
  {
    key: 'screen_time_preference',
    question: 'How many minutes of earned screen time feels right?',
    subtitle: 'Kids unlock this by completing their missions.',
    multi: false,
    options: [
      { label: '30 minutes',                icon: '⏱️' },
      { label: '60 minutes',                icon: '⏰' },
      { label: '90 minutes',                icon: '🕐' },
      { label: 'Parent decides daily',      icon: '🎛️' },
    ],
  },
  {
    key: 'routine_timing',
    question: 'When do routines matter most?',
    subtitle: 'We\'ll schedule missions around your family\'s rhythm.',
    multi: false,
    options: [
      { label: 'Before school',             icon: '🌄' },
      { label: 'After school',              icon: '🎒' },
      { label: 'Evening',                   icon: '🌆' },
      { label: 'Weekends',                  icon: '🏡' },
    ],
  },
  {
    key: 'success_definition',
    question: 'What does success look like for your family?',
    subtitle: 'This helps us keep your plan focused on what matters.',
    multi: false,
    options: [
      { label: 'Less arguing',              icon: '🕊️' },
      { label: 'More responsibility',       icon: '🌱' },
      { label: 'Better routines',           icon: '📅' },
      { label: 'More confidence',           icon: '🌟' },
      { label: 'More family connection',    icon: '🤝' },
      { label: 'Happier days',              icon: '😊' },
    ],
  },
] as const;

type QuestionKey = typeof QUESTIONS[number]['key'];

type Answers = {
  primary_goal: string;
  child_description: string;
  parent_involvement: string;
  motivation_preference: string;
  selected_habits: string[];
  screen_time_preference: string;
  routine_timing: string;
  success_definition: string;
};

const TOTAL_STEPS = QUESTIONS.length + 2; // questions + plan summary + account

// ── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs mb-2" style={{ color: '#94A3B8' }}>
        <span>{step < TOTAL_STEPS ? `Step ${step} of ${QUESTIONS.length}` : 'Almost there'}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: brandGradient }}
        />
      </div>
    </div>
  );
}

type OptionCardProps = {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
};

function OptionCard({ icon, label, selected, onClick, disabled }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled && !selected}
      className="flex items-center gap-3 w-full text-left px-4 py-4 rounded-2xl border-2 transition-all duration-150 font-medium text-sm"
      style={{
        borderColor: selected ? '#14B8A6' : '#E2E8F0',
        background: selected ? '#F0FDFA' : 'white',
        color: selected ? '#0F766E' : '#0F172A',
        opacity: disabled && !selected ? 0.45 : 1,
        boxShadow: selected ? '0 0 0 1px #14B8A6' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <span className="text-2xl w-8 text-center shrink-0">{icon}</span>
      <span className="leading-snug">{label}</span>
      {selected && (
        <span className="ml-auto shrink-0" style={{ color: '#14B8A6' }}>✓</span>
      )}
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1–8 = questions, 9 = plan, 10 = account
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error' | 'already-confirmed' | 'rate-limited'>('idle');
  const [resendErrorMsg, setResendErrorMsg] = useState('');

  const qIndex = step - 1; // 0-indexed into QUESTIONS
  const q = step <= QUESTIONS.length ? QUESTIONS[qIndex] : null;

  function getSelected(key: QuestionKey): string | string[] {
    if (key === 'selected_habits') return (answers.selected_habits ?? []);
    return (answers as Record<string, string>)[key] ?? '';
  }

  function handleSelect(key: QuestionKey, label: string) {
    if (key === 'selected_habits') {
      const current = answers.selected_habits ?? [];
      const q5 = QUESTIONS.find(q => q.key === 'selected_habits')!;
      const max = (q5 as { maxSelect?: number }).maxSelect ?? 3;
      if (current.includes(label)) {
        setAnswers(a => ({ ...a, selected_habits: current.filter(h => h !== label) }));
      } else if (current.length < max) {
        setAnswers(a => ({ ...a, selected_habits: [...current, label] }));
      }
    } else {
      setAnswers(a => ({ ...a, [key]: label }));
    }
  }

  function canAdvance(): boolean {
    if (!q) return true;
    const key = q.key as QuestionKey;
    if (key === 'selected_habits') return (answers.selected_habits?.length ?? 0) > 0;
    return !!((answers as Record<string, string>)[key]);
  }

  function saveToStorage() {
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify(answers);
      sessionStorage.setItem('bt_onboarding', payload);
      // localStorage survives tab close — used to recover answers after email confirmation
      localStorage.setItem('bt_onboarding_backup', payload);
    }
  }

  function friendlyError(err: unknown): string {
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again in a few minutes.';
    }
    if (err instanceof Error) return err.message;
    return 'Something went wrong. Please try again.';
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    saveToStorage();

    // Check env config before making any network call
    const config = getSupabaseConfigStatus();
    if (!config.ok) {
      setAuthError('There may be a configuration issue with this app. Please try again later or contact support.');
      setAuthLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      // Session present = email confirmation disabled → go straight to dashboard
      if (data.session) {
        if (data.user) await saveOnboardingRow(data.user.id);
        // Fire welcome email — non-blocking
        fetch('/api/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {});
        router.push('/dashboard');
        return;
      }

      // No session = email confirmation required — still send welcome email
      fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      setAuthLoading(false);
      setConfirmSent(true);
    } catch (err) {
      console.error('[Onboarding] signUp threw:', err);
      setAuthError(friendlyError(err));
      setAuthLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendStatus('idle');
    setResendErrorMsg('');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already confirmed') || msg.includes('already registered') || msg.includes('email confirmed')) {
          setResendStatus('already-confirmed');
        } else if (msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
          setResendStatus('rate-limited');
        } else {
          setResendStatus('error');
          setResendErrorMsg(error.message);
        }
      } else {
        setResendStatus('sent');
      }
    } catch (err) {
      setResendStatus('error');
      setResendErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
    setResendLoading(false);
  }

  async function handleGoogle() {
    const config = getSupabaseConfigStatus();
    if (!config.ok) {
      setAuthError('There may be a configuration issue. Please try signing up with email instead.');
      return;
    }
    saveToStorage();
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard?onboarding=1` },
      });
      if (error) {
        setAuthError(error.message.includes('not enabled')
          ? 'Google sign-in is not yet enabled. Please use email and password below.'
          : friendlyError(error));
      }
    } catch (err) {
      console.error('[Onboarding] Google OAuth threw:', err);
      setAuthError(friendlyError(err));
    }
  }

  async function saveOnboardingRow(parentId: string) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('family_plans').upsert({
        parent_id: parentId,
        onboarding_completed: true,
        personalization_data: { ...answers, completed_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'parent_id' });
      if (error) console.error('[Onboarding] saveOnboardingRow error:', error.message);
      else {
        if (typeof window !== 'undefined') localStorage.removeItem('bt_onboarding_backup');
      }
    } catch (err) {
      // Non-fatal — don't block the signup flow
      console.error('[Onboarding] saveOnboardingRow threw:', err);
    }
  }

  // ── Plan summary screen ─────────────────────────────────────────────────

  if (step === QUESTIONS.length + 1) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-12">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
          style={{ background: brandGradient }}
        >
          <Sparkles size={30} color="white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#0F172A' }}>
          Your BrytThrive Family Plan Is Ready
        </h1>
        <p className="text-sm mb-8 max-w-sm" style={{ color: '#64748B' }}>
          Based on your answers, here&apos;s what BrytThrive will help your family do:
        </p>

        <div className="w-full max-w-sm mb-8 space-y-3 text-left">
          {[
            { icon: '🌱', text: 'Build healthy habits' },
            { icon: '🏆', text: 'Earn rewards' },
            { icon: '⭐', text: 'Stay motivated' },
            { icon: '🦋', text: 'Develop independence' },
            { icon: '📅', text: 'Create positive routines' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#F0FDFA', border: '1px solid #CCFBF1' }}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium" style={{ color: '#0F766E' }}>{text}</span>
              <CheckCircle size={16} className="ml-auto shrink-0" style={{ color: '#14B8A6' }} />
            </div>
          ))}
        </div>

        {answers.primary_goal && (
          <div
            className="w-full max-w-sm px-4 py-3 rounded-xl mb-8 text-sm"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}
          >
            Your focus: <strong>{answers.primary_goal}</strong>
          </div>
        )}

        <p className="text-xs mb-8 font-medium" style={{ color: '#94A3B8' }}>
          Parents stay in control. Kids stay motivated.
        </p>

        <button
          onClick={() => setStep(QUESTIONS.length + 2)}
          className="w-full max-w-sm text-white py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90 shadow-md"
          style={{ background: brandGradient }}
        >
          Create My Free Account →
        </button>
      </div>
    );
  }

  // ── Email confirmation waiting screen ───────────────────────────────────

  if (confirmSent) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center py-12">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
          style={{ background: brandGradient }}
        >
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#0F172A' }}>
          Check your email
        </h1>
        <p className="text-sm mb-2 max-w-sm" style={{ color: '#64748B' }}>
          We sent a confirmation link to <strong>{email}</strong>.
        </p>
        <p className="text-sm mb-1 max-w-sm" style={{ color: '#64748B' }}>
          Click the link to activate your account — works on any device, mobile or desktop.
        </p>

        {/* Tips block */}
        <div
          className="w-full max-w-sm rounded-2xl px-5 py-4 mb-6 text-left space-y-2"
          style={{ background: '#F0FDFA', border: '1px solid #CCFBF1' }}
        >
          {[
            '📬 Check your inbox and spam / junk folder',
            '⏱ Links can take 1–2 minutes to arrive',
            '📱 Works on any device — phone, tablet, or computer',
            '🔐 If this email was already confirmed, go to login below',
          ].map(tip => (
            <p key={tip} className="text-xs font-medium" style={{ color: '#0F766E' }}>{tip}</p>
          ))}
        </div>

        <div className="w-full max-w-xs space-y-3">
          <a
            href="/login"
            className="block w-full text-white py-4 rounded-full font-semibold text-sm text-center transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: brandGradient }}
          >
            Go to Login
          </a>

          {/* Resend button — re-enabled after success so user can try again */}
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full py-4 rounded-full border-2 text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#E2E8F0', color: '#64748B' }}
          >
            {resendLoading
              ? 'Sending…'
              : resendStatus === 'sent'
                ? '✓ Sent — resend again?'
                : 'Resend confirmation email'}
          </button>

          {/* Status messages */}
          {resendStatus === 'sent' && (
            <p className="text-xs text-center" style={{ color: '#0F766E' }}>
              ✅ New link sent! Check your inbox and spam folder.
            </p>
          )}
          {resendStatus === 'already-confirmed' && (
            <p className="text-xs text-center" style={{ color: '#1D4ED8' }}>
              This email is already confirmed.{' '}
              <a href="/login" className="underline font-semibold">Log in instead →</a>
            </p>
          )}
          {resendStatus === 'rate-limited' && (
            <p className="text-xs text-center" style={{ color: '#B45309' }}>
              Too many attempts — please wait a few minutes before trying again.
            </p>
          )}
          {resendStatus === 'error' && (
            <p className="text-xs text-center" style={{ color: '#DC2626' }}>
              {resendErrorMsg
                ? `Couldn't resend: ${resendErrorMsg}`
                : "Couldn't resend. Please wait a moment and try again."}
            </p>
          )}
        </div>

        <p className="text-xs mt-6 max-w-xs" style={{ color: '#94A3B8' }}>
          Still not arriving? Try a different email address by{' '}
          <button
            onClick={() => setConfirmSent(false)}
            className="underline"
            style={{ color: '#94A3B8' }}
          >
            going back
          </button>.
        </p>
      </div>
    );
  }

  // ── Account creation screen ─────────────────────────────────────────────

  if (step === QUESTIONS.length + 2) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-1 text-center" style={{ color: '#0F172A' }}>
          Create your free account
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: '#64748B' }}>
          Your personalized plan is saved and ready.
        </p>

        <button
          onClick={handleGoogle}
          className="w-full border-2 py-3.5 rounded-full flex items-center justify-center gap-2 text-sm font-medium mb-5 hover:bg-gray-50 transition-colors"
          style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
          <span className="text-xs" style={{ color: '#94A3B8' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
        </div>

        <form onSubmit={handleSignUp} className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border-2 rounded-xl px-4 py-3.5 text-base focus:outline-none transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
          />
          <input
            type="password"
            placeholder="Create a password (6+ characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border-2 rounded-xl px-4 py-3.5 text-base focus:outline-none transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
          />
          {authError && (
            <p className="text-sm text-red-500 text-center">{authError}</p>
          )}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full text-white py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
            style={{ background: brandGradient }}
          >
            {authLoading ? 'Creating account…' : 'Create Free Account'}
          </button>
        </form>

        <p className="text-xs text-center mt-5" style={{ color: '#94A3B8' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#0F766E' }} className="underline font-medium">Log in</a>
        </p>

        <button
          onClick={() => setStep(QUESTIONS.length + 1)}
          className="w-full mt-3 text-xs text-center py-2"
          style={{ color: '#CBD5E1' }}
        >
          ← Back to your plan
        </button>
      </div>
    );
  }

  // ── Question screen ─────────────────────────────────────────────────────

  if (!q) return null;
  const key = q.key as QuestionKey;
  const selected = getSelected(key);
  const isMulti = q.multi;
  const maxSelect = (q as { maxSelect?: number }).maxSelect;

  return (
    <div className="max-w-lg mx-auto px-4 py-10" style={{ minHeight: '80vh' }}>
      <ProgressBar step={step} />

      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: '#14B8A6' }} />
          <span className="text-xs font-medium" style={{ color: '#0F766E' }}>
            {isMulti && maxSelect ? `Select up to ${maxSelect}` : 'Choose one'}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>
          {q.question}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#64748B' }}>
          {q.subtitle}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {q.options.map(opt => {
          const isSelected = isMulti
            ? (selected as string[]).includes(opt.label)
            : selected === opt.label;
          const atLimit = isMulti && maxSelect
            ? (selected as string[]).length >= maxSelect
            : false;

          return (
            <OptionCard
              key={opt.label}
              icon={opt.icon}
              label={opt.label}
              selected={isSelected}
              disabled={atLimit}
              onClick={() => handleSelect(key, opt.label)}
            />
          );
        })}
      </div>

      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3.5 rounded-full border-2 text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: '#E2E8F0', color: '#64748B' }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => { saveToStorage(); setStep(s => s + 1); }}
          disabled={!canAdvance()}
          className="flex-[2] text-white py-3.5 rounded-full font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 shadow-sm"
          style={{ background: brandGradient }}
        >
          {step === QUESTIONS.length ? 'See my plan →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
