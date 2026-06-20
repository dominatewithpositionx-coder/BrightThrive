'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Star, CheckCircle, Gift, ChevronLeft, Flame, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

type Child = { id: string; name: string; points: number };
type Task = { id: string; child_id: string; title: string; completed: boolean };
type Reward = { id: string; title: string; cost: number };

const AVATAR_COLORS = [
  { bg: 'bg-green-400', ring: 'ring-green-300', text: 'text-green-900', light: 'bg-green-50' },
  { bg: 'bg-blue-400', ring: 'ring-blue-300', text: 'text-blue-900', light: 'bg-blue-50' },
  { bg: 'bg-purple-400', ring: 'ring-purple-300', text: 'text-purple-900', light: 'bg-purple-50' },
  { bg: 'bg-orange-400', ring: 'ring-orange-300', text: 'text-orange-900', light: 'bg-orange-50' },
  { bg: 'bg-pink-400', ring: 'ring-pink-300', text: 'text-pink-900', light: 'bg-pink-50' },
  { bg: 'bg-teal-400', ring: 'ring-teal-300', text: 'text-teal-900', light: 'bg-teal-50' },
];

function getColors(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'] });
}

// PIN dialog
function PinDialog({
  childName,
  onUnlock,
  onCancel,
}: {
  childName: string;
  onUnlock: () => void;
  onCancel: () => void;
}) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);

  function handleDigit(d: string) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError(false);
    if (next.length === 4) {
      // Check PIN stored in localStorage by parent
      const stored = localStorage.getItem(`bt_pin_${childName.toLowerCase()}`);
      if (!stored || stored === next) {
        onUnlock();
      } else {
        setTimeout(() => { setDigits(''); setError(true); }, 300);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock size={24} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Hi, {childName}!</h2>
        <p className="text-sm text-gray-500 mb-5">Enter your PIN to continue</p>

        {/* Dots */}
        <div className="flex justify-center gap-3 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < digits.length ? 'bg-green-500 scale-110' : 'bg-gray-200'
              } ${error ? 'bg-red-400' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
            <button
              key={k}
              onClick={() => {
                if (k === '⌫') setDigits((d) => d.slice(0, -1));
                else if (k) handleDigit(k);
              }}
              disabled={!k}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all ${
                k ? 'bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-900' : ''
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">Wrong PIN, try again</p>}
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600">
          Back
        </button>
      </div>
    </div>
  );
}

// Child picker screen
function ChildPicker({ children, onSelect }: { children: Child[]; onSelect: (c: Child) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌟</div>
        <h1 className="text-3xl font-bold text-gray-900">Who's doing tasks today?</h1>
        <p className="text-gray-500 mt-2">Tap your name to get started!</p>
      </div>

      {children.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No children set up yet.</p>
          <p className="text-sm mt-1">Ask a parent to add your profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full max-w-lg">
          {children.map((child) => {
            const colors = getColors(child.name);
            return (
              <button
                key={child.id}
                onClick={() => onSelect(child)}
                className={`${colors.light} border-2 ${colors.ring.replace('ring', 'border')} rounded-3xl p-6 flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-transform shadow-sm`}
              >
                <div className={`w-20 h-20 rounded-full ${colors.bg} flex items-center justify-center text-4xl font-bold text-white shadow-md`}>
                  {child.name[0].toUpperCase()}
                </div>
                <span className={`text-lg font-bold ${colors.text}`}>{child.name}</span>
                <div className="flex items-center gap-1 text-yellow-500 font-semibold text-sm">
                  <Star size={14} fill="currentColor" />
                  {child.points} pts
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Main child view
function ChildView({
  child,
  tasks,
  rewards,
  onBack,
  onTaskToggle,
  onGenerateMissions,
  generating,
  taskError,
}: {
  child: Child;
  tasks: Task[];
  rewards: Reward[];
  onBack: () => void;
  onTaskToggle: (task: Task) => void;
  onGenerateMissions: () => void;
  generating: boolean;
  taskError: string | null;
}) {
  const colors = getColors(child.name);
  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const allDone = tasks.length > 0 && pending.length === 0;

  // Next reward the child can almost afford
  const sortedRewards = [...rewards].sort((a, b) => a.cost - b.cost);
  const nextReward = sortedRewards.find((r) => r.cost > child.points) || null;
  const affordableRewards = sortedRewards.filter((r) => r.cost <= child.points);
  const progress = nextReward ? Math.min(100, Math.round((child.points / nextReward.cost) * 100)) : 100;

  const encouragements = ['Amazing work!', 'You\'re on fire!', 'Keep it up!', 'Super star!', 'Crushing it!'];
  const encouragement = encouragements[done.length % encouragements.length];

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className={`${colors.bg} pt-safe pb-6 px-6`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 mt-4">
          <ChevronLeft size={18} /> Switch
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
            {child.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{child.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Star size={14} fill="white" className="text-white" />
                <span className="text-white font-bold text-sm">{child.points} points</span>
              </div>
              {done.length > 0 && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                  <Flame size={14} className="text-white" />
                  <span className="text-white text-sm font-medium">{encouragement}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-6 max-w-lg mx-auto">
        {/* Next reward progress */}
        {nextReward && (
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-purple-500" />
                <span className="font-semibold text-gray-800 text-sm">Next reward</span>
              </div>
              <span className="text-xs text-gray-500">{child.points} / {nextReward.cost} pts</span>
            </div>
            <p className="font-bold text-gray-900 mb-3">{nextReward.title}</p>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              {nextReward.cost - child.points} pts to go!
            </p>
          </div>
        )}

        {affordableRewards.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-green-600" />
              <span className="font-semibold text-green-800 text-sm">Ready to redeem!</span>
            </div>
            <div className="space-y-1">
              {affordableRewards.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="text-green-900 font-medium">{r.title}</span>
                  <span className="text-green-600 font-semibold">{r.cost} pts</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-2">Ask a parent to redeem these for you!</p>
          </div>
        )}

        {/* Tasks to do */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {allDone ? '🎉 All done for today!' : tasks.length === 0 ? 'Your Missions' : `Missions to do (${pending.length})`}
          </h2>

          {/* All done — celebrate + offer new missions */}
          {allDone && (
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-2xl p-6 text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-bold text-green-800 mb-1">You finished all your missions!</p>
              <p className="text-sm text-green-600 mb-4">Ready for your next challenge?</p>
              <button
                onClick={onGenerateMissions}
                disabled={generating}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {generating ? '✨ Getting new missions…' : '✨ Get New Missions!'}
              </button>
            </div>
          )}

          {/* No tasks at all — auto-generate or prompt */}
          {tasks.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              {generating ? (
                <div className="space-y-2 animate-pulse">
                  <div className="text-3xl">✨</div>
                  <p className="text-gray-500 text-sm">Getting your missions ready…</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 text-sm mb-3">No missions yet!</p>
                  <button
                    onClick={onGenerateMissions}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all"
                  >
                    ✨ Generate My Missions!
                  </button>
                </>
              )}
            </div>
          )}
          {taskError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
              {taskError}
            </div>
          )}
          <div className="space-y-3">
            {pending.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskToggle(task)}
                className="w-full bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 text-left hover:border-green-300 hover:shadow-md active:scale-[0.98] transition-all group"
              >
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-green-400 flex items-center justify-center shrink-0 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-green-100 transition-colors" />
                </div>
                <span className="text-gray-900 font-medium text-base">{task.title}</span>
                <span className="ml-auto text-green-500 font-bold text-sm whitespace-nowrap">+10 pts</span>
              </button>
            ))}
          </div>
        </div>

        {/* Completed tasks */}
        {done.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-400 mb-2">Completed ✓</h2>
            <div className="space-y-2">
              {done.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskToggle(task)}
                  className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-4 text-left opacity-70 hover:opacity-100 active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                  <span className="text-gray-500 font-medium line-through text-base">{task.title}</span>
                  <span className="ml-auto text-xs text-gray-400">Undo</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChildPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selected, setSelected] = useState<Child | null>(null);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    const [{ data: childData }, { data: taskData }, { data: rewardData }] = await Promise.all([
      supabase.from('children').select('id, name, points').order('created_at', { ascending: true }),
      supabase.from('tasks').select('id, child_id, title, completed'),
      supabase.from('rewards').select('id, title, cost').order('cost', { ascending: true }),
    ]);
    setChildren(childData || []);
    setTasks(taskData || []);
    setRewards(rewardData || []);
    setLoading(false);

    // Update selected child's points if viewing
    if (selected) {
      const fresh = childData?.find((c) => c.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [selected]);

  useEffect(() => {
    fetchData();
  }, []);

  async function handleGenerateMissions() {
    if (!selected || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selected.id, childName: selected.name, childAge: null, count: 5 }),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Mission generation failed:', err);
    }
    setGenerating(false);
  }

  // Auto-generate missions when a child is selected and has no tasks
  useEffect(() => {
    if (!selected) return;
    const childTasks = tasks.filter((t) => t.child_id === selected.id);
    if (childTasks.length === 0 && !generating && !loading) {
      handleGenerateMissions();
    }
  }, [selected, tasks, loading]);

  function handleSelect(child: Child) {
    // Check if parent has set a PIN for this child
    const pin = localStorage.getItem(`bt_pin_${child.name.toLowerCase()}`);
    if (pin) {
      setPendingChild(child);
    } else {
      setSelected(child);
    }
  }

  async function handleTaskToggle(task: Task) {
    if (!selected) return;

    const { error: taskError } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (taskError) {
      console.error('[ChildView] task update failed:', taskError.message);
      setTaskError('Oops! Could not save that. Try again.');
      return;
    }

    const pointsChange = task.completed ? -10 : +10;
    const reason = task.completed ? `Undid task: ${task.title}` : `Completed task: ${task.title}`;

    const { error: pointsError } = await supabase.rpc('increment_points', {
      child_id: selected.id,
      points_change: pointsChange,
      reason,
    });

    if (pointsError) {
      console.error('[ChildView] increment_points failed:', pointsError.message);
      setTaskError('Points could not be updated. Ask a parent.');
      return;
    }

    if (!task.completed) {
      fireConfetti();
    }

    setTaskError(null);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t));
    setSelected((prev) => prev ? { ...prev, points: prev.points + pointsChange } : prev);
    setChildren((prev) => prev.map((c) => c.id === selected.id ? { ...c, points: c.points + pointsChange } : c));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3 animate-pulse">
          <div className="text-5xl">🌟</div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  const childTasks = selected ? tasks.filter((t) => t.child_id === selected.id) : [];

  return (
    <>
      {pendingChild && (
        <PinDialog
          childName={pendingChild.name}
          onUnlock={() => { setSelected(pendingChild); setPendingChild(null); }}
          onCancel={() => setPendingChild(null)}
        />
      )}

      {selected ? (
        <ChildView
          child={selected}
          tasks={childTasks}
          rewards={rewards}
          onBack={() => setSelected(null)}
          onTaskToggle={handleTaskToggle}
          onGenerateMissions={handleGenerateMissions}
          generating={generating}
          taskError={taskError}
        />
      ) : (
        <ChildPicker children={children} onSelect={handleSelect} />
      )}
    </>
  );
}
