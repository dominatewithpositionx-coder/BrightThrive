'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function PointsHistoryPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3 bg-white border rounded-lg shadow-sm p-4 justify-start items-center">
        {children.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No children yet.</p>
        ) : (
          children.map((child) => (
            <div key={child.id} className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-50 border hover:bg-gray-100 transition">
              <span className="font-semibold text-gray-800">{child.name}:</span>
              <span className="text-green-600 font-bold">{child.points} pts</span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Points History</h1>
        <select
          className="border px-3 py-2 rounded-md text-sm w-full sm:w-60"
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
        >
          <option value="all">All Children</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-2">Child</th>
              <th className="px-4 py-2">Change</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500 italic">No points history for this child.</td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ backgroundColor: entry.amount > 0 ? '#d1fae5' : '#fee2e2' }}
                    animate={{ backgroundColor: recentIds.includes(entry.id) ? (entry.amount > 0 ? '#bbf7d0' : '#fecaca') : 'white' }}
                    transition={{ duration: 0.4 }}
                    exit={{ opacity: 0 }}
                    className="border-t"
                  >
                    <td className="px-4 py-2 font-medium">{getChildName(entry.child_id)}</td>
                    <td className={`px-4 py-2 font-semibold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                    </td>
                    <td className="px-4 py-2">{entry.description}</td>
                    <td className="px-4 py-2">{new Date(entry.created_at).toLocaleString()}</td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
