'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Reward = {
  id: string;
  title: string;
  coin_cost: number;
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  points: number;
};

type Redemption = {
  id: string;
  child_id: string;
  reward_title: string;
  coin_cost: number;
  requested_at: string;
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [parentEmail, setParentEmail] = useState<string | null>(null);

  const supabase = getSupabase();

  async function fetchData() {
    const [{ data: rewardData }, { data: childData }, { data: walletData }, { data: redemptionData }] = await Promise.all([
      supabase.from('rewards').select('id, title, coin_cost, created_at').order('created_at', { ascending: false }),
      supabase.from('children').select('id, name'),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('reward_redemptions').select('id, child_id, reward_title, coin_cost, requested_at').order('requested_at', { ascending: false }),
    ]);

    const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
    setRewards(rewardData || []);
    setChildren((childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 })));
    setRedemptions(redemptionData || []);
    setFetching(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setParentEmail(data.session?.user?.email ?? null);
    });
    fetchData();

    const rewardsChannel = supabase
      .channel('rewards_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, fetchData)
      .subscribe();

    const redemptionsChannel = supabase
      .channel('redemptions_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reward_redemptions' }, (payload) => {
        const entry = payload.new as Redemption;
        setRedemptions((prev) => [entry, ...prev]);
        setRecentIds((prev) => [...prev, entry.id]);
        setTimeout(() => setRecentIds((prev) => prev.filter((id) => id !== entry.id)), 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rewardsChannel);
      supabase.removeChannel(redemptionsChannel);
    };
  }, []);

  async function addReward(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !cost) { toast.error('Please enter a reward name and cost.'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Session expired. Please log in again.'); return; }

    setLoading(true);
    const { error } = await supabase.from('rewards').insert([{
      parent_id: user.id,
      title,
      coin_cost: Number(cost),
      reward_type: 'standard',
      is_active: true,
      sort_order: 0,
    }]);

    if (error) toast.error('Error adding reward: ' + error.message);
    else { toast.success('Reward added!'); setTitle(''); setCost(''); fetchData(); }
    setLoading(false);
  }

  async function redeemReward(child: Child, reward: Reward) {
    if (child.points < reward.coin_cost) {
      toast.error(`${child.name} doesn't have enough points for this reward.`);
      return;
    }
    if (!confirm(`Redeem "${reward.title}" for ${child.name}? (${reward.coin_cost} pts)`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Session expired.'); return; }

    const { error: coinError } = await supabase.rpc('add_coins', {
      p_child_id: child.id,
      p_amount: -reward.coin_cost,
      p_type: 'redeemed',
      p_description: `Redeemed reward: ${reward.title}`,
      p_reward_id: reward.id,
    });
    if (coinError) { toast.error('Error deducting points.'); return; }

    const { error: redemptionError } = await supabase.from('reward_redemptions').insert([{
      child_id: child.id,
      reward_id: reward.id,
      parent_id: user.id,
      reward_title: reward.title,
      reward_type: 'standard',
      coin_cost: reward.coin_cost,
      status: 'fulfilled',
      requested_at: new Date().toISOString(),
      fulfilled_at: new Date().toISOString(),
    }]);
    if (redemptionError) console.error('[Rewards] redemption insert error:', redemptionError.message);

    try {
      const res = await fetch('/api/notify-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName: child.name, rewardTitle: reward.title, cost: reward.coin_cost, pointsRemaining: child.points - reward.coin_cost, parentEmail }),
      });
      const result = await res.json();
      if (result.success) console.log('Parent notified via email');
    } catch (err) {
      console.error('Failed to send email notification', err);
    }

    toast.success(`${child.name} redeemed "${reward.title}" 🎉`);
    fetchData();
  }

  const getChildName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

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

      <form onSubmit={addReward} className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Add a Reward</h2>
        <input className="border rounded-md px-3 py-2 w-full mb-3" placeholder="Reward name (e.g. Ice Cream Night)" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="border rounded-md px-3 py-2 w-full mb-3" type="number" placeholder="Cost (points)" value={cost} onChange={(e) => setCost(Number(e.target.value))} required />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full">
          {loading ? 'Adding...' : 'Add Reward'}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-3">Available Rewards</h2>
        {rewards.length === 0 ? (
          <p className="text-gray-500">No rewards yet.</p>
        ) : (
          <ul className="space-y-3">
            {rewards.map((reward) => (
              <li key={reward.id} className="p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{reward.title}</p>
                    <p className="text-sm text-gray-600">Cost: {reward.coin_cost} pts</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => redeemReward(child, reward)}
                        className={`px-3 py-1 rounded-md text-white text-sm ${child.points >= reward.coin_cost ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
                        disabled={child.points < reward.coin_cost}
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

      <div>
        <h2 className="text-lg font-semibold mb-3">Rewards History</h2>
        {redemptions.length === 0 ? (
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
                  {redemptions.map((entry) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ backgroundColor: '#f0fdf4' }}
                      animate={{ backgroundColor: recentIds.includes(entry.id) ? '#bbf7d0' : 'white' }}
                      transition={{ duration: 0.4 }}
                      exit={{ opacity: 0 }}
                      className="border-t"
                    >
                      <td className="px-4 py-2 font-medium">{getChildName(entry.child_id)}</td>
                      <td className="px-4 py-2">{entry.reward_title}</td>
                      <td className="px-4 py-2 text-red-600 font-semibold">-{entry.coin_cost}</td>
                      <td className="px-4 py-2 text-gray-600">{new Date(entry.requested_at).toLocaleString()}</td>
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
