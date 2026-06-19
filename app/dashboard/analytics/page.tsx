'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, CheckCircle, Gift, Star, Users } from 'lucide-react';

type Child = { id: string; name: string; points: number };
type Task = { id: string; child_id: string; completed: boolean; created_at: string };
type PointsHistory = { id: string; child_id: string; change: number; reason: string; created_at: string };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
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

export default function AnalyticsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);

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
  const totalPointsCirculating = children.reduce((sum, c) => sum + c.points, 0);

  const childName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

  const recentActivity = history.slice(0, 10);

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
        <StatCard icon={TrendingUp} label="Points Earned (All Time)" value={totalPointsEarned} color="bg-purple-500" />
        <StatCard icon={Gift} label="Rewards Redeemed" value={totalRewardsRedeemed} color="bg-orange-500" />
      </div>

      {/* Per-Child Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Per-Child Summary</h2>
        {children.length === 0 ? (
          <p className="text-gray-500 italic">No children added yet. <a href="/dashboard/children" className="text-blue-600 underline">Add a child</a> to see stats here.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => {
              const childTasks = tasks.filter((t) => t.child_id === child.id);
              const childCompleted = childTasks.filter((t) => t.completed).length;
              const childEarned = history
                .filter((h) => h.child_id === child.id && h.change > 0)
                .reduce((sum, h) => sum + h.change, 0);
              const childRedeemed = history.filter(
                (h) => h.child_id === child.id && h.reason?.startsWith('Redeemed reward')
              ).length;

              return (
                <div key={child.id} className="bg-white rounded-xl border shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                      {child.name[0].toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Current Points</span>
                      <span className="font-semibold text-gray-900">{child.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points Earned Total</span>
                      <span className="font-semibold text-green-600">+{childEarned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasks Completed</span>
                      <span className="font-semibold text-gray-900">{childCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rewards Redeemed</span>
                      <span className="font-semibold text-orange-600">{childRedeemed}</span>
                    </div>
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
                    <td className="px-4 py-3 text-gray-600">{entry.reason}</td>
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
