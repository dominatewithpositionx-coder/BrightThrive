'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Flame, Clock, Star, Trash2, Plus, Minus, KeyRound, ChevronUp, AlertTriangle } from 'lucide-react';
import EmptyState, { EMPTY_STATES } from '@/components/brightthrive/EmptyState';

type Child = {
  id: string;
  name: string;
  age: number | null;
  screen_time_limit: number | null;
  points: number;
  created_at: string;
};

type LedgerEntry = {
  id: string;
  child_id: string;
  amount: number;
  description: string;
  created_at: string;
};

const AVATAR_COLORS = [
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash += ch.charCodeAt(0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function computeStreak(ledger: LedgerEntry[], childId: string): number {
  const completions = ledger.filter(
    (h) => h.child_id === childId && h.description?.startsWith('Completed task:')
  );
  const uniqueDays = Array.from(
    new Set(completions.map((h) => new Date(h.created_at).toLocaleDateString()))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDays.length === 0) return 0;

  const today = new Date().toLocaleDateString();
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

function DeleteConfirmModal({
  childName,
  onConfirm,
  onCancel,
  deleting,
}: {
  childName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} className="text-red-500" />
        </div>
        <h2 id="delete-dialog-title" className="text-xl font-bold text-navy mb-2">
          Remove {childName}?
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          This will permanently delete <span className="font-semibold text-navy">{childName}</span>'s profile, missions, and coin history.
        </p>
        <p className="text-xs text-gray-400 mb-6">This can't be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Keep profile
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-[2] py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {deleting ? 'Removing…' : 'Yes, remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = getSupabase();

  async function fetchData() {
    const [childRes, walletRes, ledgerRes] = await Promise.all([
      supabase.from('children').select('id, name, age, screen_time_limit, created_at').order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('bt_coin_ledger').select('id, child_id, amount, description, created_at').order('created_at', { ascending: false }),
    ]);

    if (walletRes.error) console.error('[children] wallet query error:', walletRes.error.message);
    if (ledgerRes.error) console.error('[children] ledger query error:', ledgerRes.error.message);

    // daily_screen_time_goal may not exist on older production DBs — retry without it.
    let childRows = childRes.data;
    if (childRes.error) {
      console.error('[children] query error (retrying without screen_time_limit):', childRes.error.message);
      const retry = await supabase
        .from('children')
        .select('id, name, age, created_at')
        .order('created_at', { ascending: true });
      if (retry.error) console.error('[children] retry error:', retry.error.message);
      childRows = (retry.data || []).map(c => ({ ...c, screen_time_limit: null }));
    }

    const walletMap = Object.fromEntries((walletRes.data || []).map(w => [w.child_id, w.balance]));
    setChildren((childRows || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 })));
    setLedger(ledgerRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    const stored: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bt_pin_')) stored[key.replace('bt_pin_', '')] = localStorage.getItem(key)!;
    }
    setPins(stored);
  }, []);

  function savePin(childName: string) {
    if (pinInput.length !== 4) { toast.error('PIN must be 4 digits'); return; }
    const key = childName.toLowerCase();
    localStorage.setItem(`bt_pin_${key}`, pinInput);
    setPins((p) => ({ ...p, [key]: pinInput }));
    setPinInput('');
    setEditingPin(null);
    toast.success(`PIN set for ${childName}`);
  }

  function clearPin(childName: string) {
    const key = childName.toLowerCase();
    localStorage.removeItem(`bt_pin_${key}`);
    setPins((p) => { const n = { ...p }; delete n[key]; return n; });
    toast.success(`PIN removed for ${childName}`);
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('children').insert([{
      name,
      age: age ? Number(age) : null,
      parent_id: user?.id,
    }]);
    if (error) toast.error('Error adding child: ' + error.message);
    else {
      toast.success(`${name} added!`);
      setName(''); setAge('');
      setShowForm(false);
      fetchData();
    }
    setSaving(false);
  }

  async function adjustScreenTime(id: string, current: number, delta: number) {
    const next = Math.max(0, current + delta);
    const { error } = await supabase.from('children').update({ screen_time_limit: next }).eq('id', id);
    if (error) toast.error('Error updating screen time.');
    else {
      toast.success(delta > 0 ? `+${delta} min added!` : `${Math.abs(delta)} min removed.`);
      fetchData();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('children').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Error removing profile.');
    else {
      toast.success('Profile removed.');
      fetchData();
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="p-6 space-y-5 animate-pulse">
        <div className="flex justify-between">
          <div className="h-8 bg-gray-100 rounded-lg w-32" />
          <div className="h-9 bg-gray-100 rounded-lg w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      {deleteTarget && (
        <DeleteConfirmModal
          childName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Children</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            aria-label={showForm ? 'Cancel adding child' : 'Add a child'}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Child'}
          </button>
        </div>

        {/* Add Child Form */}
        {showForm && (
          <form
            onSubmit={addChild}
            className="bg-white border rounded-xl shadow-sm p-6 max-w-md space-y-3"
          >
            <h2 className="text-base font-semibold text-gray-800 mb-1">New Child Profile</h2>
            <input
              className="border rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              placeholder="Name (e.g. Emma)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              aria-label="Child's name"
            />
            <input
              className="border rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              type="number"
              placeholder="Age (optional)"
              min="1"
              max="18"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              aria-label="Child's age (optional)"
            />
            <button
              type="submit"
              disabled={!name || saving}
              className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {saving ? 'Saving…' : 'Add Child'}
            </button>
          </form>
        )}

        {/* Children Grid */}
        {children.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <EmptyState
              emoji="🌱"
              headline="No children added yet"
              body="Add your first child to start assigning missions and rewards."
              cta={{ label: 'Add your first child', onClick: () => setShowForm(true) }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {children.map((child) => {
              const streak = computeStreak(ledger, child.id);
              const avatarColor = getAvatarColor(child.name);
              const screenGoal = child.screen_time_limit ?? 60;
              const screenPct = Math.min(100, Math.round((screenGoal / 120) * 100));

              return (
                <div key={child.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className={`px-5 py-4 flex items-center gap-4 ${avatarColor} bg-opacity-10`}>
                    <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                      {child.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy text-lg truncate">{child.name}</p>
                      {child.age && (
                        <p className="text-sm text-gray-500">Age {child.age}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteTarget(child)}
                      aria-label={`Remove ${child.name}'s profile`}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-4 space-y-4">
                    {/* Points */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star size={15} className="text-yellow-500" />
                        <span>Points</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{child.points ?? 0}</span>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Flame size={15} className={streak > 0 ? 'text-orange-500' : 'text-gray-300'} />
                        <span>Streak</span>
                      </div>
                      <span className={`text-sm font-semibold ${streak > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : 'No streak yet'}
                      </span>
                    </div>

                    {/* Screen time */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={15} className="text-blue-400" />
                          <span>Daily Screen Time</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{screenGoal} min</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={screenGoal} aria-valuemin={0} aria-valuemax={120} aria-label={`Screen time goal: ${screenGoal} minutes`}>
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${screenPct}%` }}
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => adjustScreenTime(child.id, screenGoal, -15)}
                          aria-label={`Reduce ${child.name}'s screen time by 15 minutes`}
                          className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={13} /> 15 min
                        </button>
                        <button
                          onClick={() => adjustScreenTime(child.id, screenGoal, +15)}
                          aria-label={`Add 15 minutes to ${child.name}'s screen time`}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-50 border border-green-200 rounded-lg py-1.5 text-sm text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <Plus size={13} /> 15 min
                        </button>
                      </div>
                    </div>

                    {/* Kid View PIN */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <KeyRound size={15} className="text-gray-400" />
                          <span>Kid View PIN</span>
                        </div>
                        {pins[child.name.toLowerCase()] ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Set ✓</span>
                            <button
                              onClick={() => clearPin(child.name)}
                              aria-label={`Remove PIN for ${child.name}`}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingPin(child.id); setPinInput(''); }}
                            aria-label={`Set PIN for ${child.name}`}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                          >
                            Set PIN
                          </button>
                        )}
                      </div>
                      {editingPin === child.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="number"
                            maxLength={4}
                            placeholder="4-digit PIN"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
                            className="border rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
                            onKeyDown={(e) => e.key === 'Enter' && savePin(child.name)}
                            aria-label={`Enter 4-digit PIN for ${child.name}`}
                            autoFocus
                          />
                          <button
                            onClick={() => savePin(child.name)}
                            aria-label="Save PIN"
                            className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-teal-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPin(null)}
                            aria-label="Cancel PIN entry"
                            className="text-gray-500 px-2 text-sm hover:text-gray-700 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
