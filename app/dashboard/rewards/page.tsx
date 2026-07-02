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

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (fetching) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="h-7 bg-gray-100 rounded-lg w-28 mb-8 animate-pulse" />
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-11 bg-gray-200 rounded-xl" />
          <div className="h-11 bg-gray-200 rounded-xl" />
          <div className="h-11 bg-gray-200 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ── Confirmation modal ────────────────────────────────────────────────────

  return (
    <>
      {/* Delete reward confirmation */}
      <AnimatePresence>
        {deleteReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteReward(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">Remove this reward?</h2>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-navy">&ldquo;{deleteReward.title}&rdquo;</span> will be removed from your reward list.
              </p>
              <p className="text-xs text-gray-400 mb-6">Redemption history is kept.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteReward(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Keep it
                </button>
                <button
                  onClick={confirmDeleteReward}
                  disabled={deletingReward}
                  className="flex-[2] py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {deletingReward ? 'Removing…' : 'Yes, remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm text-center"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift size={26} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-navy mb-1">Redeem reward?</h2>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-semibold text-navy">{confirm.child.name}</span> will use{' '}
                <span className="font-semibold text-amber-600">{confirm.reward.coin_cost} 🪙</span> for
              </p>
              <p className="text-lg font-bold text-navy mb-1">&ldquo;{confirm.reward.title}&rdquo;</p>
              <p className="text-xs text-gray-400 mb-6">
                Balance after: {confirm.child.points - confirm.reward.coin_cost} coins
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRedeem}
                  disabled={redeeming}
                  className="flex-[2] py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {redeeming ? 'Redeeming…' : 'Yes, redeem it! 🎉'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page ── */}
      <div className="p-4 sm:p-6 max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-navy">Rewards</h1>
          <p className="text-sm text-gray-500 mt-1">Create rewards. Kids earn them by completing missions.</p>
          <p className="text-xs text-gray-400 mt-1">Rewards are available to all children in your family.</p>
        </div>

        {/* Suggested rewards */}
        {children.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Suggested Rewards</h2>
            <p className="text-xs text-gray-400 mb-3">BrytThrive suggestions — tap to add</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {suggestions.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => { setTitle(s.title); setCost(s.coin_cost); }}
                  aria-label={`Use suggestion: ${s.title}`}
                  className="flex-shrink-0 min-h-[44px] flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm hover:border-green-400 hover:bg-green-50 active:scale-95 transition-all"
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="font-medium text-navy whitespace-nowrap">{s.title}</span>
                  <span className="text-amber-600 font-semibold whitespace-nowrap">{s.coin_cost}🪙</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add reward form */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add a Reward</h2>
          <form onSubmit={addReward} className="space-y-3">
            <input
              className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
              placeholder="Reward name (e.g. Ice Cream Night)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Reward name"
              required
            />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 text-base">🪙</span>
                <input
                  className="w-full border border-gray-200 bg-white rounded-xl pl-9 pr-4 py-3 text-sm text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
                  type="number"
                  min="1"
                  placeholder="Coin cost"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                  aria-label="Coin cost"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                aria-label="Add reward"
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </form>
        </div>

        {/* Available rewards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Available Rewards</h2>
          {rewards.length === 0 ? (
            <EmptyState {...EMPTY_STATES.noRewards} />
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                  {/* Reward header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Gift size={17} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-navy text-sm">{reward.title}</p>
                        <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                          🪙 {reward.coin_cost} coins
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteReward(reward)}
                      aria-label={`Remove reward: ${reward.title}`}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Child redemption buttons */}
                  {children.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No children added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {children.map((child) => {
                        const canAfford = child.points >= reward.coin_cost;
                        return (
                          <button
                            key={child.id}
                            onClick={() => canAfford ? setConfirm({ child, reward }) : undefined}
                            disabled={!canAfford}
                            aria-label={canAfford
                              ? `Redeem ${reward.title} for ${child.name} (${child.points} coins available)`
                              : `${child.name} cannot afford this reward (needs ${reward.coin_cost - child.points} more coins)`
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              canAfford
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600 active:scale-95'
                                : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(child.name)}`}>
                              {child.name[0].toUpperCase()}
                            </div>
                            {child.name}
                            <span className={canAfford ? 'opacity-70' : ''}>
                              · {child.points}🪙
                            </span>
                            {!canAfford && (
                              <span className="text-gray-300 flex items-center" title="Not enough coins">
                                <AlertCircle size={11} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Redemption History</h2>
          {redemptions.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-6 py-10 text-center">
              <div className="text-3xl mb-2">🎁</div>
              <p className="text-sm text-gray-500">No rewards redeemed yet.</p>
              <p className="text-xs text-gray-500 mt-1">When a child redeems a reward it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {redemptions.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0, backgroundColor: recentIds.includes(entry.id) ? '#f0fdf4' : '#ffffff' }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(getChildName(entry.child_id))}`}>
                      {getChildName(entry.child_id)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{entry.reward_title}</p>
                      <p className="text-xs text-gray-500">{getChildName(entry.child_id)} · {new Date(entry.requested_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-amber-600">-{entry.coin_cost}🪙</span>
                      {recentIds.includes(entry.id) && <Check size={14} className="text-green-500" />}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
