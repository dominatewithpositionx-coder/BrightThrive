'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
  location_label: string | null;
  location_name: string | null;
  location_city: string | null;
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
  const [screenTimeAvailable, setScreenTimeAvailable] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState('');

  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

  async function fetchData() {
    const [childRes, walletRes, ledgerRes] = await Promise.all([
      supabase.from('children').select('id, name, age, screen_time_limit, location_label, location_name, location_city, created_at').order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('bt_coin_ledger').select('id, child_id, amount, description, created_at').order('created_at', { ascending: false }),
    ]);

    if (walletRes.error) console.error('[children] wallet query error:', walletRes.error.message);
    if (ledgerRes.error) console.error('[children] ledger query error:', ledgerRes.error.message);

    let childRows = childRes.data;
    if (childRes.error) {
      // screen_time_limit column missing from schema cache — retry without it
      console.error('[children] SELECT error, retrying without screen_time_limit:', childRes.error.message);
      setScreenTimeAvailable(false);
      const retry = await supabase
        .from('children')
        .select('id, name, age, created_at')
        .order('created_at', { ascending: true });
      if (retry.error) console.error('[children] retry error:', retry.error.message);
      childRows = (retry.data || []).map(c => ({ ...c, screen_time_limit: null, location_label: null, location_name: null, location_city: null }));
    }

    const walletMap = Object.fromEntries((walletRes.data || []).map(w => [w.child_id, w.balance]));
    const mapped = (childRows || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 }));
    setChildren(mapped);
    setPins(loadAndMigratePins(mapped));
    setLedger(ledgerRes.data || []);
    setLoading(false);
    // Auto-open add form when there are no children yet
    if (mapped.length === 0) setShowForm(true);
  }

  useEffect(() => { fetchData(); }, []);

  // Load PINs keyed by child ID; migrate any legacy name-based keys on first load.
  function loadAndMigratePins(childList: Child[]) {
    const stored: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('bt_pin_child_')) {
        stored[k.replace('bt_pin_child_', '')] = localStorage.getItem(k)!;
      }
    }
    for (const child of childList) {
      const oldKey = `bt_pin_${child.name.toLowerCase()}`;
      const oldPin = localStorage.getItem(oldKey);
      if (oldPin && !stored[child.id]) {
        stored[child.id] = oldPin;
        localStorage.setItem(`bt_pin_child_${child.id}`, oldPin);
        localStorage.removeItem(oldKey);
      }
    }
    return stored;
  }

  function savePin(childId: string, childName: string) {
    if (pinInput.length !== 4) { toast.error('PIN must be 4 digits'); return; }
    localStorage.setItem(`bt_pin_child_${childId}`, pinInput);
    setPins((p) => ({ ...p, [childId]: pinInput }));
    setPinInput('');
    setEditingPin(null);
    toast.success(`PIN set for ${childName}`);
  }

  function clearPin(childId: string, childName: string) {
    localStorage.removeItem(`bt_pin_child_${childId}`);
    // Also remove legacy name-based key if present
    localStorage.removeItem(`bt_pin_${childName.toLowerCase()}`);
    setPins((p) => { const n = { ...p }; delete n[childId]; return n; });
    toast.success(`PIN removed for ${childName}`);
  }

  const LOCATION_PRESETS = [
    { label: 'home',         name: 'Home',           emoji: '🏠' },
    { label: 'school',       name: 'School',         emoji: '🏫' },
    { label: 'grandparents', name: "Grandparents'",  emoji: '👴' },
    { label: 'vacation',     name: 'Vacation',       emoji: '🏖️' },
  ];

  async function saveLocation(child: Child, label: string, customName?: string) {
    const preset = LOCATION_PRESETS.find(p => p.label === label);
    const location_name = customName ?? preset?.name ?? label;
    let { error } = await supabase.from('children').update({
      location_label: label,
      location_name,
      location_city: locationCity || null,
    }).eq('id', child.id);
    if (error) {
      // location columns may not exist in production DB yet
      if (error.message?.includes('location_') || error.message?.includes('schema cache')) {
        toast.error('Location save requires a DB migration — run 20260015_child_location.sql in Supabase.');
        return;
      }
      toast.error('Could not save location.');
      return;
    }
    toast.success(`${child.name}'s location updated!`);
    setEditingLocation(null);
    setLocationCity('');
    fetchData();
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
    if (error) {
      // Column not yet in production schema — mark unavailable and advise
      if (error.message?.includes('screen_time_limit') || error.message?.includes('schema cache')) {
        setScreenTimeAvailable(false);
        toast.error('Screen time controls need a DB migration — run 20260014_ensure_screen_time_limit.sql in Supabase.');
      } else {
        toast.error('Error updating screen time.');
      }
    } else {
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
                    <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xl shrink-0`}