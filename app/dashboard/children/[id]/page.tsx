'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { getSuperpower, SUPERPOWER_TAGS, type SuperpowerTag } from '@/lib/superpowers';
import { getExplorerLevel } from '@/lib/levels';

// ── Types ─────────────────────────────────────────────────────────────────────

type Child = {
  id: string;
  name: string;
  age: number | null;
  location_label?: string | null;
  location_name?: string | null;
  location_city?: string | null;
  location_region?: string | null;
  location_country?: string | null;
  screen_time_limit?: number | null;
  created_at?: string | null;
};

type Wallet = {
  balance: number;
  lifetime_earned: number;
};

type StreakData = {
  current_streak: number;
  longest_streak: number;
  last_active_date?: string | null;
};

type Mission = {
  id: string;
  title: string;
  category?: string | null;
  identity_tag?: SuperpowerTag | null;
  reflection_emoji?: string | null;
  parent_message?: string | null;
  parent_message_at?: string | null;
  mission_date?: string | null;
  created_at?: string | null;
};

type RewardRedemption = {
  id: string;
  reward_title?: string | null;
  reward_name?: string | null;
  fulfilled_at?: string | null;
  requested_at?: string | null;
  created_at?: string | null;
};

type PersonalizationData = {
  primary_goal?: string;
  child_description?: string;
  parent_involvement?: string;
  motivation_preference?: string;
  selected_habits?: string[];
  screen_time_preference?: string;
  routine_timing?: string;
  success_definition?: string;
  [key: string]: unknown;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Labels for onboarding answers shown in "What You Shared"
const ONBOARDING_LABELS: Record<string, string> = {
  primary_goal: 'Your primary goal',
  child_description: 'How you described your child',
  parent_involvement: 'How involved you want to be',
  motivation_preference: 'What motivates your child',
  screen_time_preference: 'Daily earned screen time',
  routine_timing: 'When routines matter most',
  success_definition: 'What success looks like',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChildGrowthProfilePage() {
  const router = useRouter();
  const params = useParams();
  const childId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [child, setChild] = useState<Child | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [firstReward, setFirstReward] = useState<RewardRedemption | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);

  useEffect(() => {
    if (!childId) { router.replace('/dashboard'); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) { router.replace('/login'); return; }

    const [
      childResult,
      walletResult,
      streakResult,
      missionsResult,
      firstRewardResult,
      planResult,
    ] = await Promise.all([
      supabase
        .from('children')
        .select('id, name, age, location_label, location_name, location_city, location_region, location_country, screen_time_limit, created_at')
        .eq('id', childId)
        .eq('parent_id', user.id)
        .single(),

      supabase
        .from('bt_coin_wallet')
        .select('balance, lifetime_earned')
        .eq('child_id', childId)
        .maybeSingle(),

      supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_active_date')
        .eq('child_id', childId)
        .maybeSingle(),

      supabase
        .from('missions')
        .select('id, title, category, identity_tag, reflection_emoji, parent_message, parent_message_at, mission_date, created_at')
        .eq('child_id', childId)
        .eq('is_completed', true)
        .order('mission_date', { ascending: true }),

      supabase
        .from('reward_redemptions')
        .select('id, reward_title, reward_name, fulfilled_at, requested_at, created_at')
        .eq('child_id', childId)
        .eq('status', 'approved')
        .order('fulfilled_at', { ascending: true })
        .limit(1),

      supabase
        .from('family_plans')
        .select('personalization_data')
        .eq('parent_id', user.id)
        .maybeSingle(),
    ]);

    if (childResult.error || !childResult.data) {
      setError('Profile not found.');
      setLoading(false);
      return;
    }

    setChild(childResult.data as Child);
    setWallet(walletResult.data as Wallet | null);
    setStreak(streakResult.data as StreakData | null);
    setMissions((missionsResult.data ?? []) as Mission[]);
    setFirstReward((firstRewardResult.data?.[0] ?? null) as RewardRedemption | null);
    setPersonalization((planResult.data?.personalization_data ?? null) as PersonalizationData | null);
    setLoading(false);
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const balance = wallet?.balance ?? 0;
  const lifetimeEarned = wallet?.lifetime_earned ?? 0;
  const explorerLevel = getExplorerLevel(balance);

  // Superpower counts from completed missions
  const superpowerCounts = missions.reduce<Record<string, number>>((acc, m) => {
    if (m.identity_tag) acc[m.identity_tag] = (acc[m.identity_tag] ?? 0) + 1;
    return acc;
  }, {});

  const topSuperpower: SuperpowerTag | null = SUPERPOWER_TAGS.reduce<SuperpowerTag | null>((best, tag) => {
    return (superpowerCounts[tag] ?? 0) > (best ? (superpowerCounts[best] ?? 0) : -1) ? tag : best;
  }, null);

  const firstMission = missions[0] ?? null;
  const firstRecognition = missions.find(m => m.parent_message && m.parent_message_at) ?? null;

  const locationDisplay = [child?.location_name, child?.location_city, child?.location_region]
    .filter(Boolean).join(', ') || null;

  // Onboarding fields to surface (skip num_children and completed_at)
  const HIDDEN_KEYS = new Set(['num_children', 'completed_at']);
  const onboardingEntries = personalization
    ? Object.entries(personalization)
        .filter(([k, v]) => !HIDDEN_KEYS.has(k) && ONBOARDING_LABELS[k] && v != null && v !== '')
        .map(([k, v]) => ({ key: k, label: ONBOARDING_LABELS[k], value: v }))
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-600 text-sm">{error ?? 'Profile not found.'}</p>
        <Link href="/dashboard" className="text-teal-600 text-sm font-semibold hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Back nav */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors"
        >
          <ChevronLeft size={15} />
          Dashboard
        </Link>

        {/* ── Section 1: Header ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #10b981)' }}
            >
              {child.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{child.name}</h1>
              {child.age != null && (
                <p className="text-sm text-gray-500 mt-0.5">{child.age} years old</p>
              )}
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-teal-50 rounded-full px-3 py-1">
                <span className="text-base">{explorerLevel.emoji}</span>
                <span className="text-xs font-bold text-teal-700">{explorerLevel.name}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            Every day {child.name} is growing stronger. This profile reflects what BrytThrive knows so far — and it grows with them.
          </p>
        </div>

        {/* ── Section 2: What You Shared ────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">What You Shared</h2>
          <p className="text-xs text-gray-400 mb-4">Your answers from when you set up BrytThrive for your family.</p>

          {onboardingEntries.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl px-4 py-5 text-center">
              <p className="text-sm text-gray-400">
                Complete the family setup to see your personalization choices here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {onboardingEntries.map(({ key, label, value }) => (
                <div key={key} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm text-gray-700 font-semibold mt-0.5">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 3: Today's Personalization ───────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Today&apos;s Personalization</h2>
          <p className="text-xs text-gray-400 mb-4">How BrytThrive is tailoring the experience for {child.name} right now.</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Explorer level */}
            <div className="bg-teal-50 rounded-2xl p-4">
              <p className="text-xs text-teal-600 font-semibold mb-1">Explorer Level</p>
              <p className="text-lg font-black text-teal-800">{explorerLevel.emoji} {explorerLevel.name}</p>
              <p className="text-xs text-teal-600 mt-1">{balance} BrytCoins</p>
            </div>

            {/* Streak */}
            <div className="bg-orange-50 rounded-2xl p-4">
              <p className="text-xs text-orange-600 font-semibold mb-1">Current Streak</p>
              <p className="text-lg font-black text-orange-800">
                {streak?.current_streak ?? 0} {streak?.current_streak === 1 ? 'day' : 'days'}
              </p>
              {(streak?.longest_streak ?? 0) > 0 && (
                <p className="text-xs text-orange-500 mt-1">Best: {streak!.longest_streak} days</p>
              )}
            </div>

            {/* Top Superpower */}
            {topSuperpower ? (() => {
              const sp = getSuperpower(topSuperpower);
              if (!sp) return null;
              return (
                <div className="bg-purple-50 rounded-2xl p-4">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Emerging Superpower</p>
                  <p className="text-lg font-black text-purple-800">{sp.emoji} {sp.label}</p>
                  <p className="text-xs text-purple-500 mt-1">{superpowerCounts[topSuperpower]} mission{superpowerCounts[topSuperpower] !== 1 ? 's' : ''}</p>
                </div>
              );
            })() : (
              <div className="bg-purple-50 rounded-2xl p-4">
                <p className="text-xs text-purple-600 font-semibold mb-1">Superpower</p>
                <p className="text-xs text-purple-400 mt-1">Emerging with each mission completed</p>
              </div>
            )}

            {/* Location or Screen time */}
            {locationDisplay ? (
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-xs text-blue-600 font-semibold mb-1">Home Base</p>
                <p className="text-sm font-bold text-blue-800 leading-snug">{locationDisplay}</p>
              </div>
            ) : child.screen_time_limit ? (
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-xs text-blue-600 font-semibold mb-1">Screen Time Goal</p>
                <p className="text-lg font-black text-blue-800">{child.screen_time_limit} min</p>
                <p className="text-xs text-blue-500 mt-1">earned per day</p>
              </div>
            ) : null}
          </div>

          {/* Superpower breakdown */}
          {Object.keys(superpowerCounts).length > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Superpower Map</p>
              {SUPERPOWER_TAGS.filter(tag => superpowerCounts[tag]).map(tag => {
                const sp = getSuperpower(tag);
                if (!sp) return null;
                const count = superpowerCounts[tag] ?? 0;
                const total = missions.filter(m => m.identity_tag).length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">{sp.emoji}</span>
                    <span className="text-xs text-gray-600 w-32 truncate">{sp.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 4: What BrytThrive Is Learning ───────────────────── */}
        {/* AI_OBSERVATIONS_SLOT — future AI insights plug in here.
            Replace this placeholder section with <AIObservations childId={childId} />
            once the AI learning model is implemented. The section intentionally uses
            the same card layout so no redesign is needed. */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="opacity-80" />
            <h2 className="text-base font-bold">What BrytThrive Is Learning</h2>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            We&apos;re learning more about {child.name} every day.
          </p>
          <p className="text-xs mt-3 opacity-60 leading-relaxed">
            As {child.name} completes missions and earns recognition, BrytThrive builds a personalized picture of their growing strengths. Check back often.
          </p>
        </div>

        {/* ── Section 5: Growth Journey ────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Growth Journey</h2>
          <p className="text-xs text-gray-400 mb-5">The milestones that make up {child.name}&apos;s story so far.</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center">
              <p className="text-2xl font-black text-teal-600">{missions.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Missions<br />Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-600">{lifetimeEarned}</p>
              <p className="text-xs text-gray-400 mt-0.5">BrytCoins<br />Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-orange-500">{streak?.longest_streak ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Longest<br />Streak</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            <TimelineItem
              emoji="🚀"
              label="First Mission Completed"
              detail={firstMission ? `"${firstMission.title}"` : null}
              date={firstMission?.mission_date ?? firstMission?.created_at}
              placeholder={!firstMission}
              placeholderText="Waiting for the first completed mission"
            />
            <TimelineItem
              emoji="💬"
              label="First Parent Recognition"
              detail={firstRecognition ? `"${firstRecognition.parent_message}"` : null}
              date={firstRecognition?.parent_message_at}
              placeholder={!firstRecognition}
              placeholderText="Waiting for the first recognition message"
            />
            <TimelineItem
              emoji="🎁"
              label="First Reward Earned"
              detail={firstReward?.reward_title ?? firstReward?.reward_name ?? null}
              date={firstReward?.fulfilled_at ?? firstReward?.requested_at ?? firstReward?.created_at}
              placeholder={!firstReward}
              placeholderText="Waiting for the first approved reward"
            />
            {(streak?.current_streak ?? 0) > 0 && (
              <TimelineItem
                emoji="🔥"
                label={`${streak!.current_streak}-Day Streak`}
                detail="Active right now"
                date={streak?.last_active_date}
                placeholder={false}
              />
            )}
            {(explorerLevel.level ?? 1) > 1 && (
              <TimelineItem
                emoji={explorerLevel.emoji}
                label={`Reached ${explorerLevel.name}`}
                detail={`${balance} BrytCoins earned`}
                placeholder={false}
                isLast
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pb-4">
          {child.name}&apos;s Growth Profile · BrytThrive
        </p>

      </div>
    </div>
  );
}

// ── Timeline item ─────────────────────────────────────────────────────────────

function TimelineItem({
  emoji,
  label,
  detail,
  date,
  placeholder = false,
  placeholderText,
  isLast = false,
}: {
  emoji: string;
  label: string;
  detail?: string | null;
  date?: string | null;
  placeholder?: boolean;
  placeholderText?: string;
  isLast?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${!isLast ? 'pb-5' : ''}`}>
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
          ${placeholder ? 'bg-gray-100' : 'bg-teal-50'}`}>
          <span className={placeholder ? 'opacity-30' : ''}>{emoji}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
      </div>

      {/* Content */}
      <div className="pt-1 pb-1 min-w-0">
        <p className={`text-sm font-bold leading-snug ${placeholder ? 'text-gray-300' : 'text-gray-800'}`}>
          {label}
        </p>
        {placeholder && placeholderText ? (
          <p className="text-xs text-gray-300 mt-0.5">{placeholderText}</p>
        ) : (
          <>
            {detail && (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{detail}</p>
            )}
            {date && (
              <p className="text-xs text-gray-400 mt-1">{formatDateShort(date)}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
