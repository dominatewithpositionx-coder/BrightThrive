'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

type PointsHistory = {
  id: string;
  child_id: string;
  change: number;
  reason: string;
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  points: number;
};

export default function PointsHistoryPage() {
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🔄 Fetch children and history
  useEffect(() => {
    async function fetchData() {
      const { data: childData } = await supabase
        .from('children')
        .select('id, name, points');
      setChildren(childData || []);

      const { data: historyData } = await supabase
        .from('points_history')
        .select('*')
        .order('created_at', { ascending: false });
      setHistory(historyData || []);
    }

    fetchData();

    // 👂 Subscribe to realtime updates for new history rows
    const historyChannel = supabase
      .channel('points_history_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'points_history' },
        (payload) => {
          const newEntry = payload.new as PointsHistory;
          setHistory((prev) => [newEntry, ...prev]);
          setRecentIds((prev) => [...prev, newEntry.id]);
          setTimeout(() => {
            setRecentIds((prev) => prev.filter((id) => id !== newEntry.id));
          }, 3000);
        }
      )
      .subscribe();

    // 👂 Subscribe to realtime points updates
    const childrenChannel = supabase
      .channel('children_points_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'children' },
        (payload) => {
          const updatedChild = payload.new as Child;
          setChildren((prev) =>
            prev.map((child) =>
              child.id === updatedChild.id ? updatedChild : child
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(historyChannel);
      supabase.removeChannel(childrenChannel);
    };
  }, []);

  const getChildName = (child_id: string) =>
    children.find((c) => c.id === child_id)?.name || 'Unknown';

  // 🧩 Filter history by selected child
  const filteredHistory =
    selectedChild === 'all'
      ? history
      : history.filter((entry) => entry.child_id === selectedChild);

  return (
    <div className="p-6 space-y-6">
      {/* 🧒 Summary Bar */}
      <div className="flex flex-wrap gap-3 bg-white border rounded-lg shadow-sm p-4 justify-start items-center">
        {children.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No children yet.</p>
        ) : (
          children.map((child) => (
            <div
              key={child.id}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-50 border hover:bg-gray-100 transition"
            >
              <span className="font-semibold text-gray-800">{child.name}:</span>
              <span className="text-green-600 font-bold">{child.points ?? 0} pts</span>
            </div>
          ))
        )}
      </div>

      {/* 🔽 Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Points History</h1>

        <select
          className="border px-3 py-2 rounded-md text-sm w-full sm:w-60"
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
        >
          <option value="all">All Children</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
      </div>

      {/* 🧾 Points History Table */}
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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No points history for this child.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{
                      backgroundColor:
                        entry.change > 0 ? '#d1fae5' : '#fee2e2',
                    }}
                    animate={{
                      backgroundColor: recentIds.includes(entry.id)
                        ? entry.change > 0
                          ? '#bbf7d0'
                          : '#fecaca'
                        : 'white',
                    }}
                    transition={{ duration: 0.4 }}
                    exit={{ opacity: 0 }}
                    className="border-t"
                  >
                    <td className="px-4 py-2 font-medium">
                      {getChildName(entry.child_id)}
                    </td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        entry.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {entry.change > 0 ? `+${entry.change}` : entry.change}
                    </td>
                    <td className="px-4 py-2">{entry.reason}</td>
                    <td className="px-4 py-2">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
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
