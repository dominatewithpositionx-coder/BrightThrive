'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, Check, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';
import { trackRewardCreated, trackRewardRedeemed } from '@/lib/analytics';

type Reward = { id: string; title: string; coin_cost: number; created_at: string };
type Child  = { id: string; name: string; age: number | null; points: number };
type Redemption = { id: string; child_id: string; reward_title: string; coin_cost: number; requested_at: string };
type ConfirmState = { child: Child; reward: Reward } | null;
type DeleteRewardState = Reward | null;

const AVATAR_COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-purple-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const REWARD_PRESETS: Record<string, Array<{ title: string; coin_cost: number; emoji: string }>> = {
  '3-5': [
    { title: 'Choose a bedtime story', coin_cost: 10, emoji: '📚' },
    { title: 'Extra playtime (15 min)', coin_cost: 20, emoji: '🎮' },
    { title: 'Pick dessert tonight', coin_cost: 30, emoji: '🍦' },
    { title: 'Stay up 15 min later', coin_cost: 40, emoji: '🌙' },
    { title: 'Special outing with parent', coin_cost: 100, emoji: '⭐' },
  ],
  '6-7': [
    { title: 'Choose tonight’s movie', coin_cost: 20, emoji: '🎬' },
    { title: 'Extra playtime (20 min)', coin_cost: 30, emoji: '🎮' },
    { title: 'Pick dessert tonight', coin_cost: 40, emoji: '🍦' },
    { title: 'Stay up 20 min later', coin_cost: 50, emoji: '🌙' },
    { title: 'Special outing with parent', coin_cost: 120, emoji: '⭐' },
  ],
  '8-10': [
    { title: '30 min extra screen time', coin_cost: 40, emoji: '📱' },
    { title: 'Pick the movie tonight', coin_cost: 50, emoji: '🎬' },
    { title: 'Choose dinner tonight', coin_cost: 60, emoji: '🍕' },
    { title: 'Friend playdate', coin_cost: 100, emoji: '🧑‍🤝‍🧑' },
    { title: 'Trip to the park or pool', coin_cost: 150, emoji: '⭐' },
  ],
  '11-13': [
    { title: '30 min Roblox or gaming', coin_cost: 50, emoji: '🎮' },
    { title: '1 hour phone time', coin_cost: 70, emoji: '📱' },
    { title: 'Choose the family meal', coin_cost: 80, emoji: '🍔' },
    { title: 'Friend sleepover', coin_cost: 150, emoji: '🛌' },
    { title: 'Day-out with a friend', coin_cost: 200, emoji: '⭐' },
  ],
  '14+': [
    { title: '1 hour gaming session', coin_cost: 60, emoji: '🎮' },
    { title: 'Later curfew (30 min)', coin_cost: 90, emoji: '🌙' },
    { title: 'Choose the takeout', coin_cost: 100, emoji: '🍔' },
    { title: 'Allowance bonus', coin_cost: 180, emoji: '💵' },
    { title: 'Outing with friends', coin_cost: 220, emoji: '⭐' },
  ],
};

function ageBand(age: number | null): string {
  if (age == null) return '8-10';
  if (age <= 5) return '3-5';
  if (age <= 7) return '6-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14+';
}

export default function RewardsPage() {
  const [rewards, setRewards]         = useState<Reward[]>([]);
  const [children, setChildren]       = useState<Child[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [title, setTitle]             = useState('');
  const [cost, setCost]               = useState<number | ''>('');
  const [saving, setSaving]           = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [recentIds, setRecentIds]     = useState<string[]>([]);
  const [confirm, setConfirm]           = useState<ConfirmState>(null);
  const [redeeming, setRedeeming]       = useState(false);
  const [deleteReward, setDeleteReward] = useState<DeleteRewardState>(null);
  const [deletingReward, setDeletingReward] = useState(false);
  const [parentEmail, setParentEmail]   = useState<string | null>(null);
  const [parentId, setParentId]         = useState<string | null>(null);

  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

  async function fetchData() {
    const [
      { data: rewardData },
      { data: childData },
      { data: walletData },
      { data: redemptionData },
    ] = await Promise.all([
      supabase.from('rewards').select('id, title, coin_cost, created_at').order('created_at', { ascending: false }),
      supabase.from('children').select('id, name, age'),
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
      setParentId(data.session?.user?.id ?? null);
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

    return () => { supabase.removeChannel(rewardsChannel); supabase.removeChannel(redemptionsChannel); };
  }, []);

  async function addReward(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !cost) { toast.error('Please enter a reward name and coin cost.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Session expired. Please log in again.'); return; }
    setSaving(true);
    let { error } = await supabase.from('rewards').insert([{
      parent_id: user.id,
      title: title.trim(),
      coin_cost: Number(cost),
      reward_type: 'standard',
      is_active: true,
      sort_order: 0,
    }]);
    if (error) {
      // reward_type / is_active / sort_order may not exist in production schema — retry minimal
      const retry = await supabase.from('rewards').insert([{
        parent_id: user.id,
        title: title.trim(),
        coin_cost: Number(cost),
      }]);
      error = retry.error;
    }
    if (error) { toast.error('Could not add reward. Please try again.'); }
    else {
      toast.success('Reward added!');
      trackRewardCreated({ coin_cost: Number(cost) });
      setTitle(''); setCost('');
      fetchData();
    }
    setSaving(false);
  }

  async function confirmRedeem() {
    if (!confirm) return;
    const { child, reward } = confirm;
    setRedeeming(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Session expired.'); setRedeeming(false); setConfirm(null); return; }

    const { error: coinError } = await supabase.rpc('add_coins', {
      p_child_id: child.id, p_amount: -reward.coin_cost, p_type: 'redeemed',
      p_description: `Redeemed reward: ${reward.title}`, p_reward_id: reward.id,
    });
    if (coinError) { toast.error('Could not deduct coins. Please try again.'); setRedeeming(false); setConfirm(null); return; }

    let { error: redemptionError } = await supabase.from('reward_redemptions').insert([{
      child_id: child.id, reward_id: reward.id, parent_id: user.id,
      reward_title: reward.title, reward_type: 'standard', coin_cost: reward.coin_cost,
      status: 'fulfilled', requested_at: new Date().toISOString(), fulfilled_at: new Date().toISOString(),
    }]);
    if (redemptionError) {
      // Optional columns may not exist — retry with minimal required set
      const retryRed = await supabase.from('reward_redemptions').insert([{
        child_id: child.id, reward_id: reward.id, parent_id: user.id,
        reward_title: reward.title, coin_cost: reward.coin_cost,
      }]);
      redemptionError = retryRed.error;
    }

    trackRewardRedeemed({ child_id: child.id, reward_title: reward.title, coin_cost: reward.coin_cost });

    fetch('/api/notify-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childName: child.name, rewardTitle: reward.title,
        cost: reward.coin_cost, pointsRemaining: child.points - reward.coin_cost,
        parentEmail, parentId,
      }),
    }).catch(() => {});

    toast.success(`${child.name} redeemed "${reward.title}" 🎉`);
    setConfirm(null);
    setRedeeming(false);
    fetchData();
  }

  async function confirmDeleteReward() {
    if (!deleteReward) return;
    setDeletingReward(true);
    const { error } = await supabase.from('rewards').delete().eq('id', deleteReward.id);
    if (error) toast.error('Could not remove reward. Please try again.');
    else { toast.success(`"${deleteReward.title}" removed.`); fetchData(); }
    setDeletingReward(false);
    setDeleteReward(null);
  }

  const getChildName = (id: string) => children.find((c) => c.id === id)?.name || 'Unknown';

  const youngestAge = children.length > 0
    ? children.reduce<number | null>((min, c) => {
        if (c.age == null) return min;
        if (min == null) return c.age;
        return Math.min(min, c.age);
      }, null)
    : null;
  const suggestions = REWARD_PRESETS[ageBand(youngestAge)] ?? REWARD_PRESETS['8-10'];

  // ── Loading skeleton ──────────�