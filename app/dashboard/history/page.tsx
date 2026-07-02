'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';

type LedgerEntry = {
  id: string;
  child_id: string;
  amount: number;
  description: string;
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  points: number;
};

const AVATAR_COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-purple-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PointsHistoryPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function fetchData() {
      const [{ data: childData }, { data: walletData }, { data: ledgerData }] = await Promise.all([
        supabase.from('children').select('id, name'),
        supabase.from('bt_coin_wallet').select('child_id, balance'),
        supabase.from('bt_coin_ledger').select('id, child_id, amount, description, created_at').order('created_at', { ascending: false }),
      ]);
      const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
      setChildren((childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 })));
      setLedger(ledgerData || []);
      setLoading(false);
    }

    fetchData();

    const ledgerChannel = supabase
      .channel('bt_coin_ledger_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bt_coin_ledger' }, (payload) => {
        const newEntry = payload.new as LedgerEntry;
        setLedger((prev) => [newEntry, ...prev]);
        setRecentIds((prev) => [...prev, newEntry.id]);
        setTimeout(() => setRecentIds((prev) => prev.filter((id) => id !== newEntry.id)), 3000);
      })
      .subscribe();

    const walletChannel = supabase
      .channel('bt_coin_wallet_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bt_coin_wallet' }, (payload) => {
        const updated = payload.new as { child_id: string; balance: number };
        setChildren((prev) => prev.map((c) => c.id === updated.child_id ? { ...c, points: updated.balance } : c));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ledgerChannel);
      supabase.removeChannel(walletChannel);
    };
  }, []);

  const getChildName = (child_id: string) => children.find((c) => c.id === child_id)?.name || 'Unknown';
  const filtered = selectedChild === 'all' ? ledger : ledger.filter((e) => e.child_id === selectedChild);

  if (loading) {
    return (
      <div className="p-6 space-y-5 animate-pulse max-w-2xl">
        <div className="h-8 bg-gray-100 rounded-lg w-40" />
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Coin History</h1>
        <p className="text-sm text-gray-500 mt-1">A log of every coin earned and spent by your family.</p>
      </div>

      {/* Wallet summary */}
      {children.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {children.map((child) => (
            <div key={child.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className={`w-6 h-6 rounded-full ${avatarColor(child.name)} flex items-center justify-center text-white text-xs font-bold`}>
                {child.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-navy">{child.name}</span>
              <span className="text-sm font-bold text-amber-600">{child.points}🪙</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      {children.length > 0 && (
        <div className="flex items-center gap-3">
          <label htmlFor="child-filter" className="text-sm font-medium text-gray-700 shrink-0">Filter by</label>
          <select
            id="child-filter"
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 sm:flex-none sm:w-52"
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          >
            <option value="all">All children</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Entries */}
      {children.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState {...EMPTY_STATES.noHistory} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState
            emoji="📅"
            headline="No activity yet"
            body="Complete missions to start earning coins."
            cta={{ label: 'Start a mission', href: '/child' }}
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
          <AnimatePresence initial={false}>
            {filtered.map((entry) => {
              const childName = getChildName(entry.child_id);
              const isRecent = recentIds.includes(entry.id);
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, backgroundColor: isRecent ? (entry.amount > 0 ? '#f0fdf4' : '#fef2f2') : '#ffffff' }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div className={`w-9 h-9 rounded-full ${avatarColor(childName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {childName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{childName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}🪙
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.created_at)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
