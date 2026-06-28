'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Gift, ChevronRight, Star, Flame, Plus, Sparkles, Tablet, BookHeart, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from './components/OnboardingWizard';
import WeatherCard from './components/WeatherCard';
import DailyBriefing from './components/DailyBriefing';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';
import { streakBadge } from '@/lib/streaks';
import { getDayTheme } from '@/lib/themes';
import { getExplorerLevel } from '@/lib/levels';

const supabase = getSupabase();

type Child = { id: string; name: string; age: number | null; points: number; streak: number };
type Mission = { id: string; child_id: string; title: string; category?: string; screen_time_reward?: number; is_completed: boolean; mission_date?: string; updated_at?: string; generated_by?: string };
const CAT_EMOJI: Record<string, string> = {
  movement: '🏃',
  responsibility: '🧹',
  emotional_intelligence: '💛',
  learning: '📚',
  creativity: '🎨',
  family_connection: '👨‍👩‍👧',
  outdoor: '🌤️',
  healthy_habits: '🥦',
  general: '⭐',
};

const AVATAR_COLORS = [
  { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700' },
  { bg: 'bg-blue-500',  light: 'bg-blue-50',  text: 'text-blue-700' },
  { bg: 'bg-purple-500',light: 'bg-purple-50',text: 'text-purple-700' },
  { bg: 'bg-orange-500',light: 'bg-orange-50',text: 'text-orange-700' },
  { bg: 'bg-pink-500',  light: 'bg-pink-50',  text: 'text-pink-700' },
  { bg: 'bg-teal-500',  light: 'bg-teal-50',  text: 'text-teal-700' },
];
function getAvatar(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardPage() {
  const [user, setUser]               = useState<{ id: string; email?: string } | null>(null);
  const [children, setChildren]       = useState<Child[]>([]);
  const [missions, setMissions]       = useState<Mission[]>([]);
  const [familyLocation, setFamilyLocation] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // Separate flag for auto-gen vs manual: auto-gen failures are silent (no red text).
  const [isAutoGen, setIsAutoGen] = useState(false);
  const [winText, setWinText]             = useState('');
  const [winSaved, setWinSaved]           = useState(false);
  const [winSaving, setWinSaving]         = useState(false);
  const [todayWin, setTodayWin]           = useState<string | null>(null);
  const router = useRouter();
  const autoGenDoneRef = useRef(false);

  useEffect(() => { init(); }, []);

  // Auto-generate missions on first load when none exist for today
  useEffect(() => {
    if (loading) return;
    if (children.length === 0) return;
    if (generatingAll) return;
    if (autoGenDoneRef.current) return;
    const todayMissionsCount = missions.filter(m => m.mission_date === todayStr()).length;
    if (todayMissionsCount > 0) return;
    autoGenDoneRef.current = true;
    setIsAutoGen(true);
    generateMissionsForAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, children.length, missions.length]);

  async function saveOnboardingFromSession(parentId: string) {
    if (typeof window === 'undefined') return;
    // Check sessionStorage first, then fall back to localStorage backup (survives tab close)
    const raw = sessionStorage.getItem('bt_onboarding') ?? localStorage.getItem('bt_onboarding_backup');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      // Only write onboarding answers if they contain meaningful content
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) return;
      // Merge with any existing personalization_data so settings aren't lost
      const { data: existing } = await supabase
        .from('family_plans')
        .select('personalization_data')
        .eq('parent_id', parentId)
        .maybeSingle();
      const existingPd = (existing?.personalization_data as Record<string, unknown>) ?? {};
      await supabase.from('family_plans').upsert({
        parent_id: parentId,
        onboarding_completed: true,
        personalization_data: { ...existingPd, ...data, completed_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'parent_id' });
      sessionStorage.removeItem('bt_onboarding');
      localStorage.removeItem('bt_onboarding_backup');
    } catch (_) {}
  }

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);

    await saveOnboardingFromSession(user.id);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('onboarding') === '1') router.replace('/dashboard');
    }

    // Fetch children first — we need their IDs to scope the missions query.
    const [childRes, walletRes, streakRes, planRes] = await Promise.all([
      supabase.from('children').select('id, name, age').eq('parent_id', user.id).order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('streaks').select('child_id, current_streak'),
      supabase.from('family_plans').select('personalization_data').eq('parent_id', user.id).maybeSingle(),
    ]);

    if (childRes.error) console.error('[dashboard] children query error:', childRes.error.message);
    if (walletRes.error) console.error('[dashboard] wallet query error:', walletRes.error.message);
    if (streakRes.error) console.error('[dashboard] streaks query error:', streakRes.error.message);
    if (planRes.error) console.error('[dashboard] family_plans query error:', planRes.error.message);

    const { data: childData } = childRes;
    const { data: walletData } = walletRes;
    const { data: streakData } = streakRes;
    const { data: planData } = planRes;

    // Scope missions to this parent's children, last 7 days only.
    // The `generated_by` column may not exist on older production DBs — retry without it.
    const childIds = (childData ?? []).map(c => c.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    let missionData: Mission[] | null = null;

    if (childIds.length > 0) {
      const missionRes = await supabase
        .from('missions')
        .select('id, child_id, title, category, screen_time_reward, is_completed, mission_date, updated_at, generated_by')
        .in('child_id', childIds)
        .gte('mission_date', sevenDaysAgo);

      if (missionRes.error) {
        console.error('[dashboard] missions query error (retrying without generated_by):', missionRes.error.message);
        const retry = await supabase
          .from('missions')
          .select('id, child_id, title, category, screen_time_reward, is_completed, mission_date, updated_at')
          .in('child_id', childIds);
        if (retry.error) console.error('[dashboard] missions retry error:', retry.error.message);
        missionData = retry.data;
      } else {
        missionData = missionRes.data;
      }
    }

    const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
    const streakMap = Object.fromEntries((streakData || []).map(s => [s.child_id, s.current_streak]));
    const kids = (childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0, streak: streakMap[c.id] ?? 0 }));
    setChildren(kids);
    setMissions(missionData || []);

    const loc = (planData?.personalization_data as Record<string, unknown> | null)?.location as string | undefined;
    if (loc) setFamilyLocation(loc);

    setLoading(false);

    // Load today's win for the Win Journal
    if (user) {
      const { data: { session: winSession } } = await supabase.auth.getSession();
      if (winSession?.access_token) {
        fetch('/api/win-journal?limit=1', {
          headers: { Authorization: `Bearer ${winSession.access_token}` },
        })
          .then((r) => r.json())
          .then(({ wins }) => {
            const todayDate = new Date().toISOString().split('T')[0];
            const todayEntry = (wins ?? []).find((w: { win_date: string; win_text: string }) => w.win_date === todayDate);
            if (todayEntry) { setTodayWin(todayEntry.win_text); setWinSaved(true); }
          })
          .catch(() => {});
      }
    }

    if (kids.length === 0) {
      const seenOnboarding = localStorage.getItem('bt_onboarding_done');
      if (!seenOnboarding) setShowOnboarding(true);
    }
  }

  function handleOnboardingComplete() {
    localStorage.setItem('bt_onboarding_done', '1');
    setShowOnboarding(false);
    init();
  }

  async function saveWin() {
    const text = winText.trim();
    if (!text || winSaving) return;
    setWinSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setWinSaving(false); return; }
    try {
      const res = await fetch('/api/win-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ win_text: text }),
      });
      if (res.ok) { setTodayWin(text); setWinSaved(true); }
    } catch { /* non-critical */ }
    setWinSaving(false);
  }

  async function generateMissionsForAll() {
    if (generatingAll || children.length === 0) return;
    setGeneratingAll(true);
    setGeneratedCount(null);
    setGenerateError(null);
    // If triggered manually (not auto-gen), clear the auto-gen flag so errors show.
    if (!isAutoGen) setIsAutoGen(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('[dashboard] generateMissionsForAll: no session — aborting');
      setGenerateError('Session expired. Please refresh the page and try again.');
      setGeneratingAll(false);
      return;
    }

    let weatherSummary: string | undefined;
    if (familyLocation) {
      try {
        const wxRes = await fetch(`/api/weather?location=${encodeURIComponent(familyLocation)}`);
        const wxData = await wxRes.json();
        if (!wxData.error) {
          weatherSummary = `${wxData.condition}, ${wxData.tempC}°C, ${wxData.isOutdoorFriendly ? 'outdoor friendly' : 'indoor recommended'}`;
        }
      } catch { /* weather is optional */ }
    }

    let success = 0;
    // Sequential so the per-parent rate limit is respected and successes can be counted.
    for (const child of children) {
      try {
        const res = await fetch('/api/generate-missions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ childId: child.id, parentId: user?.id, childAge: child.age, weatherSummary }),
        });
        if (res.ok) {
          success += 1;
        } else {
          const body = await res.json().catch(() => ({}));
          console.error(`[dashboard] generateMissionsForAll: API returned ${res.status} for child ${child.name}:`, body);
        }
      } catch (err) {
        console.error('[dashboard] generateMissionsForAll: network error for child', child.name, err);
      }
    }
    setGeneratedCount(success);
    // Only show a red error on manual generate clicks, not on silent auto-generation.
    if (success === 0 && !isAutoGen) {
      setGenerateError("Couldn't create missions right now. Please try again in a moment — your family's profile is saved.");
    }
    setIsAutoGen(false);
    await init();
    setGeneratingAll(false);
  }

  const firstName = user?.email?.split('@')[0] ?? 'there';
  const today = todayStr();
  const todayMissions = missions.filter((m) => m.mission_date === today);

  function getStoryline() {
    if (children.length === 0) return "Let's get your family set up.";
    const name = children.length === 1 ? children[0].name : 'your family';
    const h = new Date().getHours();
    if (totalToday === 0) return `Ready to set up missions for ${name} today?`;
    if (totalTasksDone === totalToday && totalToday > 0)
      return `${name} crushed every mission today — what an explorer! 🎉`;
    if (totalTasksDone > 0 && totalPending > 0)
      return `${name} is on a roll — ${totalTasksDone} down, ${totalPending} to go!`;
    if (h < 10) return `Let's make today a great one for ${name}!`;
    if (h < 14) return `${name}'s missions are ready and waiting!`;
    return `Still time for ${name} to earn some BrytCoins today!`;
  }
  const totalToday     = todayMissions.length;
  const totalTasksDone = todayMissions.filter((m) => m.is_completed).length;
  const totalPending   = todayMissions.filter((m) => !m.is_completed).length;
  const coinsEarnedToday = todayMissions.filter((m) => m.is_completed).length * 10;
  const screenTimeEarnedToday = todayMissions.filter(m => m.is_completed).reduce((s, m) => s + (m.screen_time_reward ?? 5), 0);
  const hasTodayMissions = totalToday > 0;
  const childName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

  const dayTheme = getDayTheme();

  const recentCompleted = [...missions]
    .filter((m) => m.is_completed)
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
    .slice(0, 5);

  // Weekly stats (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
  const weeklyMissions = missions.filter(m => (m.mission_date ?? '') >= sevenDaysAgo);
  const weeklyDone = weeklyMissions.filter(m => m.is_completed).length;
  const weeklyCoins = weeklyDone * 10;
  const weeklyDays = new Set(weeklyMissions.filter(m => m.is_completed).map(m => m.mission_date)).size;

  const weatherMissionsIncluded = todayMissions.some((m) => m.category === 'outdoor' || m.category === 'movement');
  const autoGenerated = todayMissions.some(m => m.generated_by === 'cron' || m.generated_by === 'claude');
  const weatherAware = todayMissions.some(m => m.category === 'outdoor');

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl space-y-6">
        <div className="space-y-2">
          <div className="h-8 skeleton rounded-xl w-48" />
          <div className="h-4 skeleton rounded-lg w-72" />
        </div>
        <div className="h-16 skeleton rounded-2xl" />
        <div className="h-36 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-48 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <div className="p-4 sm:p-6 max-w-4xl space-y-8">

        {/* Greeting + Day Theme */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">{getStoryline()}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* Day theme banner */}
          <div className={`bg-gradient-to-r ${dayTheme.gradient} rounded-2xl px-5 py-3.5 flex items-center gap-3`}>
            <span className="text-2xl">{dayTheme.emoji}</span>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{dayTheme.name}</p>
              <p className="text-white/80 text-xs">{dayTheme.tagline}</p>
            </div>
          </div>
        </div>

        {/* 1. Daily briefing */}
        {children.length > 0 && (
          <DailyBriefing
            children={children.map((c) => ({ name: c.name, age: c.age ?? 8 }))}
            completedToday={totalTasksDone}
            totalToday={totalToday}
          />
        )}

        {/* 2. Weather card */}
        {familyLocation ? (
          <WeatherCard location={familyLocation} weatherMissions={hasTodayMissions && weatherMissionsIncluded} />
        ) : children.length > 0 ? (
          <Link
            href="/dashboard/settings"
            className="block rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 hover:border-teal-300 hover:bg-teal-50 transition-colors"
          >
            📍 Add your city in Settings to see today&apos;s weather and weather-aware missions.
          </Link>
        ) : null}

        {/* ── No children state ── */}
        {children.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <EmptyState {...EMPTY_STATES.noChildren} />
          </div>
        )}

        {/* Preview Kid Mode card */}
        {children.length > 0 && (
          <section className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base mb-0.5">Preview Your Child&apos;s BrytThrive Experience</h2>
              <p className="text-white/80 text-sm">See how your child checks in, completes missions, and earns iPad screen time.</p>
            </div>
            <Link
              href="/child?demo=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-white text-teal-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-teal-50 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Preview Kid Mode →
            </Link>
          </section>
        )}

        {/* 3. Today's mission summary */}
        {children.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today&apos;s Missions</h2>
              {!hasTodayMissions && (
                <button
                  onClick={generateMissionsForAll}
                  disabled={generatingAll}
                  className="min-h-[44px] px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-60"
                >
                  {generatingAll ? '✨ Generating…' : generatedCount !== null && generatedCount > 0 ? '✓ Missions created' : '✨ Generate for today'}
                </button>
              )}
            </div>
            {autoGenerated && (
              <p className="text-xs font-medium text-emerald-600 mb-1">✨ BrytThrive created today&apos;s missions</p>
            )}
            {weatherAware && (
              <p className="text-xs font-medium text-sky-600 mb-3">🌤 Weather-aware missions included</p>
            )}
            {!autoGenerated && !weatherAware && <div className="mb-3" />}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryStat label="Missions" value={totalToday} accent="text-navy" bg="bg-gray-50" />
              <SummaryStat label="Completed" value={totalTasksDone} accent="text-teal-600" bg={totalTasksDone > 0 ? 'bg-teal-50' : 'bg-gray-50'} />
              <SummaryStat label="Coins earned" value={coinsEarnedToday} accent="text-amber-500" bg={coinsEarnedToday > 0 ? 'bg-amber-50' : 'bg-gray-50'} />
              <SummaryStat label="Screen mins earned" value={screenTimeEarnedToday} accent="text-blue-500" bg={screenTimeEarnedToday > 0 ? 'bg-blue-50' : 'bg-gray-50'} />
            </div>
          </section>
        )}

        {/* 4. Per-child mission cards */}
        {children.length > 0 && (
          <section>
            <SectionHeader title="Your Children" href="/dashboard/children" linkLabel="Manage" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const avatar = getAvatar(child.name);
                const childMissions = missions.filter((m) => m.child_id === child.id && m.mission_date === today);
                const done = childMissions.filter((m) => m.is_completed).length;
                const completionPct = childMissions.length > 0
                  ? Math.round((done / childMissions.length) * 100) : 0;
                const childScreenTime = childMissions.filter(m => m.is_completed).reduce((s, m) => s + (m.screen_time_reward ?? 5), 0);
                const badge = streakBadge(child.streak);
                const previewMissions = childMissions.slice(0, 3);
                const explorerLevel = getExplorerLevel(child.points);

                return (
                  <div key={child.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow card-lift">
                    {/* Accent strip */}
                    <div className={`h-1.5 w-full ${avatar.bg}`} />
                    <div className="p-5">
                    {/* Child header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${avatar.bg} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}>
                        {child.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-navy truncate">{child.name}</p>
                        <span className="text-xs font-medium text-gray-500">
                          {explorerLevel.emoji} {explorerLevel.name}
                        </span>
                      </div>
                      {child.streak > 0 && (
                        <div className="flex items-center gap-1 bg-orange-50 rounded-full px-2.5 py-1 flex-shrink-0">
                          <span className="text-xs font-bold text-orange-500">{child.streak}🔥</span>
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-amber-50 rounded-xl px-2 py-2 text-center">
                        <p className="text-base font-bold text-amber-600">{child.points}</p>
                        <p className="text-xs text-amber-500 font-medium">Coins</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl px-2 py-2 text-center">
                        <p className="text-base font-bold text-teal-600">{done}/{childMissions.length || 0}</p>
                        <p className="text-xs text-teal-500 font-medium">Done</p>
                      </div>
                      <div className={`rounded-xl px-2 py-2 text-center ${childScreenTime > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <p className={`text-base font-bold ${childScreenTime > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{childScreenTime}</p>
                        <p className={`text-xs font-medium ${childScreenTime > 0 ? 'text-blue-500' : 'text-gray-400'}`}>📱 mins</p>
                      </div>
                    </div>
                    {childScreenTime > 0 && done === childMissions.length && childMissions.length > 0 && (
                      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 font-semibold text-center">
                        🎉 {childScreenTime} mins screen time ready — approve it!
                      </div>
                    )}

                    {badge && (
                      <span className="inline-block mb-3 text-xs font-semibold bg-orange-50 text-orange-600 rounded-full px-2.5 py-1">
                        {badge}
                      </span>
                    )}

                    {childMissions.length > 0 ? (
                      <>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>Today&apos;s progress</span>
                            <span className="font-medium">{completionPct}%</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-3">
                          {previewMissions.map((m) => (
                            <li key={m.id} className="flex items-center gap-2 text-sm">
                              <span className="text-sm">{CAT_EMOJI[m.category ?? 'general'] ?? '⭐'}</span>
                              <span className={`truncate ${m.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{m.title}</span>
                              {m.is_completed && <span className="ml-auto text-teal-400 text-xs flex-shrink-0">✓</span>}
                            </li>
                          ))}
                          {childMissions.length > 3 && (
                            <li className="text-xs text-gray-400 pl-6">+{childMissions.length - 3} more missions</li>
                          )}
                        </ul>
                        <Link href="/child" target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                          Open Kid View <ChevronRight size={12} />
                        </Link>
                      </>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-2xl mb-1">🗺️</p>
                        <p className="text-xs text-gray-400 font-medium">No missions yet today.</p>
                        <p className="text-xs text-gray-400">Generate missions to get started!</p>
                      </div>
                    )}
                  </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Weekly snapshot */}
        {children.length > 0 && weeklyDone > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">This Week</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-teal-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{weeklyDone}</p>
                <p className="text-xs text-teal-600 font-medium mt-0.5">Missions done</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{weeklyCoins}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">Coins earned 🪙</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{weeklyDays}</p>
                <p className="text-xs text-purple-600 font-medium mt-0.5">Active days 📅</p>
              </div>
            </div>
          </section>
        )}

        {/* 5. Quick actions */}
        {children.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
            {generateError && (
              <p className="text-xs text-red-600 mb-2 font-medium">{generateError}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateMissionsForAll}
                disabled={generatingAll}
                className="min-h-[44px] flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-60"
              >
                <Sparkles size={16} />
                {generatingAll
                  ? 'Generating…'
                  : generatedCount !== null && generatedCount > 0
                    ? `✓ Missions created for ${generatedCount} ${generatedCount === 1 ? 'child' : 'children'}`
                    : "Generate Today's Missions"}
              </button>
              <Link
                href="/dashboard/children"
                className="min-h-[44px] flex items-center gap-2 bg-white border border-gray-200 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Plus size={16} /> Add Child
              </Link>
              <Link
                href="/dashboard/rewards"
                className="min-h-[44px] flex items-center gap-2 bg-white border border-gray-200 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Gift size={16} /> Add Reward
              </Link>
              <Link
                href="/child"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex items-center gap-2 bg-white border border-gray-200 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Tablet size={16} /> Open Kid View
              </Link>
            </div>
          </section>
        )}

        {/* 6. Win Journal */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookHeart size={16} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today&apos;s Family Win</h2>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            {winSaved && todayWin ? (
              <div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">&ldquo;{todayWin}&rdquo;</p>
                <button
                  onClick={() => { setWinSaved(false); setWinText(todayWin); }}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-3">What&apos;s one thing your family did well today? (up to 280 characters)</p>
                <textarea
                  value={winText}
                  onChange={(e) => setWinText(e.target.value.slice(0, 280))}
                  placeholder="e.g. Mia finished all 5 missions without being reminded!"
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{winText.length}/280</span>
                  <button
                    onClick={saveWin}
                    disabled={!winText.trim() || winSaving}
                    className="min-h-[36px] px-5 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {winSaving ? 'Saving…' : 'Save win'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 7. Recent activity */}
        {children.length > 0 && (
          <section>
            <SectionHeader title="Recent Activity" href="/dashboard/history" linkLabel="View coin history" />
            {recentCompleted.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <EmptyState {...EMPTY_STATES.noHistory} />
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50">
                {recentCompleted.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="min-w-0 flex items-center gap-2">
                      <span>{CAT_EMOJI[m.category ?? 'general'] ?? '⭐'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">{m.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{childName(m.child_id)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0 ml-4 text-teal-600">+10🪙</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      <Link href={href} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">
        {linkLabel} <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function SummaryStat({ label, value, accent, bg }: { label: string; value: number; accent: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl py-4 text-center`}>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
    </div>
  );
}
