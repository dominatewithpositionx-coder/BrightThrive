'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Gift, ChevronRight, Plus, Tablet, BookHeart, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from './components/OnboardingWizard';
import WeatherCard from './components/WeatherCard';
import WeatherWidget from '@/components/WeatherWidget';
import { type WeatherData } from '@/lib/weather';
import DailyBriefing from './components/DailyBriefing';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';
import { streakBadge } from '@/lib/streaks';
import { getExplorerLevel } from '@/lib/levels';

// Cookie-aware client — reads the same session the middleware uses
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Child = { id: string; name: string; age: number | null; points: number; streak: number };
type Mission = { id: string; child_id: string; title: string; category?: string; screen_time_reward?: number; is_completed: boolean; mission_date?: string; updated_at?: string; generated_by?: string };
type Reward = { id: string; title: string; coin_cost: number };

const REWARD_PRESETS: Record<string, Array<{ title: string; coin_cost: number; emoji: string }>> = {
  '3-5':  [{ title: 'Choose a bedtime story', coin_cost: 10, emoji: '📚' }, { title: 'Extra playtime (15 min)', coin_cost: 20, emoji: '🎮' }, { title: 'Pick dessert tonight', coin_cost: 30, emoji: '🍦' }],
  '6-7':  [{ title: "Choose tonight's movie", coin_cost: 20, emoji: '🎬' }, { title: 'Extra playtime (20 min)', coin_cost: 30, emoji: '🎮' }, { title: 'Stay up 20 min later', coin_cost: 50, emoji: '🌙' }],
  '8-10': [{ title: '30 min extra screen time', coin_cost: 40, emoji: '📱' }, { title: 'Pick the movie tonight', coin_cost: 50, emoji: '🎬' }, { title: 'Friend playdate', coin_cost: 100, emoji: '🧑‍🤝‍🧑' }],
  '11-13':[{ title: '30 min Roblox or gaming', coin_cost: 50, emoji: '🎮' }, { title: '1 hour phone time', coin_cost: 70, emoji: '📱' }, { title: 'Friend sleepover', coin_cost: 150, emoji: '🛌' }],
  '14+':  [{ title: '1 hour gaming session', coin_cost: 60, emoji: '🎮' }, { title: 'Later curfew (30 min)', coin_cost: 90, emoji: '🌙' }, { title: 'Outing with friends', coin_cost: 220, emoji: '⭐' }],
};
function ageBand(age: number | null): string {
  if (age == null) return '8-10';
  if (age <= 5) return '3-5';
  if (age <= 7) return '6-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14+';
}
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
  const [dashWeather, setDashWeather]       = useState<WeatherData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingChildIds, setGeneratingChildIds] = useState<Set<string>>(new Set());
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // Ref (not state) so generateMissionsForAll always reads the live value, not a stale closure.
  const isAutoGenRef = useRef(false);
  const [winText, setWinText]             = useState('');
  const [winSaved, setWinSaved]           = useState(false);
  const [winSaving, setWinSaving]         = useState(false);
  const [todayWin, setTodayWin]           = useState<string | null>(null);
  const [showWinJournal, setShowWinJournal] = useState(false);
  // Inline section state
  const [rewards, setRewards]             = useState<Reward[]>([]);
  const [showAddTask, setShowAddTask]     = useState(false);
  const [addTaskChild, setAddTaskChild]   = useState('');
  const [addTaskTitle, setAddTaskTitle]   = useState('');
  const [addingTask, setAddingTask]       = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [addRewardTitle, setAddRewardTitle] = useState('');
  const [addRewardCost, setAddRewardCost] = useState<number | ''>('');
  const [addingReward, setAddingReward]   = useState(false);
  const [showAddChild, setShowAddChild]   = useState(false);
  const [addChildName, setAddChildName]   = useState('');
  const [addChildAge, setAddChildAge]     = useState<number | ''>('');
  const [addingChild, setAddingChild]     = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<Array<{
    id: string; child_id: string; reward_id: string;
    child_name?: string; reward_title?: string; coin_cost?: number;
  }>>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
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
    isAutoGenRef.current = true;
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
    // getSession() reads the auth cookie directly — no Supabase network round-trip.
    // Middleware already blocks unauthenticated requests server-side, so this is a
    // lightweight secondary guard for session-expiry while the user is active.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }
    const user = session.user;
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
        .or(`mission_date.gte.${sevenDaysAgo},mission_date.is.null`);

      if (missionRes.error) {
        const retry = await supabase
          .from('missions')
          .select('id, child_id, title, category, screen_time_reward, is_completed, mission_date, updated_at')
          .in('child_id', childIds)
          .or(`mission_date.gte.${sevenDaysAgo},mission_date.is.null`);
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

    const [{ data: rewardData }, { data: approvalData }] = await Promise.all([
      supabase.from('rewards').select('id, title, coin_cost').order('created_at', { ascending: false }),
      supabase.from('reward_redemptions').select('id, child_id, reward_id, reward_title, coin_cost').eq('status', 'pending'),
    ]);
    setRewards(rewardData || []);
    if (approvalData && approvalData.length > 0) {
      const childMap = Object.fromEntries((childData || []).map(c => [c.id, c.name]));
      const rewardMap = Object.fromEntries((rewardData || []).map(r => [r.id, r]));
      setPendingApprovals(approvalData.map(a => ({
        ...a,
        child_name: childMap[a.child_id] ?? 'Your child',
        reward_title: a.reward_title ?? rewardMap[a.reward_id]?.title ?? 'Unknown reward',
        coin_cost: a.coin_cost ?? rewardMap[a.reward_id]?.coin_cost ?? 0,
      })));
    } else {
      setPendingApprovals([]);
    }

    async function loadWeather() {
      // Attempt 1: stored city name
      if (loc) {
        try {
          const res = await fetch(`/api/weather?location=${encodeURIComponent(loc)}`);
          const json = await res.json();
          if (json && !json.error) {
            setDashWeather(json as WeatherData);
            return;
          }
        } catch {
        }
      }

      // Attempt 2: browser geolocation (runs if loc missing OR city lookup failed)
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
              const json = await res.json();
              if (json && !json.error) {
                setDashWeather(json as WeatherData);
              }
            } catch {
            }
          },
          () => {
          },
          { timeout: 8000 }
        );
      }
    }
    loadWeather();

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

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!addTaskChild || !addTaskTitle.trim() || addingTask) return;
    setAddingTask(true);
    const { error } = await supabase.from('missions').insert([{
      child_id: addTaskChild,
      title: addTaskTitle.trim(),
      category: 'general',
      screen_time_reward: 5,
      is_completed: false,
      mission_date: todayStr(),
    }]);
    if (!error) { setAddTaskTitle(''); setShowAddTask(false); await init(); }
    setAddingTask(false);
  }

  async function handleApproval(id: string, approve: boolean) {
    setApprovingId(id);
    try {
      const approval = pendingApprovals.find(a => a.id === id);
      if (approve && approval) {
        const { error: coinError } = await supabase.rpc('add_coins', {
          p_child_id: approval.child_id,
          p_amount: -(approval.coin_cost ?? 0),
          p_type: 'redeemed',
          p_description: `Redeemed: ${approval.reward_title}`,
          p_reward_id: approval.reward_id,
        });
        if (coinError) {
          console.error('[handleApproval] coin deduction failed:', coinError.message);
          setApprovingId(null);
          return;
        }
      }
      await supabase.from('reward_redemptions')
        .update({ status: approve ? 'approved' : 'declined' })
        .eq('id', id);
      setPendingApprovals(prev => prev.filter(a => a.id !== id));
    } catch { }
    setApprovingId(null);
  }

  async function handleAddReward(e: React.FormEvent) {
    e.preventDefault();
    if (!addRewardTitle.trim() || !addRewardCost || addingReward) return;
    setAddingReward(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setAddingReward(false); return; }
    let { error } = await supabase.from('rewards').insert([{ parent_id: u.id, title: addRewardTitle.trim(), coin_cost: Number(addRewardCost), reward_type: 'standard', is_active: true, sort_order: 0 }]);
    if (error) {
      const retry = await supabase.from('rewards').insert([{ parent_id: u.id, title: addRewardTitle.trim(), coin_cost: Number(addRewardCost) }]);
      error = retry.error;
    }
    if (!error) { setAddRewardTitle(''); setAddRewardCost(''); setShowAddReward(false); await init(); }
    setAddingReward(false);
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    if (!addChildName.trim() || addingChild) return;
    setAddingChild(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setAddingChild(false); return; }
    const { error } = await supabase.from('children').insert([{ parent_id: u.id, name: addChildName.trim(), age: addChildAge !== '' ? Number(addChildAge) : null }]);
    if (!error) { setAddChildName(''); setAddChildAge(''); setShowAddChild(false); await init(); }
    setAddingChild(false);
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

  async function generateMissionsForChild(childId: string, sessionToken: string, weatherSummary?: string): Promise<boolean> {
    const child = children.find(c => c.id === childId);
    if (!child) return false;
    setGeneratingChildIds(prev => new Set(prev).add(childId));
    try {
      const res = await fetch('/api/generate-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ childId: child.id, parentId: user?.id, childAge: child.age, weatherSummary }),
      });
      if (res.ok) return true;
      return false;
    } catch {
      return false;
    } finally {
      setGeneratingChildIds(prev => { const s = new Set(prev); s.delete(childId); return s; });
    }
  }

  async function generateMissionsForAll() {
    if (generatingAll || children.length === 0) return;
    setGeneratingAll(true);
    setGeneratedCount(null);
    setGenerateError(null);
    if (!isAutoGenRef.current) isAutoGenRef.current = false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
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
    for (const child of children) {
      const ok = await generateMissionsForChild(child.id, session.access_token, weatherSummary);
      if (ok) success += 1;
      // 1500ms gap between children to avoid Anthropic API 429s
      if (child !== children[children.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setGeneratedCount(success);
    if (success === 0 && !isAutoGenRef.current) {
      setGenerateError("Couldn't create missions right now. Please try again in a moment — your family's profile is saved.");
    }
    isAutoGenRef.current = false;
    await init();
    setGeneratingAll(false);
  }

  async function generateMissionsForSingleChild(childId: string) {
    if (generatingChildIds.has(childId) || generatingAll) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const child = children.find(c => c.id === childId);
    if (!child) return;

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

    // Own the loading state for the full cycle (API call + dashboard refresh) so the
    // card never flashes back to "No missions yet today" between generation and re-fetch.
    setGeneratingChildIds(prev => new Set(prev).add(childId));
    try {
      await fetch('/api/generate-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ childId: child.id, parentId: user?.id, childAge: child.age, weatherSummary }),
      });
    } catch {
    }
    await init();
    setGeneratingChildIds(prev => { const s = new Set(prev); s.delete(childId); return s; });
  }

  const firstName = user?.email
    ?.split('@')[0]
    ?.split(/[._-]/)[0]
    ?.replace(/[^a-zA-Z]/g, '')
    ?.replace(/^\w/, c => c.toUpperCase())
    ?? 'there';
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
        {children.length > 0 && (
          <WeatherCard location={familyLocation ?? ''} weatherMissions={hasTodayMissions && weatherMissionsIncluded} />
        )}

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Reward Requests</h2>
            <div className="space-y-2">
              {pendingApprovals.map(a => (
                <div key={a.id} className="bg-white border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">🎁</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.reward_title}</p>
                    <p className="text-xs text-gray-400">{a.child_name} · {a.coin_cost} 🪙</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproval(a.id, false)}
                      disabled={approvingId === a.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproval(a.id, true)}
                      disabled={approvingId === a.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {approvingId === a.id ? '…' : 'Approve ✓'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  className="min-h-[44px] px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-60"
                >
                  {generatingAll ? '✨ Creating…' : generatedCount !== null && generatedCount > 0 ? '✓ Missions created' : '✨ Create Missions Now'}
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
            {hasTodayMissions ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryStat label="Missions" value={totalToday} accent="text-navy" bg="bg-gray-50" />
                <SummaryStat label="Completed" value={totalTasksDone} accent="text-teal-600" bg={totalTasksDone > 0 ? 'bg-teal-50' : 'bg-gray-50'} />
                <SummaryStat label="Coins earned" value={coinsEarnedToday} accent="text-amber-500" bg={coinsEarnedToday > 0 ? 'bg-amber-50' : 'bg-gray-50'} />
                <SummaryStat label="Screen mins earned" value={screenTimeEarnedToday} accent="text-blue-500" bg={screenTimeEarnedToday > 0 ? 'bg-blue-50' : 'bg-gray-50'} />
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No missions yet — BrytThrive will create them automatically each morning, or tap ✨ above.</p>
            )}
          </section>
        )}

        {/* 4. Today's Progress — per-child cards */}
        {children.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today&apos;s Progress</h2>
                  {dashWeather && (
                    <WeatherWidget tempC={dashWeather.tempC} condition={dashWeather.condition} emoji={dashWeather.emoji} size="sm" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Live snapshot of each child&apos;s missions</p>
              </div>
              <button onClick={() => setShowAddChild(true)} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                <Plus size={14} /> Add child
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const avatar = getAvatar(child.name);
                const childMissions = missions.filter((m) => m.child_id === child.id && (m.mission_date === today || !m.mission_date));
                const done = childMissions.filter((m) => m.is_completed).length;
                const total = childMissions.length;
                const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
                const childCoins = child.points;
                const childScreenTime = childMissions.filter(m => m.is_completed).reduce((s, m) => s + (m.screen_time_reward ?? 5), 0);
                const badge = streakBadge(child.streak);
                const previewMissions = childMissions.slice(0, 3);
                const explorerLevel = getExplorerLevel(child.points);

                // Status label
                const statusLabel = total === 0
                  ? { label: 'Not started', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300' }
                  : done === total
                  ? { label: 'Mission pack complete', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' }
                  : { label: 'In progress', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' };

                const isGeneratingThisChild = generatingChildIds.has(child.id);

                return (
                  <div key={child.id} className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow card-lift ${isGeneratingThisChild ? 'opacity-80' : ''}`}>
                    {/* Accent strip — pulses while this child's missions are being created */}
                    <div className={`h-1.5 w-full ${avatar.bg} ${isGeneratingThisChild ? 'animate-pulse' : ''}`} />
                    <div className="p-5">
                      {/* Child header */}
                      <div className="flex items-center gap-3 mb-3">
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

                      {/* Status badge */}
                      <div className={`inline-flex items-center gap-1.5 ${statusLabel.bg} rounded-full px-3 py-1 mb-3`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusLabel.dot}`} />
                        <span className={`text-xs font-semibold ${statusLabel.text}`}>{statusLabel.label}</span>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        <div className="bg-gray-50 rounded-xl px-1 py-2 text-center">
                          <p className="text-sm font-bold text-navy">{done}/{total}</p>
                          <p className="text-[10px] text-gray-400 font-medium leading-tight">Done</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl px-1 py-2 text-center">
                          <p className="text-sm font-bold text-amber-600">{childCoins}</p>
                          <p className="text-[10px] text-amber-500 font-medium leading-tight">🪙 Coins</p>
                        </div>
                        <div className={`rounded-xl px-1 py-2 text-center ${childScreenTime > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <p className={`text-sm font-bold ${childScreenTime > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{childScreenTime}</p>
                          <p className={`text-[10px] font-medium leading-tight ${childScreenTime > 0 ? 'text-blue-500' : 'text-gray-400'}`}>📱 mins</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl px-1 py-2 text-center">
                          <p className="text-sm font-bold text-orange-500">{child.streak}</p>
                          <p className="text-[10px] text-orange-400 font-medium leading-tight">🔥 days</p>
                        </div>
                      </div>

                      {childMissions.length > 0 ? (
                        <>
                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{completionPct}% complete</span>
                              <span>{done} of {total} missions</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${completionPct}%` }}
                              />
                            </div>
                          </div>
                          {/* Mission preview */}
                          <ul className="space-y-1.5 mb-3">
                            {previewMissions.map((m) => (
                              <li key={m.id} className="flex items-center gap-2 text-sm">
                                <span className="text-sm flex-shrink-0">{CAT_EMOJI[m.category ?? 'general'] ?? '⭐'}</span>
                                <span className={`truncate ${m.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{m.title}</span>
                                {m.is_completed && <span className="ml-auto text-teal-400 text-xs flex-shrink-0">✓</span>}
                              </li>
                            ))}
                            {total > 3 && (
                              <li className="text-xs text-gray-400 pl-6">+{total - 3} more missions</li>
                            )}
                          </ul>
                          {done === total && total > 0 && (
                            <div className="mb-3 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 text-xs text-teal-700 font-semibold text-center">
                              🎉 All done! {childScreenTime} mins screen time ready — approve it!
                            </div>
                          )}
                          <Link href="/child" target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                            Open Kid View <ChevronRight size={12} />
                          </Link>
                        </>
                      ) : (
                        <div className="text-center py-3">
                          {generatingChildIds.has(child.id) ? (
                            <p className="text-xs text-teal-600 font-semibold animate-pulse">✨ Creating missions…</p>
                          ) : (
                            <>
                              <p className="text-2xl mb-1">🗺️</p>
                              <p className="text-xs text-gray-500 font-semibold mb-2">No missions yet today</p>
                              <button
                                onClick={() => generateMissionsForSingleChild(child.id)}
                                disabled={generatingChildIds.has(child.id) || generatingAll}
                                className="text-xs font-semibold text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                ✨ Create Missions Now
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          {/* Add child form — triggered from header button */}
          {showAddChild && (
            <form onSubmit={handleAddChild} className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-navy">Add a child</p>
                <button type="button" onClick={() => setShowAddChild(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <input type="text" value={addChildName} onChange={(e) => setAddChildName(e.target.value)} placeholder="Child's name" required className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <input type="number" value={addChildAge} onChange={(e) => setAddChildAge(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Age (optional)" min={2} max={18} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <button type="submit" disabled={addingChild || !addChildName.trim()} className="w-full min-h-[44px] bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50">
                {addingChild ? 'Adding…' : 'Add child'}
              </button>
            </form>
          )}
          </section>
        )}

        {/* Preview Kid Mode — below child cards, not above them */}
        {children.length > 0 && (
          <section className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base mb-0.5">Preview Your Child&apos;s BrytThrive Experience</h2>
              <p className="text-white/80 text-sm">See how your child checks in, completes missions, and earns iPad screen time.</p>
            </div>
            <Link href="/child?demo=1" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white text-teal-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-teal-50 transition-colors whitespace-nowrap min-h-[44px] flex items-center">
              Preview Kid Mode →
            </Link>
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

        {/* 5. Quick Actions — inline task add */}
        {children.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
            {generateError && <p className="text-xs text-red-600 mb-2 font-medium">{generateError}</p>}
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                onClick={() => setShowAddTask((v) => !v)}
                className="min-h-[44px] flex items-center gap-2 bg-white border border-gray-200 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Plus size={16} /> Add a task
              </button>
              <Link
                href="/child"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex items-center gap-2 bg-white border border-gray-200 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Tablet size={16} /> Open Kid View
              </Link>
            </div>
            {showAddTask && (
              <form onSubmit={handleAddTask} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-navy">Add a task for today</p>
                  <button type="button" onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
                <select
                  value={addTaskChild}
                  onChange={(e) => setAddTaskChild(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Select a child…</option>
                  {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  type="text"
                  value={addTaskTitle}
                  onChange={(e) => setAddTaskTitle(e.target.value)}
                  placeholder="e.g. Read for 20 minutes"
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button
                  type="submit"
                  disabled={addingTask || !addTaskChild || !addTaskTitle.trim()}
                  className="w-full min-h-[44px] bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {addingTask ? 'Adding…' : 'Add task'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* 5b. Rewards — inline */}
        {children.length > 0 && (() => {
          const firstChild = children[0];
          const band = ageBand(firstChild.age);
          const presets = REWARD_PRESETS[band] ?? REWARD_PRESETS['8-10'];
          const existingTitles = new Set(rewards.map((r) => r.title.toLowerCase()));
          const suggestedPresets = presets.filter((p) => !existingTitles.has(p.title.toLowerCase())).slice(0, 3);
          return (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Rewards</h2>
                <button onClick={() => setShowAddReward((v) => !v)} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                  <Plus size={14} /> Add reward
                </button>
              </div>

              {/* Existing rewards */}
              {rewards.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {rewards.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 text-sm font-medium text-amber-700">
                      <Gift size={13} /> {r.title} · {r.coin_cost}🪙
                    </div>
                  ))}
                  {rewards.length > 5 && <span className="text-xs text-gray-400 self-center">+{rewards.length - 5} more</span>}
                </div>
              )}

              {/* Suggested presets */}
              {suggestedPresets.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Suggested for age {band}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPresets.map((p) => (
                      <button
                        key={p.title}
                        onClick={async () => {
                          const { data: { user: u } } = await supabase.auth.getUser();
                          if (!u) return;
                          const { error: pe } = await supabase.from('rewards').insert([{ parent_id: u.id, title: p.title, coin_cost: p.coin_cost }]);
                          await init();
                        }}
                        className="flex items-center gap-1.5 bg-white border border-dashed border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        {p.emoji} {p.title} · {p.coin_cost}🪙
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline add form */}
              {showAddReward && (
                <form onSubmit={handleAddReward} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-navy">Add a reward</p>
                    <button type="button" onClick={() => setShowAddReward(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                  <input
                    type="text"
                    value={addRewardTitle}
                    onChange={(e) => setAddRewardTitle(e.target.value)}
                    placeholder="Reward name"
                    required
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <input
                    type="number"
                    value={addRewardCost}
                    onChange={(e) => setAddRewardCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="BrytCoins cost (e.g. 50)"
                    required
                    min={1}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    type="submit"
                    disabled={addingReward || !addRewardTitle.trim() || !addRewardCost}
                    className="w-full min-h-[44px] bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {addingReward ? 'Saving…' : 'Save reward'}
                  </button>
                </form>
              )}
            </section>
          );
        })()}

        {/* 6. Win Journal — compact, expands on click */}
        <section>
          {winSaved && todayWin ? (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3">
              <BookHeart size={14} className="text-teal-600 flex-shrink-0" />
              <p className="text-sm text-teal-800 flex-1 truncate">&ldquo;{todayWin}&rdquo;</p>
              <button onClick={() => { setWinSaved(false); setWinText(todayWin); }} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex-shrink-0">Edit</button>
            </div>
          ) : showWinJournal ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookHeart size={14} className="text-teal-600" />
                  <p className="text-sm font-semibold text-navy">Today&apos;s Family Win</p>
                </div>
                <button onClick={() => setShowWinJournal(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
              <textarea
                value={winText}
                onChange={(e) => setWinText(e.target.value.slice(0, 280))}
                placeholder="e.g. August finished all missions without being reminded!"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{winText.length}/280</span>
                <button onClick={saveWin} disabled={!winText.trim() || winSaving} className="min-h-[36px] px-5 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50">
                  {winSaving ? 'Saving…' : 'Save win'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowWinJournal(true)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-teal-600 transition-colors">
              <BookHeart size={14} /> ✍️ Record today&apos;s family win
            </button>
          )}
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
