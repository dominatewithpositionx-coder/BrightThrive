'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Star, CheckCircle, Gift, ChevronLeft, Flame, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { type MoodKey, MOODS, EI_RESPONSES } from '@/lib/mood';
import {
  trackMoodSelected,
  trackMissionGenerated,
  trackMissionCompleted,
} from '@/lib/analytics';

type Child   = { id: string; name: string; age?: number | null; points: number };
type Mission = { id: string; child_id: string; title: string; is_completed: boolean };
type Reward  = { id: string; title: string; coin_cost: number };

const AVATAR_COLORS = [
  { bg: 'bg-green-400',  ring: 'ring-green-300',  text: 'text-green-900',  light: 'bg-green-50'  },
  { bg: 'bg-blue-400',   ring: 'ring-blue-300',   text: 'text-blue-900',   light: 'bg-blue-50'   },
  { bg: 'bg-purple-400', ring: 'ring-purple-300', text: 'text-purple-900', light: 'bg-purple-50' },
  { bg: 'bg-orange-400', ring: 'ring-orange-300', text: 'text-orange-900', light: 'bg-orange-50' },
  { bg: 'bg-pink-400',   ring: 'ring-pink-300',   text: 'text-pink-900',   light: 'bg-pink-50'   },
  { bg: 'bg-teal-400',   ring: 'ring-teal-300',   text: 'text-teal-900',   light: 'bg-teal-50'   },
];
function getColors(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'] });
}

// ── PinDialog ─────────────────────────────────────────────────────────────────

function PinDialog({ childName, onUnlock, onCancel }: { childName: string; onUnlock: () => void; onCancel: () => void }) {
  const [digits, setDigits] = useState('');
  const [error, setError]   = useState(false);

  function handleDigit(d: string) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError(false);
    if (next.length === 4) {
      const stored = localStorage.getItem(`bt_pin_${childName.toLowerCase()}`);
      if (!stored || stored === next) { onUnlock(); }
      else { setTimeout(() => { setDigits(''); setError(true); }, 300); }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-center animate-fade-in">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock size={24} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-navy mb-1">Hi, {childName}!</h2>
        <p className="text-sm text-gray-500 mb-5">Enter your PIN to continue</p>
        <div className="flex justify-center gap-3 mb-5">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${error ? 'bg-red-400' : i < digits.length ? 'bg-green-500 scale-110' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
            <button
              key={k}
              onClick={() => { if (k === '⌫') setDigits((d) => d.slice(0,-1)); else if (k) handleDigit(k); }}
              disabled={!k}
              aria-label={k === '⌫' ? 'Delete' : k || undefined}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all ${k ? 'bg-gray-100 hover:bg-gray-200 active:scale-95 text-navy' : ''}`}
            >
              {k}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mb-3 animate-fade-in">Wrong PIN, try again</p>}
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Back</button>
      </div>
    </div>
  );
}

// ── ChildPicker ───────────────────────────────────────────────────────────────

function ChildPicker({ children, onSelect }: { children: Child[]; onSelect: (c: Child) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌟</div>
        <h1 className="text-3xl font-bold text-navy">Who&apos;s doing tasks today?</h1>
        <p className="text-gray-500 mt-2 text-base">Tap your name to get started!</p>
      </div>
      {children.length === 0 ? (
        <div className="text-center text-gray-500 space-y-1">
          <p className="font-medium">No children set up yet.</p>
          <p className="text-sm">Ask a parent to add your profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full max-w-lg">
          {children.map((child) => {
            const colors = getColors(child.name);
            return (
              <button
                key={child.id}
                onClick={() => onSelect(child)}
                aria-label={`Select ${child.name}`}
                className={`${colors.light} border-2 ${colors.ring.replace('ring','border')} rounded-3xl p-6 flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-transform duration-150 shadow-sm`}
              >
                <div className={`w-20 h-20 rounded-full ${colors.bg} flex items-center justify-center text-4xl font-bold text-white shadow-md`}>
                  {child.name[0].toUpperCase()}
                </div>
                <span className={`text-lg font-bold ${colors.text}`}>{child.name}</span>
                <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                  <Star size={14} fill="currentColor" />{child.points} pts
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MoodCheckIn ───────────────────────────────────────────────────────────────

function MoodCheckIn({ childName, onSelect }: { childName: string; onSelect: (mood: MoodKey) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-10 max-w-xs">
        <p className="text-gray-400 text-sm font-medium mb-2">Hi, {childName}! 👋</p>
        <h1 className="text-2xl font-bold text-navy leading-snug">How are you feeling right now?</h1>
        <p className="text-gray-500 text-sm mt-2">Tap the one that feels most like you.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {MOODS.map((mood) => (
          <button
            key={mood.key}
            onClick={() => onSelect(mood.key)}
            aria-label={`I'm feeling ${mood.label}`}
            className={`${mood.cardBg} border-2 ${mood.cardBorder} rounded-3xl p-5 flex flex-col items-center gap-2 active:scale-95 hover:scale-[1.03] transition-all duration-150 shadow-sm hover:shadow-lg`}
          >
            <span className="text-5xl leading-none">{mood.emoji}</span>
            <span className="text-sm font-semibold text-gray-700">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MoodResponse ──────────────────────────────────────────────────────────────

function MoodResponse({ mood, onContinue }: { mood: MoodKey; onContinue: () => void }) {
  const r     = EI_RESPONSES[mood];
  const emoji = MOODS.find(m => m.key === mood)?.emoji ?? '😊';
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-br ${r.bg} animate-fade-in`}>
      <div className="w-full max-w-sm text-center">
        {/* Emoji */}
        <div className="text-8xl mb-8 leading-none">{emoji}</div>

        {/* EI copy */}
        <div className="space-y-3 mb-10">
          <h2 className="text-2xl font-bold text-navy leading-snug">{r.headline}</h2>
          <p className="text-gray-600 text-base leading-relaxed max-w-xs mx-auto">{r.message}</p>
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl text-base font-semibold active:scale-[0.98] hover:bg-gray-800 transition-all duration-150 shadow-lg"
        >
          {r.cta}
        </button>

        {/* Subtle label */}
        <p className="text-xs text-gray-400 mt-5">Your missions are ready for you</p>
      </div>
    </div>
  );
}

// ── ChildView (missions) ──────────────────────────────────────────────────────

function ChildView({ child, missions, rewards, onBack, onMissionToggle, onGenerateMissions, generating, missionError, missionSuccess }: {
  child: Child; missions: Mission[]; rewards: Reward[];
  onBack: () => void; onMissionToggle: (mission: Mission) => void;
  onGenerateMissions: () => void; generating: boolean; missionError: string | null; missionSuccess: string | null;
}) {
  const colors = getColors(child.name);
  const pending = missions.filter((m) => !m.is_completed);
  const done    = missions.filter((m) => m.is_completed);
  const allDone = missions.length > 0 && pending.length === 0;

  const sortedRewards = [...rewards].sort((a, b) => a.coin_cost - b.coin_cost);
  const nextReward = sortedRewards.find((r) => r.coin_cost > child.points) || null;
  const affordableRewards = sortedRewards.filter((r) => r.coin_cost <= child.points);
  const progress = nextReward ? Math.min(100, Math.round((child.points / nextReward.coin_cost) * 100)) : 100;

  const encouragements = ['Amazing work!', "You're on fire!", 'Keep it up!', 'Super star!', 'Crushing it!'];
  const encouragement  = encouragements[done.length % encouragements.length];

  return (
    <div className="min-h-screen pb-10 animate-fade-in">
      {/* Header band */}
      <div className={`${colors.bg} pt-safe pb-8 px-5`}>
        <button
          onClick={onBack}
          aria-label="Switch child"
          className="flex items-center gap-1 min-h-[44px] text-white/80 hover:text-white text-sm mb-3 mt-2 transition-colors"
        >
          <ChevronLeft size={18} /> Switch child
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-white/30">
            {child.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{child.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Star size={13} fill="white" className="text-white" />
                <span className="text-white font-bold text-sm">{child.points} pts</span>
              </div>
              {done.length > 0 && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                  <Flame size={13} className="text-white" />
                  <span className="text-white text-sm font-medium">{encouragement}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-5 max-w-lg mx-auto">

        {/* Next reward progress */}
        {nextReward && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-purple-500" />
                <span className="font-semibold text-gray-700 text-sm">Next reward</span>
              </div>
              <span className="text-xs text-gray-400">{child.points} / {nextReward.coin_cost} pts</span>
            </div>
            <p className="font-bold text-navy mb-3">{nextReward.title}</p>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">{nextReward.coin_cost - child.points} pts to go!</p>
          </div>
        )}

        {/* Ready to redeem banner */}
        {affordableRewards.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-green-600" />
              <span className="font-semibold text-green-800 text-sm">Ready to redeem!</span>
            </div>
            <div className="space-y-1.5">
              {affordableRewards.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="text-green-900 font-medium">{r.title}</span>
                  <span className="text-green-600 font-semibold">{r.coin_cost} pts</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-2 font-medium">Ask a parent to redeem! 🎁</p>
          </div>
        )}

        {/* Missions section */}
        <div>
          <h2 className="text-lg font-bold text-navy mb-3">
            {allDone
              ? '🎉 All done for today!'
              : missions.length === 0
                ? 'Your Missions'
                : `Missions (${pending.length} left)`}
          </h2>

          {/* All done celebration */}
          {allDone && (
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-2xl p-6 text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-bold text-green-800 mb-1">You finished all your missions!</p>
              <p className="text-sm text-green-600 mb-4">Ready for your next challenge?</p>
              <button
                onClick={onGenerateMissions}
                disabled={generating}
                aria-label="Generate new missions"
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {generating ? '✨ Getting new missions…' : '✨ New Missions!'}
              </button>
            </div>
          )}

          {/* Empty / loading state */}
          {missions.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              {generating ? (
                <div className="space-y-4">
                  <div className="text-3xl animate-bounce">✨</div>
                  <p className="text-gray-500 text-sm font-medium">Creating your missions…</p>
                  <div className="flex justify-center gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-3">🎯</div>
                  <p className="text-gray-500 text-sm mb-4 font-medium">No missions yet — tap below to start!</p>
                  <button
                    onClick={onGenerateMissions}
                    aria-label="Generate missions"
                    className="min-h-[44px] bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all"
                  >
                    ✨ Get My Missions
                  </button>
                </>
              )}
            </div>
          )}

          {missionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center mt-3">
              {missionError}
            </div>
          )}

          {missionSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center mt-3 animate-fade-in">
              {missionSuccess}
            </div>
          )}

          {/* Pending missions */}
          <div className="space-y-3 mt-3">
            {pending.map((mission) => (
              <button
                key={mission.id}
                onClick={() => onMissionToggle(mission)}
                aria-label={`Mark "${mission.title}" as complete`}
                className="w-full bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 text-left hover:border-green-300 hover:shadow-md active:scale-[0.98] transition-all duration-150 group"
              >
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-green-400 flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                  <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-green-100 transition-colors" />
                </div>
                <span className="text-navy font-medium text-base flex-1">{mission.title}</span>
                <span className="text-green-500 font-bold text-sm whitespace-nowrap">+10 pts</span>
              </button>
            ))}
          </div>
        </div>

        {/* Completed missions */}
        {done.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed ✓</h2>
            <div className="space-y-2">
              {done.map((mission) => (
                <button
                  key={mission.id}
                  onClick={() => onMissionToggle(mission)}
                  aria-label={`Undo "${mission.title}"`}
                  className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-4 text-left hover:opacity-100 opacity-70 active:scale-[0.98] transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                  <span className="text-gray-500 font-medium line-through text-base flex-1">{mission.title}</span>
                  <span className="text-xs text-gray-400">Undo</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

type AppPhase = 'picker' | 'mood-check' | 'mood-response' | 'missions';

export default function ChildPage() {
  const [children, setChildren]     = useState<Child[]>([]);
  const [missions, setMissions]     = useState<Mission[]>([]);
  const [rewards, setRewards]       = useState<Reward[]>([]);
  const [selected, setSelected]     = useState<Child | null>(null);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [phase, setPhase]           = useState<AppPhase>('picker');
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [missionSuccess, setMissionSuccess] = useState<string | null>(null);

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    const [
      { data: childData }, { data: walletData },
      { data: missionData }, { data: rewardData },
    ] = await Promise.all([
      supabase.from('children').select('id, name, age').order('created_at', { ascending: true }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('missions').select('id, child_id, title, is_completed'),
      supabase.from('rewards').select('id, title, coin_cost').order('coin_cost', { ascending: true }),
    ]);
    const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
    const kids = (childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 }));
    setChildren(kids);
    setMissions(missionData || []);
    setRewards(rewardData || []);
    setLoading(false);
    if (selected) {
      const fresh = kids.find((c) => c.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [selected]);

  useEffect(() => { fetchData(); }, []);

  async function handleGenerateMissions() {
    if (!selected || generating) return;
    setGenerating(true);
    setMissionError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/generate-missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ childId: selected.id, childAge: selected.age ?? null, count: 6, mood: selectedMood }),
      });
      if (res.ok) {
        trackMissionGenerated({
          child_id: selected.id,
          mood: selectedMood,
          weather_available: true,
          count: 6,
        });
        await fetchData();
        setMissionSuccess('New missions ready! 🎉');
        setTimeout(() => setMissionSuccess(null), 3000);
      } else if (res.status === 429) {
        setMissionError('Just a moment! Wait a few seconds before generating new missions.');
      } else {
        setMissionError('Could not load missions. Try again!');
      }
    } catch {
      setMissionError('Could not load missions. Try again!');
    }
    setGenerating(false);
  }

  // Auto-generate if no missions when entering missions phase
  useEffect(() => {
    if (!selected || phase !== 'missions') return;
    const childMissions = missions.filter((m) => m.child_id === selected.id);
    if (childMissions.length === 0 && !generating && !loading) {
      handleGenerateMissions();
    }
  }, [selected, missions, loading, phase]);

  function handleSelect(child: Child) {
    const pin = localStorage.getItem(`bt_pin_${child.name.toLowerCase()}`);
    if (pin) { setPendingChild(child); }
    else { setSelected(child); setPhase('mood-check'); }
  }

  function handleMoodSelect(mood: MoodKey) {
    setSelectedMood(mood);
    if (selected) trackMoodSelected({ mood, child_id: selected.id });
    setPhase('mood-response');
  }

  function handleBack() {
    setSelected(null);
    setSelectedMood(null);
    setPhase('picker');
  }

  async function handleMissionToggle(mission: Mission) {
    if (!selected) return;
    const nowCompleted = !mission.is_completed;
    const { error: missionErr } = await supabase
      .from('missions')
      .update({ is_completed: nowCompleted, status: nowCompleted ? 'completed' : 'active' })
      .eq('id', mission.id);
    if (missionErr) { setMissionError('Oops! Could not save that. Try again.'); return; }

    const pointsChange = mission.is_completed ? -10 : +10;
    const { error: coinsError } = await supabase.rpc('add_coins', {
      p_child_id: selected.id,
      p_amount: pointsChange,
      p_type: pointsChange > 0 ? 'earned' : 'deducted',
      p_description: mission.is_completed ? `Undid task: ${mission.title}` : `Completed task: ${mission.title}`,
      p_mission_id: mission.id,
    });
    if (coinsError) { setMissionError('Points could not be updated. Ask a parent.'); return; }

    if (nowCompleted) {
      fireConfetti();
      trackMissionCompleted({ child_id: selected.id, mission_id: mission.id, title: mission.title });
    }

    setMissionError(null);
    setMissions((prev) => prev.map((m) => m.id === mission.id ? { ...m, is_completed: nowCompleted } : m));
    const newPoints = selected.points + pointsChange;
    setSelected((prev) => prev ? { ...prev, points: newPoints } : prev);
    setChildren((prev) => prev.map((c) => c.id === selected.id ? { ...c, points: newPoints } : c));
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="text-5xl">🌟</div>
          <div className="h-4 bg-gray-200 rounded-full w-32 mx-auto" />
          <div className="h-3 bg-gray-100 rounded-full w-20 mx-auto" />
        </div>
      </div>
    );
  }

  const childMissions = selected ? missions.filter((m) => m.child_id === selected.id) : [];

  return (
    <>
      {pendingChild && (
        <PinDialog
          childName={pendingChild.name}
          onUnlock={() => { setSelected(pendingChild); setPendingChild(null); setPhase('mood-check'); }}
          onCancel={() => setPendingChild(null)}
        />
      )}

      {phase === 'picker' && (
        <ChildPicker children={children} onSelect={handleSelect} />
      )}

      {phase === 'mood-check' && selected && (
        <MoodCheckIn childName={selected.name} onSelect={handleMoodSelect} />
      )}

      {phase === 'mood-response' && selectedMood && (
        <MoodResponse mood={selectedMood} onContinue={() => setPhase('missions')} />
      )}

      {phase === 'missions' && selected && (
        <ChildView
          child={selected}
          missions={childMissions}
          rewards={rewards}
          onBack={handleBack}
          onMissionToggle={handleMissionToggle}
          onGenerateMissions={handleGenerateMissions}
          generating={generating}
          missionError={missionError}
          missionSuccess={missionSuccess}
        />
      )}
    </>
  );
}
