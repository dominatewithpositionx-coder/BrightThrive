'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { ClipboardList, Gift, TrendingUp, ChevronRight, Star, Flame } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from './components/OnboardingWizard';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';

const supabase = getSupabase();

type Child = { id: string; name: string; points: number };
type Mission = { id: string; child_id: string; title: string; is_completed: boolean };
type Reward = { id: string; title: string; coin_cost: number };
type LedgerEntry = { id: string; child_id: string; amount: number; description: string; created_at: string };

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

export default function DashboardPage() {
  const [user, setUser]               = useState<any>(null);
  const [children, setChildren]       = useState<Child[]>([]);
  const [missions, setMissions]       = useState<Mission[]>([]);
  const [rewards, setRewards]         = useState<Reward[]>([]);
  const [recentLedger, setRecentLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
      { data: childData }, { data: walletData }, { data: missionData },
      { data: rewardData }, { data: ledgerData },
    ] = await Promise.all([
      supabase.from('children').select('id, name').order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('missions').select('id, child_id, title, is_completed'),
      supabase.from('rewards').select('id, title, coin_cost'),
      supabase.from('bt_coin_ledger').select('id, child_id, amount, description, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
    const kids = (childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 }));
    setChildren(kids);
    setMissions(missionData || []);
    setRewards(rewardData || []);
    setRecentLedger(ledgerData || []);
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

  const firstName = user?.email?.split('@')[0] ?? 'there';
  const totalTasksDone = missions.filter((m) => m.is_completed).length;
  const totalPending   = missions.filter((m) => !m.is_completed).length;
  const childName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
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

        {/* ── No children state ── */}
        {children.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <EmptyState {...EMPTY_STATES.noChildren} />
          </div>
        )}

        {/* ── Stat row (only when children exist) ── */}
        {children.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              emoji="✅"
              label="Done today"
              value={totalTasksDone}
              href="/dashboard/tasks"
              accent="text-green-600"
            />
            <StatCard
              emoji="🎯"
              label="Pending"
              value={totalPending}
              href="/dashboard/tasks"
              accent="text-amber-500"
            />
            <StatCard
              emoji="⭐"
              label="Rewards"
              value={rewards.length}
              href="/dashboard/rewards"
              accent="text-purple-500"
            />
          </div>
        )}

        {/* ── Child cards ── */}
        {children.length > 0 && (
          <section>
            <SectionHeader title="Your Children" href="/dashboard/children" linkLabel="Manage" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const avatar = getAvatar(child.name);
                const childMissions = missions.filter((m) => m.child_id === child.id);
                const done = childMissions.filter((m) => m.is_completed).length;
                const pending = childMissions.filter((m) => !m.is_completed).length;
                const affordable = rewards.filter((r) => r.coin_cost <= child.points).length;
                const completionPct = childMissions.length > 0
                  ? Math.round((done / childMissions.length) * 100) : 0;

                return (
                  <div key={child.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
                    {/* Avatar + name */}
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
                      {done > 0 && (
                        <div className="ml-auto flex items-center gap-1 bg-orange-50 rounded-full px-2 py-1">
                          <Flame size={12} className="text-orange-400" />
                          <span className="text-xs font-semibold text-orange-500">{done}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {childMissions.length > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>Today's missions</span>
                          <span>{completionPct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`rounded-xl py-2 ${done > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <p className={`text-base font-bold ${done > 0 ? 'text-green-600' : 'text-gray-500'}`}>{done}</p>
                        <p className="text-xs text-gray-500 mt-0.5">done</p>
                      </div>
                      <div className={`rounded-xl py-2 ${pending > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <p className={`text-base font-bold ${pending > 0 ? 'text-amber-500' : 'text-gray-500'}`}>{pending}</p>
                        <p className="text-xs text-gray-500 mt-0.5">left</p>
                      </div>
                      <div className={`rounded-xl py-2 ${affordable > 0 ? 'bg-purple-50' : 'bg-gray-50'}`}>
                        <p className={`text-base font-bold ${affordable > 0 ? 'text-purple-500' : 'text-gray-500'}`}>{affordable}</p>
                        <p className="text-xs text-gray-500 mt-0.5">rewards</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Recent activity ── */}
        {children.length > 0 && (
          <section>
            <SectionHeader title="Recent Activity" href="/dashboard/history" linkLabel="View all" />
            {recentLedger.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <EmptyState {...EMPTY_STATES.noHistory} />
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50">
                {recentLedger.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{childName(entry.child_id)}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.description}</p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ml-4 ${entry.amount > 0 ? 'text-green-600' : 'text-red-400'}`}>
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Quick actions ── */}
        {children.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickLink href="/dashboard/tasks"     icon={ClipboardList} label="Add a Task"    desc="Assign missions to earn coins" />
              <QuickLink href="/dashboard/rewards"   icon={Gift}          label="Add a Reward"  desc="Give kids something to work toward" />
              <QuickLink href="/dashboard/analytics" icon={TrendingUp}    label="View Progress" desc="See family trends at a glance" />
            </div>
          </section>
        )}

      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StatCard({ emoji, label, value, href, accent }: {
  emoji: string; label: string; value: number; href: string; accent: string;
}) {
  return (
    <Link href={href} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label, desc }: {
  href: string; icon: React.ElementType; label: string; desc: string;
}) {
  return (
    <Link href={href} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow group">
      <div className="p-2 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors flex-shrink-0">
        <Icon size={18} className="text-green-600" />
      </div>
      <div>
        <p className="font-semibold text-navy text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
