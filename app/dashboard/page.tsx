'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Users, ClipboardList, Gift, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from './components/OnboardingWizard';

const supabase = getSupabase();

type Child = { id: string; name: string; points: number };
type Mission = { id: string; child_id: string; title: string; is_completed: boolean };
type Reward = { id: string; title: string; coin_cost: number };
type LedgerEntry = { id: string; child_id: string; amount: number; description: string; created_at: string };

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [recentLedger, setRecentLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  async function saveOnboardingFromSession(parentId: string) {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('bt_onboarding');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      await supabase.from('family_plans').upsert({
        parent_id: parentId,
        onboarding_completed: true,
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

    // Persist onboarding answers from sessionStorage on any first load.
    // Covers both Google OAuth (?onboarding=1) and email signup after confirmation.
    await saveOnboardingFromSession(user.id);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('onboarding') === '1') {
        router.replace('/dashboard');
      }
    }

    const [{ data: childData }, { data: walletData }, { data: missionData }, { data: rewardData }, { data: ledgerData }] = await Promise.all([
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

    // Show onboarding if this is a fresh account with no children
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
  const totalPending = missions.filter((m) => !m.is_completed).length;
  const childName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <div className="p-6 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {children.length === 0
              ? "Let's get your family set up."
              : `You're managing ${children.length} child${children.length > 1 ? 'ren' : ''}.`}
          </p>
        </div>

        {/* No children — prompt */}
        {children.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">Add your first child to get started</p>
              <p className="text-sm text-green-700 mt-1">Create a profile, assign tasks, and set rewards.</p>
            </div>
            <Link href="/dashboard/children" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap ml-4">
              Add Child
            </Link>
          </div>
        )}

        {/* Stat cards */}
        {children.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Children" value={children.length} color="bg-blue-500" href="/dashboard/children" />
            <StatCard icon={ClipboardList} label="Tasks Done" value={totalTasksDone} color="bg-green-500" href="/dashboard/tasks" />
            <StatCard icon={ClipboardList} label="Tasks Pending" value={totalPending} color="bg-yellow-500" href="/dashboard/tasks" />
            <StatCard icon={Gift} label="Rewards Available" value={rewards.length} color="bg-purple-500" href="/dashboard/rewards" />
          </div>
        )}

        {/* Child cards */}
        {children.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Your Children</h2>
              <Link href="/dashboard/children" className="text-sm text-green-600 hover:underline flex items-center gap-1">
                Manage <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const childMissions = missions.filter((m) => m.child_id === child.id);
                const done = childMissions.filter((m) => m.is_completed).length;
                const pending = childMissions.filter((m) => !m.is_completed).length;
                const affordable = rewards.filter((r) => r.coin_cost <= child.points).length;

                return (
                  <div key={child.id} className="bg-white rounded-xl border shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                        {child.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{child.name}</p>
                        <p className="text-sm text-green-600 font-medium">{child.points} points</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Tasks done</span>
                        <span className="font-medium text-gray-900">{done}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasks pending</span>
                        <span className="font-medium text-gray-900">{pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rewards they can afford</span>
                        <span className={`font-medium ${affordable > 0 ? 'text-green-600' : 'text-gray-400'}`}>{affordable}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recentLedger.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Link href="/dashboard/history" className="text-sm text-green-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="bg-white rounded-xl border shadow-sm divide-y">
              {recentLedger.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{childName(entry.child_id)}</p>
                    <p className="text-xs text-gray-500">{entry.description}</p>
                  </div>
                  <span className={`text-sm font-semibold ${entry.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links when set up */}
        {children.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickLink href="/dashboard/tasks" icon={ClipboardList} label="Add a Task" desc="Assign new tasks to earn points" />
              <QuickLink href="/dashboard/rewards" icon={Gift} label="Add a Reward" desc="Give kids something to work toward" />
              <QuickLink href="/dashboard/analytics" icon={TrendingUp} label="View Analytics" desc="See family progress at a glance" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: React.ElementType; label: string; value: number; color: string; href: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label, desc }: {
  href: string; icon: React.ElementType; label: string; desc: string;
}) {
  return (
    <Link href={href} className="bg-white border rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow group">
      <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
        <Icon size={18} className="text-green-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
