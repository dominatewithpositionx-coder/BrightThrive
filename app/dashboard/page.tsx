'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Gift, ChevronRight, Star, Flame, Plus, Sparkles, Tablet } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from './components/OnboardingWizard';
import WeatherCard from './components/WeatherCard';
import DailyBriefing from './components/DailyBriefing';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';
import { streakBadge } from '@/lib/streaks';

const supabase = getSupabase();

type Child = { id: string; name: string; age: number | null; points: number; streak: number };
type Mission = { id: string; child_id: string; title: string; category?: string; is_completed: boolean; mission_date?: string; updated_at?: string; generated_by?: string };
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
  const router = useRouter();

  useEffect(() => { init(); }, []);

  async function saveOnboardingFromSession(parentId: string) {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('bt_onboarding');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      await supabase.from('family_plans').upsert({
        parent_id: parentId, onboarding_completed: true,
        personalization_data: { ...data, completed_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'parent_id' });
      sessionStorage.removeItem('bt_onboarding');
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

    const [
      childRes, walletRes, missionRes,
      streakRes, planRes,
    ] = await Promise.all([
      supabase.from('children').select('id, name, age').order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('missions').select('id, child_id, title, category, is_completed, mission_date, updated_at, generated_by'),
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

    // The `generated_by` column may not exist on older production DBs. If the
    // mission query failed, retry without it so missions still render.
    let missionData: Mission[] | null = missionRes.data;
    if (missionRes.error) {
      console.error('[dashboard] missions query error (retrying without generated_by):', missionRes.error.message);
      const retry = await supabase
        .from('missions')
        .select('id, child_id, title, category, is_completed, mission_date, updated_at');
      if (retry.error) console.error('[dashboard] missions retry error:', retry.error.message);
      missionData = retry.data;
    }

    const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
    const streakMap = Object.fromEntries((streakData || []).map(s => [s.child_id, s.current_streak]));
    const kids = (childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0, streak: streakMap[c.id] ?? 0 }));
    setChildren(kids);
    setMissions(missionData || []);

    const loc = (planData?.personalization_data as Record<string, unknown> | null)?.location as string | undefined;
    if (loc) setFamilyLocation(loc);

    setLoading(false);

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

  async function generateMissionsForAll() {
    if (generatingAll || children.length === 0) return;
    setGeneratingAll(true);
    setGeneratedCount(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setGeneratingAll(false); return; }

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
        if (res.ok) success += 1;
      } catch { /* continue with remaining children */ }
    }
    setGeneratedCount(success);
    await init();
    setGeneratingAll(false);
  }

  const firstName = user?.email?.split('@')[0] ?? 'there';
  const today = todayStr();
  const todayMissions = missions.filter((m) => m.mission_date === today);
  const totalToday     = todayMissions.length;
  const totalTasksDone = todayMissions.filter((m) => m.is_completed).length;
  const totalPending   = todayMissions.filter((m) => !m.is_completed).length;
  const coinsEarnedToday = todayMissions.filter((m) => m.is_completed).length * 10;
  const hasTodayMissions = totalToday > 0;
  const childName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

  const recentCompleted = [...missions]
    .filter((m) => m.is_completed)
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
    .slice(0, 5);

  const weatherMissionsIncluded = todayMissions.some((m) => m.category === 'outdoor' || m.category === 'movement');
  const autoGenerated = todayMissions.some(m => m.generated_by === 'cron' || m.generated_by === 'claude');
  const weatherAware = todayMissions.some(m => m.category === 'outdoor');

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-56" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <div className="p-4 sm:p-6 max-w-4xl space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {children.length === 0
              ? "Let's get your family set up."
              : children.length === 1
                ? `Managing ${children[0].name}'s missions and rewards.`
                : `Managing ${children.length} children's missions and rewards.`}
          </p>
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
            className="block rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 hover:border-green-300 hover:bg-green-50 transition-colors"
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

        {/* 3. Today's mission summary */}
        {children.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today&apos;s Missions</h2>
              {!hasTodayMissions && (
                <button
                  onClick={generateMissionsForAll}
                  disabled={generatingAll}
                  className="min-h-[44px] px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
                >
                  {generatingAll ? '✨ Generating…' : '✨ Generate for today'}
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
              <SummaryStat label="Total" value={totalToday} accent="text-navy" bg="bg-gray-50" />
              <SummaryStat label="Completed" value={totalTasksDone} accent="text-green-600" bg={totalTasksDone > 0 ? 'bg-green-50' : 'bg-gray-50'} />
              <SummaryStat label="Remaining" value={totalPending} accent="text-amber-500" bg={totalPending > 0 ? 'bg-amber-50' : 'bg-gray-50'} />
              <SummaryStat label="Coins today" value={coinsEarnedToday} accent="text-purple-500" bg={coinsEarnedToday > 0 ? 'bg-purple-50' : 'bg-gray-50'} />
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
                const badge = streakBadge(child.streak);
                const previewMissions = childMissions.slice(0, 3);

                return (
                  <div key={child.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-full ${avatar.bg} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                        {child.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy truncate">{child.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={12} className="text-amber-500" fill="currentColor" />
                          <span className="text-xs font-semibold text-amber-600">{child.points} coins</span>
                        </div>
                      </div>
                      {child.streak > 0 && (
                        <div className="ml-auto flex items-center gap-1 bg-orange-50 rounded-full px-2 py-1">
                          <Flame size={12} className="text-orange-400" />
                          <span className="text-xs font-semibold text-orange-500">{child.streak}</span>
                        </div>
                      )}
                    </div>

                    {badge && (
                      <span className="inline-block mb-3 text-xs font-semibold bg-orange-50 text-orange-600 rounded-full px-2.5 py-1">
                        {badge}
                      </span>
                    )}

                    {childMissions.length > 0 ? (
                      <>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>Today&apos;s missions</span>
                            <span>{done}/{childMissions.length}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-2">
                          {previewMissions.map((m) => (
                            <li key={m.id} className="flex items-center gap-2 text-sm">
                              <span>{CAT_EMOJI[m.category ?? 'general'] ?? '⭐'}</span>
                              <span className={`truncate ${m.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{m.title}</span>
                            </li>
                          ))}
                        </ul>
                        <Link href="/child" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:text-green-700 font-medium">
                          See all →
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No missions today yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Quick actions */}
        {children.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateMissionsForAll}
                disabled={generatingAll}
                className="min-h-[44px] flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
              >
                <Sparkles size={16} />
                {generatingAll
                  ? 'Generating…'
                  : generatedCount !== null
                    ? `Missions created for ${generatedCount} ${generatedCount === 1 ? 'child' : 'children'}`
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

        {/* 6. Recent activity */}
        {children.length > 0 && (
          <section>
            <SectionHeader title="Recent Activity" href="/dashboard/history" linkLabel="View all" />
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
                    <span className="text-sm font-bold flex-shrink-0 ml-4 text-green-600">+10🪙</span>
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
      <Link href={href} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5">
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
