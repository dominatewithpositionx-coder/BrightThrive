'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Flame, Clock, Star, Trash2, Plus, Minus, KeyRound, ChevronUp } from 'lucide-react';

type Child = {
  id: string;
  name: string;
  age: number;
  screen_time_limit: number;
  points: number;
  created_at: string;
};

type HistoryEntry = {
  id: string;
  child_id: string;
  change: number;
  reason: string;
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

function computeStreak(history: HistoryEntry[], childId: string): number {
  const completions = history.filter(
    (h) => h.child_id === childId && h.reason?.startsWith('Completed task:')
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

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [limit, setLimit] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function fetchData() {
    const [{ data: childData }, { data: histData }] = await Promise.all([
      supabase.from('children').select('*').order('created_at', { ascending: true }),
      supabase.from('points_history').select('id, child_id, change, reason, created_at').order('created_at', { ascending: false }),
    ]);
    setChildren(childData || []);
    setHistory(histData || []);
  }

  useEffect(() => {
    fetchData();
    // Load PINs from localStorage
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

    setLoading(true);
    const { error } = await supabase.from('children').insert([
      { name, age: age ? Number(age) : null, screen_time_limit: limit ? Number(limit) : 60 },
    ]);

    if (error) toast.error('Error adding child: ' + error.message);
    else {
      toast.success(`${name} added!`);
      setName('');
      setAge('');
      setLimit('');
      setShowForm(false);
      fetchData();
    }
    setLoading(false);
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

  async function deleteChild(id: string, childName: string) {
    if (!confirm(`Delete ${childName}'s profile? This can't be undone.`)) return;
    const { error } = await supabase.from('children').delete().eq('id', id);
    if (error) toast.error('Error deleting profile.');
    else {
      toast.success('Profile deleted.');
      fetchData();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Children</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
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
            className="border rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Name (e.g. Emma)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-3">
            <input
              className="border rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              type="number"
              placeholder="Age (optional)"
              min="1"
              max="18"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
            <input
              className="border rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              type="number"
              placeholder="Screen limit (min)"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <button
            type="submit"
            disabled={!name || loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            {loading ? 'Saving…' : 'Add Child'}
          </button>
        </form>
      )}

      {/* Children Grid */}
      {children.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-medium text-gray-700 mb-1">No children yet</p>
          <p className="text-sm text-gray-500 mb-4">Add your first child to start assigning tasks and rewards.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Add Your First Child
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {children.map((child, idx) => {
            const streak = computeStreak(history, child.id);
            const avatarColor = getAvatarColor(child.name);
            const screenPct = child.screen_time_limit
              ? Math.min(100, Math.round((child.screen_time_limit / 120) * 100))
              : 0;

            return (
              <div key={child.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                {/* Card header */}
                <div className={`px-5 py-4 flex items-center gap-4 ${avatarColor} bg-opacity-10`}>
                  <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                    {child.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg truncate">{child.name}</p>
                    {child.age && (
                      <p className="text-sm text-gray-500">Age {child.age}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteChild(child.id, child.name)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="Delete profile"
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
                    <span className={`text-sm font-semibold ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : 'No streak'}
                    </span>
                  </div>

                  {/* Screen time */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={15} className="text-blue-400" />
                        <span>Daily Screen Time</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{child.screen_time_limit ?? 60} min</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${screenPct}%` }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => adjustScreenTime(child.id, child.screen_time_limit ?? 60, -15)}
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <Minus size={13} /> 15 min
                      </button>
                      <button
                        onClick={() => adjustScreenTime(child.id, child.screen_time_limit ?? 60, +15)}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-50 border border-green-200 rounded-lg py-1.5 text-sm text-green-700 hover:bg-green-100"
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
                          <button onClick={() => clearPin(child.name)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingPin(child.id); setPinInput(''); }}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
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
                          className="border rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                          onKeyDown={(e) => e.key === 'Enter' && savePin(child.name)}
                          autoFocus
                        />
                        <button onClick={() => savePin(child.name)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">Save</button>
                        <button onClick={() => setEditingPin(null)} className="text-gray-400 px-2 text-sm hover:text-gray-600">✕</button>
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
  );
}
