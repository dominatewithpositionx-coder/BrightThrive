'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronRight, Plus, X } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from './components/OnboardingWizard';
import { type WeatherData } from '@/lib/weather';
import DailyBriefing from './components/DailyBriefing';
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
    id: string; child_id: string; reward_id?: string;
    child_name?: string; reward_title?: string; coin_cost?: number;
  }>>([]);
  const [approvalQueryErr, setApprovalQueryErr] = useState<string | null>(null);
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

    const { data: rewardData } = await supabase
      .from('rewards').select('id, title, coin_cost').order('created_at', { ascending: false });
    setRewards(rewardData || []);

    // SELECT matches the schema that was confirmed working (includes reward_title, coin_cost,
    // status). reward_name is included for rows inserted before that column was renamed.
    const { data: approvalRaw, error: approvalErr } = await supabase
      .from('reward_redemptions')
      .select('id, child_id, reward_id, reward_title, coin_cost, reward_name, status')
      .eq('status', 'pending');

    if (approvalErr) {
      console.error('[dashboard] reward_redemptions query failed:',
        approvalErr.code, approvalErr.message, approvalErr.details, approvalErr.hint);
      setApprovalQueryErr(`${approvalErr.code}: ${approvalErr.message}`);
      setPendingApprovals([]);
    } else {
      setApprovalQueryErr(null);
      const rows = (approvalRaw ?? []) as Record<string, unknown>[];
      const childMap = Object.fromEntries((childData || []).map(c => [c.id, c.name]));
      const rewardMap = Object.fromEntries((rewardData || []).map((r: { id: string; title: string; coin_cost: number }) => [r.id, r]));
      setPendingApprovals(
        rows.map(a => ({
          id: a.id as string,
          child_id: a.child_id as string,
          reward_id: a.reward_id as string | undefined,
          child_name: childMap[a.child_id as string] ?? 'Your child',
          reward_title: (a.reward_title as string | undefined)
            ?? (a.reward_name as string | undefined)
            ?? rewardMap[a.reward_id as string]?.title
            ?? 'Unknown reward',
          coin_cost: (a.coin_cost as number | undefined)
            ?? rewardMap[a.reward_id as string]?.coin_cost
            ?? 0,
        }))
      );
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

  function getChildNarrative(child: Child, done: number, total: number): string {
    if (total === 0 && child.streak >= 3)
      return `${child.name} has a ${child.streak}-day streak — let's keep the magic going! ✨`;
    if (total === 0)
      return `Ready for today's adventure? Let's create some missions! 🌟`;
    if (done === total && total >= 3)
      return `🎉 Every mission complete! ${child.name} is absolutely on fire today.`;
    if (done === total && total > 0)
      return `All missions done — what a great day for ${child.name}! 🌟`;
    if (done > 0 && child.streak >= 3)
      return `${child.name} is on a ${child.streak}-day streak and has completed ${done} mission${done !== 1 ? 's' : ''} today!`;
    if (done > 0)
      return `${child.name} has ${done} mission${done !== 1 ? 's' : ''} done — ${total - done} more to go. You've got this!`;
    if (child.streak >= 3)
      return `${child.name} has a ${child.streak}-day streak! Time to start today's missions. 🔥`;
    return `${child.name}'s missions are ready — let the adventure begin! 🚀`;
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-10 skeleton rounded-xl w-56" />
          <div className="h-4 skeleton rounded-lg w-40" />
        </div>
        <div className="h-20 skeleton rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="h-72 skeleton rounded-3xl" />
          <div className="h-72 skeleton rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-10">

        {/* ── Greeting ── */}
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-base text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {children.length > 0 && totalToday > 0 && (
            <p className="text-base text-gray-700 mt-2 font-medium leading-snug">{getStoryline()}</p>
          )}
        </div>

        {/* ── AI Insight ── */}
        {children.length > 0 && (
          <DailyBriefing
            children={children.map((c) => ({ name: c.name, age: c.age ?? 8 }))}
            completedToday={totalTasksDone}
            totalToday={totalToday}
          />
        )}

        {/* ── Debug: approval query error ── */}
        {approvalQueryErr && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
            <strong>⚠️ Reward Requests unavailable</strong>
            <pre className="mt-1 whitespace-pre-wrap break-all">{approvalQueryErr}</pre>
          </div>
        )}

        {/* ── Reward Requests ── */}
        {pendingApprovals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">💛</span>
              <h2 className="text-sm font-bold text-gray-700">Reward Requests</h2>
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold rounded-full px-2.5 py-0.5">
                {pendingApprovals.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((approval) => {
                const isAddRewardsRequest = (approval.reward_title ?? '').startsWith('🎁 Please add rewards');
                return (
                  <div
                    key={approval.id}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5"
                  >
                    {isAddRewardsRequest ? (
                      <>
                        <p className="text-lg font-black text-gray-900 mb-1">
                          {approval.child_name} wants you to add rewards! 🎁
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          They&apos;ve earned BrytCoins and have nothing to spend them on yet.
                        </p>
                        <div className="flex gap-3">
                          <a
                            href="/dashboard/rewards"
                            className="flex-1 min-h-[44px] bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center"
                          >
                            🎁 Add Rewards Now
                          </a>
                          <button
                            onClick={() => handleApproval(approval.id, false)}
                            disabled={approvingId === approval.id}
                            className="flex-1 min-h-[44px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-2xl transition-all text-sm disabled:opacity-60"
                          >
                            Dismiss
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 font-medium mb-0.5">{approval.child_name} is hoping for…</p>
                        <p className="text-lg font-black text-gray-900 mb-1">{approval.reward_title}</p>
                        <p className="text-sm font-bold text-amber-600 mb-4">{approval.coin_cost} 🪙 BrytCoins</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproval(approval.id, true)}
                            disabled={approvingId === approval.id}
                            className="flex-1 min-h-[44px] bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-60 text-sm"
                          >
                            {approvingId === approval.id ? '…' : '❤️ Say Yes!'}
                          </button>
                          <button
                            onClick={() => handleApproval(approval.id, false)}
                            disabled={approvingId === approval.id}
                            className="flex-1 min-h-[44px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-2xl transition-all text-sm disabled:opacity-60"
                          >
                            Not right now
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Your Family ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-gray-900">Your Family</h2>
            {!hasTodayMissions && children.length > 0 && (
              <button
                onClick={generateMissionsForAll}
                disabled={generatingAll}
                className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold rounded-2xl hover:from-teal-600 hover:to-emerald-600 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
              >
                {generatingAll ? '✨ Creating…' : "✨ Create Today's Adventure"}
              </button>
            )}
          </div>

          {children.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-12 text-center space-y-4">
              <p className="text-5xl">🌱</p>
              <p className="text-xl font-black text-gray-900">Your family adventure starts here</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                Add your first child and BrytThrive will create personalised daily missions just for them.
              </p>
              <button
                onClick={() => setShowAddChild(true)}
                className="inline-flex items-center gap-2 min-h-[44px] px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold rounded-2xl hover:from-teal-600 hover:to-emerald-600 active:scale-95 transition-all shadow-sm"
              >
                <Plus size={16} /> Add your first child
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {children.map((child) => {
                const avatar = getAvatar(child.name);
                const childMissions = missions.filter((m) => m.child_id === child.id && (m.mission_date === today || !m.mission_date));
                const done = childMissions.filter((m) => m.is_completed).length;
                const total = childMissions.length;
                const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
                const coinsToday = childMissions.filter(m => m.is_completed).length * 10;
                const explorerLevel = getExplorerLevel(child.points);
                const isGenerating = generatingChildIds.has(child.id);

                return (
                  <div
                    key={child.id}
                    className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isGenerating ? 'opacity-80' : ''}`}
                  >
                    <div className={`h-1.5 w-full ${avatar.bg} ${isGenerating ? 'animate-pulse' : ''}`} />
                    <div className="p-6 space-y-4">

                      {/* Name + level + streak */}
                      <div className="flex items-start gap-3">
                        <div className={`w-16 h-16 rounded-2xl ${avatar.bg} flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-md`}>
                          {child.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-xl font-black text-gray-900 leading-tight">{child.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{explorerLevel.emoji} {explorerLevel.name}</p>
                        </div>
                        {child.streak > 0 && (
                          <div className="flex-shrink-0 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                            <span className="text-sm">🔥</span>
                            <span className="text-xs font-bold text-orange-600">{child.streak}</span>
                          </div>
                        )}
                      </div>

                      {/* Narrative */}
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {getChildNarrative(child, done, total)}
                      </p>

                      {/* Progress */}
                      {total > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{done} of {total} missions done</span>
                            <span className="font-semibold">{completionPct}%</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Coins */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 rounded-2xl p-3 text-center">
                          <p className="text-xl font-black text-amber-600">{child.points}</p>
                          <p className="text-xs text-gray-400 mt-0.5">🪙 BrytCoins</p>
                        </div>
                        <div className={`rounded-2xl p-3 text-center ${coinsToday > 0 ? 'bg-teal-50' : 'bg-gray-50'}`}>
                          <p className={`text-xl font-black ${coinsToday > 0 ? 'text-teal-600' : 'text-gray-300'}`}>+{coinsToday}</p>
                          <p className="text-xs text-gray-400 mt-0.5">🌟 Earned today</p>
                        </div>
                      </div>

                      {/* Generate / loading */}
                      {total === 0 && (
                        isGenerating ? (
                          <p className="text-sm text-teal-600 font-medium animate-pulse text-center py-1">✨ Creating your adventure…</p>
                        ) : (
                          <button
                            onClick={() => generateMissionsForSingleChild(child.id)}
                            disabled={generatingAll}
                            className="w-full min-h-[44px] text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                          >
                            ✨ Create Today&apos;s Adventure
                          </button>
                        )
                      )}

                      {/* Rewards nudge on card */}
                      {rewards.length === 0 && (
                        <a
                          href="/dashboard/rewards"
                          className="flex items-center justify-center gap-1.5 min-h-[40px] bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs rounded-2xl transition-colors hover:bg-amber-100"
                        >
                          🎁 Add Rewards for {child.name}
                        </a>
                      )}

                      {/* Kid view */}
                      <Link
                        href="/child"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 py-1 transition-colors"
                      >
                        Open Kid View <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add child form */}
          {showAddChild && (
            <form onSubmit={handleAddChild} className="mt-5 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-gray-900">Add a child</p>
                <button type="button" onClick={() => setShowAddChild(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={addChildName}
                onChange={(e) => setAddChildName(e.target.value)}
                placeholder="Child's name"
                required
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              />
              <input
                type="number"
                value={addChildAge}
                onChange={(e) => setAddChildAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Age (optional)"
                min={2}
                max={18}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              />
              <button
                type="submit"
                disabled={addingChild || !addChildName.trim()}
                className="w-full min-h-[44px] bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-2xl hover:from-teal-600 hover:to-emerald-600 active:scale-95 transition-all disabled:opacity-50 text-sm"
              >
                {addingChild ? 'Adding…' : '🌟 Add child'}
              </button>
            </form>
          )}

          {children.length > 0 && !showAddChild && (
            <button
              onClick={() => setShowAddChild(true)}
              className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Add another child
            </button>
          )}
        </section>

        {/* ── No-rewards nudge ── */}
        {children.length > 0 && rewards.length === 0 && (
          <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-6 text-center space-y-4">
            <div className="text-4xl">🎁</div>
            <div>
              <p className="text-base font-black text-gray-900">Your children are earning BrytCoins!</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Add a few rewards so they have something exciting to work towards.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { title: '30 min Roblox', coin_cost: 50 },
                { title: '1 hour screen time', coin_cost: 70 },
                { title: 'Choose dinner tonight', coin_cost: 60 },
                { title: 'Friend playdate', coin_cost: 100 },
              ].map((preset) => (
                <button
                  key={preset.title}
                  onClick={async () => {
                    const { data: { user: u } } = await supabase.auth.getUser();
                    if (!u) return;
                    let { error } = await supabase.from('rewards').insert([{ parent_id: u.id, title: preset.title, coin_cost: preset.coin_cost, reward_type: 'standard', is_active: true, sort_order: 0 }]);
                    if (error) await supabase.from('rewards').insert([{ parent_id: u.id, title: preset.title, coin_cost: preset.coin_cost }]);
                    await init();
                  }}
                  className="min-h-[40px] bg-white border border-amber-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-2xl hover:bg-amber-50 hover:border-amber-300 active:scale-95 transition-all"
                >
                  + {preset.title} · {preset.coin_cost}🪙
                </button>
              ))}
            </div>
            <a
              href="/dashboard/rewards"
              className="inline-flex items-center gap-2 min-h-[44px] bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-colors"
            >
              🎁 Manage All Rewards
            </a>
          </section>
        )}

      </div>
    </>
  );
}
