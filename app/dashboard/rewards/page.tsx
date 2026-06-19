'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Reward = {
  id: string;
  title: string;
  cost: number;
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  points: number;
};

type PointsHistory = {
  id: string;
  child_id: string;
  change: number;
  reason: string;
  created_at: string;
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [parentEmail, setParentEmail] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function fetchData() {
    const [{ data: rewardData }, { data: childData }, { data: historyData }] = await Promise.all([
      supabase.from('rewards').select('*').order('created_at', { ascending: false }),
      supabase.from('children').select('id, name, points'),
      supabase
        .from('points_history')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    setRewards(rewardData || []);
    setChildren(childData || []);
    setHistory(historyData?.filter(h => h.reason?.startsWith('Redeemed reward')) || []);
    setFetching(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setParentEmail(data.session?.user?.email ?? null);
    });
    fetchData();

    // 👂 Live updates for rewards & history
    const rewardsChannel = supabase
      .channel('rewards_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, fetchData)
      .subscribe();

    const historyChannel = supabase
      .channel('points_history_changes_rewards')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'points_history' },
        (payload) => {
          const newEntry = payload.new as PointsHistory;
          if (newEntry.reason?.startsWith('Redeemed reward')) {
            setHistory((prev) => [newEntry, ...prev]);
            setRecentIds((prev) => [...prev, newEntry.id]);
            setTimeout(() => {
              setRecentIds((prev) => prev.filter((id) => id !== newEntry.id));
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rewardsChannel);
      supabase.removeChannel(historyChannel);
    };
  }, []);

  // ➕ Add Reward
  async function addReward(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !cost) {
      toast.error('Please enter a reward name and cost.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('rewards').insert([
      {
        title,
        cost: Number(cost),
      },
    ]);

    if (error) toast.error('Error adding reward: ' + error.message);
    else {
      toast.success('Reward added!');
      setTitle('');
      setCost('');
      fetchData();
    }
    setLoading(false);
  }

  // 🎁 Redeem Reward
  async function redeemReward(child: Child, reward: Reward) {
    if (child.points < reward.cost) {
      toast.error(`${child.name} doesn’t have enough points for this reward.`);
      return;
    }

    if (!confirm(`Redeem "${reward.title}" for ${child.name}? (${reward.cost} pts)`)) return;

    // Deduct points
    const { error: pointsError } = await supabase.rpc('increment_points', {
      child_id: child.id,
      points_change: -reward.cost,
    });
    if (pointsError) {
      toast.error('Error deducting points.');
      return;
    }

    // Log redemption
    await supabase.from('points_history').insert([
      {
        child_id: child.id,
        change: -reward.cost,
        reason: `Redeemed reward: ${reward.title}`,
      },
    ]);

    // ✉️ Send email notification to parent via Resend
    try {
      const response = await fetch('/api/notify-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: child.name,
          rewardTitle: reward.title,
          cost: reward.cost,
          pointsRemaining: child.points - reward.cost,
          parentEmail,
        }),
      });
      const result = await response.json();
      if (result.success) console.log('✅ Parent notified via email');
    } catch (err) {
      console.error('Failed to send email notification', err);
    }

    toast.success(`${child.name} redeemed "${reward.title}" 🎉`);
    fetchData();
  }

  const getChildName = (id: string) =>
    children.find((c) => c.id === id)?.name || 'Unknown';

  if (fetching) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-48 bg-gray-200 rounded-xl max-w-md" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-6">Rewards</h1>

      {/* ➕ Add Reward Form */}
      <form
        onSubmit={addReward}
        className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-md mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Add a Reward</h2>
        <input
          className="border rounded-md px-3 py-2 w-full mb-3"
          placeholder="Reward name (e.g. Ice Cream Night)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="border rounded-md px-3 py-2 w-full mb-3"
          type="number"
          placeholder="Cost (points)"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full"
        >
          {loading ? 'Adding...' : 'Add Reward'}
        </button>
      </form>

      {/* 🎯 Active Rewards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Available Rewards</h2>
        {rewards.length === 0 ? (
          <p className="text-gray-500">No rewards yet.</p>
        ) : (
          <ul className="space-y-3">
            {rewards.map((reward) => (
              <li
                key={reward.id}
                className="p-4 bg-white rounded-lg shadow-sm border"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{reward.title}</p>
                    <p className="text-sm text-gray-600">
                      Cost: {reward.cost} pts
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => redeemReward(child, reward)}
                        className={`px-3 py-1 rounded-md text-white text-sm ${
                          child.points >= reward.cost
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={child.points < reward.cost}
                      >
                        {child.name} ({child.points})
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🕓 Reward History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Rewards History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 italic">No rewards redeemed yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2">Child</th>
                  <th className="px-4 py-2">Reward</th>
                  <th className="px-4 py-2">Cost</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {history.map((entry) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ backgroundColor: '#f0fdf4' }}
                      animate={{
                        backgroundColor: recentIds.includes(entry.id)
                          ? '#bbf7d0'
                          : 'white',
                      }}
                      transition={{ duration: 0.4 }}
                      exit={{ opacity: 0 }}
                      className="border-t"
                    >
                      <td className="px-4 py-2 font-medium">
                        {getChildName(entry.child_id)}
                      </td>
                      <td className="px-4 py-2">
                        {entry.reason.replace('Redeemed reward: ', '')}
                      </td>
                      <td className="px-4 py-2 text-red-600 font-semibold">
                        {entry.change}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
