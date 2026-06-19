'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, CheckCircle, Gift, Star, Users, Flame } from 'lucide-react';

type Child = { id: string; name: string; points: number };
type Task = { id: string; child_id: string; completed: boolean; created_at: string };
type PointsHistory = { id: string; child_id: string; change: number; reason: string; created_at: string };

const AVATAR_COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString();
  });
}

function computeStreak(history: PointsHistory[], childId: string): number {
  const days = Array.from(
    new Set(
      history
        .filter((h) => h.child_id === childId && h.reason?.startsWith('Completed task:'))
        .map((h) => new Date(h.created_at).toLocaleDateString())
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!days.length) return 0;
  const today = new Date().toLocaleDateString();
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function WeeklyChart({ history, childId, days }: { history: PointsHistory[]; childId: string; days: string[] }) {
  const pointsByDay = days.map((day) =>
    history
      .filter((h) => h.child_id === childId && h.change > 0 && new Date(h.created_at).toLocaleDateString() === day)
      .reduce((sum, h) => sum + h.change, 0)
  );
  const max = Math.max(...pointsByDay, 1);
  const dayLabels = days.map((d) => new Date(d).toLocaleDateString('en', { weekday: 'short' }));

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Points this week</p>
      <div className="flex items-end gap-1.5 h-16">
        {pointsByDay.map((pts, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-green-400 transition-all"
              style={{ height: `${Math.max(4, (pts / max) * 52)}px` }}
              title={`${pts} pts`}
            />
            <span className="text-[10px] text-gray-400">{dayLabels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchData() {
      const [{ data: childData }, { data: taskData }, { data: historyData }] = await Promise.all([
        supabase.from('children').select('id, name, points'),
        supabase.from('tasks').select('id, child_id, completed, created_at'),
        supabase.from('points_history').select('id, child_id, change, reason, created_at').order('created_at', { ascending: false }),
      ]);
      setChildren(childData || []);
      setTasks(taskData || []);
      setHistory(historyData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalTasksCompleted = tasks.filter((t) => t.completed).length;
  const totalPointsEarned = history.filter((h) => h.change > 0).reduce((sum, h) => sum + h.change, 0);
  const totalRewardsRedeemed = history.filter((h) => h.reason?.startsWith('Redeemed reward')).length;
  const childName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';
  const recentActivity = history.slice(0, 10);
  const days7 = getLast7Days();

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Family activity at a glance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Children" value={children.length} color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Tasks Completed" value={totalTasksCompleted} color="bg-green-500" />
        <StatCard icon={TrendingUp} label="Points Earned" value={totalPointsEarned} color="bg-purple-500" />
        <StatCard icon={Gift} label="Rewards Redeemed" value={totalRewardsRedeemed} color="bg-orange-500" />
      </div>

      {/* Per-Child Cards with Weekly Chart */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Weekly Summary</h2>
        {children.length === 0 ? (
          <p className="text-gray-500 italic">
            No children added yet.{' '}
            <a href="/dashboard/children" className="text-green-600 underline">Add a child</a> to see stats here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {children.map((child) => {
              const childHistory = history.filter((h) => h.child_id === child.id);
              const childCompleted = tasks.filter((t) => t.child_id === child.id && t.completed).length;
              const childEarned = childHistory.filter((h) => h.change > 0).reduce((sum, h) => sum + h.change, 0);
              const childRedeemed = childHistory.filter((h) => h.reason?.startsWith('Redeemed reward')).length;
              const streak = computeStreak(history, child.id);
              const color = avatarColor(child.name);

              return (
                <div key={child.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                        {child.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{child.name}</p>
                        <p className="text-sm text-green-600 font-medium">{child.points} pts available</p>
                      </div>
                      {streak > 0 && (
                        <div className="ml-auto flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">
                          <Flame size={12} />
                          {streak}d
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-lg font-bold text-gray-900">{childCompleted}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Tasks</p>
                      </div>
                      <div className="bg-green-50 rounded-lg py-2">
                        <p className="text-lg font-bold text-green-700">+{childEarned}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Earned</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg py-2">
                        <p className="text-lg font-bold text-orange-700">{childRedeemed}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Redeemed</p>
                      </div>
                    </div>
                  </div>

                  {/* Weekly bar chart */}
                  <div className="px-5 pb-5">
                    <WeeklyChart history={history} childId={child.id} days={days7} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 italic">No activity yet.</p>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Child</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((entry) => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{childName(entry.child_id)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{entry.reason}</td>
                    <td className={`px-4 py-3 font-semibold ${entry.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {entry.change > 0 ? `+${entry.change}` : entry.change}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
