'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Star, CheckCircle, Gift, ChevronLeft, Flame, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

type Child = { id: string; name: string; points: number };
type Mission = { id: string; child_id: string; title: string; is_completed: boolean };
type Reward = { id: string; title: string; coin_cost: number };
type MoodKey = 'Happy' | 'Calm' | 'Energetic' | 'Tired' | 'Sad' | 'Frustrated';

const AVATAR_COLORS = [
  { bg: 'bg-green-400', ring: 'ring-green-300', text: 'text-green-900', light: 'bg-green-50' },
  { bg: 'bg-blue-400', ring: 'ring-blue-300', text: 'text-blue-900', light: 'bg-blue-50' },
  { bg: 'bg-purple-400', ring: 'ring-purple-300', text: 'text-purple-900', light: 'bg-purple-50' },
  { bg: 'bg-orange-400', ring: 'ring-orange-300', text: 'text-orange-900', light: 'bg-orange-50' },
  { bg: 'bg-pink-400', ring: 'ring-pink-300', text: 'text-pink-900', light: 'bg-pink-50' },
  { bg: 'bg-teal-400', ring: 'ring-teal-300', text: 'text-teal-900', light: 'bg-teal-50' },
];

const MOODS: { key: MoodKey; emoji: string; label: string; cardBg: string; cardBorder: string }[] = [
  { key: 'Happy',      emoji: '😊', label: 'Happy',      cardBg: 'bg-amber-50',  cardBorder: 'border-amber-200' },
  { key: 'Calm',       emoji: '😌', label: 'Calm',       cardBg: 'bg-sky-50',    cardBorder: 'border-sky-200' },
  { key: 'Energetic',  emoji: '⚡', label: 'Energetic',  cardBg: 'bg-orange-50', cardBorder: 'border-orange-200' },
  { key: 'Tired',      emoji: '😴', label: 'Tired',      cardBg: 'bg-purple-50', cardBorder: 'border-purple-200' },
  { key: 'Sad',        emoji: '😔', label: 'Sad',        cardBg: 'bg-blue-50',   cardBorder: 'border-blue-200' },
  { key: 'Frustrated', emoji: '😠', label: 'Frustrated', cardBg: 'bg-rose-50',   cardBorder: 'border-rose-200' },
];

const EI_RESPONSES: Record<MoodKey, { headline: string; message: string; cta: string; bg: string }> = {
  Happy:      { headline: "I love seeing that smile!", message: "Let's use this amazing energy to do something awesome today.", cta: "Let's go! ✨", bg: 'from-amber-50 to-yellow-50' },
  Calm:       { headline: "You seem peaceful right now.", message: "That's a wonderful feeling. Let's keep the good vibes going.", cta: "Ready! 🌿", bg: 'from-sky-50 to-blue-50' },
  Energetic:  { headline: "You've got so much energy today!", message: "Let's put it to great use. Big things happen on days like this.", cta: "Let's do this! ⚡", bg: 'from-orange-50 to-amber-50' },
  Tired:      { headline: "Sounds like your body needs a little kindness today.", message: "That's completely okay. Let's keep things gentle and simple — small steps still count.", cta: "Okay, let's try 💙", bg: 'from-purple-50 to-indigo-50' },
  Sad:        { headline: "It's okay to have sad days.", message: "You don't have to fix everything right now. Let's do one small thing together — you've got this.", cta: "I'm ready 💛", bg: 'from-blue-50 to-sky-50' },
  Frustrated: { headline: "That's okay — everybody feels frustrated sometimes.", message: "Take a deep breath. Let's do something small to help you reset. You're not alone.", cta: "Let's reset 🤝", bg: 'from-rose-50 to-pink-50' },
};

function getColors(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'] });
}

function PinDialog({ childName, onUnlock, onCancel }: { childName: string; onUnlock: () => void; onCancel: () => void }) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);

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
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock size={24} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Hi, {childName}!</h2>
        <p className="text-sm text-gray-500 mb-5">Enter your PIN to continue</p>
        <div className="flex justify-center gap-3 mb-5">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < digits.length ? 'bg-green-500 scale-110' : 'bg-gray-200'} ${error ? 'bg-red-400' : ''}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
            <button key={k} onClick={() => { if (k === '⌫') setDigits((d) => d.slice(0,-1)); else if (k) handleDigit(k); }} disabled={!k}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all ${k ? 'bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-900' : ''}`}>
              {k}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mb-3">Wrong PIN, try again</p>}
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600">Back</button>
      </div>
    </div>
  );
}

function ChildPicker({ children, onSelect }: { children: Child[]; onSelect: (c: Child) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌟</div>
        <h1 className="text-3xl font-bold text-gray-900">Who's doing tasks today?</h1>
        <p className="text-gray-500 mt-2">Tap your name to get started!</p>
      </div>
      {children.length === 0 ? (
        <div className="text-center text-gray-500"><p>No children set up yet.</p><p className="text-sm mt-1">Ask a parent to add your profile.</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full max-w-lg">
          {children.map((child) => {
            const colors = getColors(child.name);
            return (
              <button key={child.id} onClick={() => onSelect(child)}
                className={`${colors.light} border-2 ${colors.ring.replace('ring','border')} rounded-3xl p-6 flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-transform shadow-sm`}>
                <div className={`w-20 h-20 rounded-full ${colors.bg} flex items-center justify-center text-4xl font-bold text-white shadow-md`}>{child.name[0].toUpperCase()}</div>
                <span className={`text-lg font-bold ${colors.text}`}>{child.name}</span>
                <div className="flex items-center gap-1 text-yellow-500 font-semibold text-sm"><Star size={14} fill="currentColor" />{child.points} pts</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MoodCheckIn({ childName, onSelect }: { childName: string; onSelect: (mood: MoodKey) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8 max-w-xs">
        <p className="text-gray-400 text-sm font-medium mb-2">Hi, {childName}! 👋</p>
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">How are you feeling right now?</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {MOODS.map((mood) => (
          <button key={mood.key} onClick={() => onSelect(mood.key)}
            className={`${mood.cardBg} border-2 ${mood.cardBorder} rounded-3xl p-5 flex flex-col items-center gap-2 active:scale-95 hover:scale-105 transition-all duration-150 shadow-sm hover:shadow-lg`}>
            <span className="text-5xl leading-none">{mood.emoji}</span>
            <span className="text-sm font-semibold text-gray-700">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodResponse({ mood, onContinue }: { mood: MoodKey; onContinue: () => void }) {
  const r = EI_RESPONSES[mood];
  const emoji = MOODS.find(m => m.key === mood)?.emoji ?? '😊';
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br ${r.bg}`}>
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="text-7xl">{emoji}</div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 leading-snug">{r.headline}</h2>
          <p className="text-gray-600 text-base leading-relaxed">{r.message}</p>
        </div>
        <button onClick={onContinue}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl text-base font-semibold active:scale-95 hover:bg-gray-800 transition-all duration-150 shadow-lg">
          {r.cta}
        </button>
      </div>
    </div>
  );
}

function ChildView({ child, missions, rewards, onBack, onMissionToggle, onGenerateMissions, generating, missionError }: {
  child: Child; missions: Mission[]; rewards: Reward[];
  onBack: () => void; onMissionToggle: (mission: Mission) => void;
  onGenerateMissions: () => void; generating: boolean; missionError: string | null;
}) {
  const colors = getColors(child.name);
  const pending = missions.filter((m) => !m.is_completed);
  const done = missions.filter((m) => m.is_completed);
  const allDone = missions.length > 0 && pending.length === 0;
  const sortedRewards = [...rewards].sort((a, b) => a.coin_cost - b.coin_cost);
  const nextReward = sortedRewards.find((r) => r.coin_cost > child.points) || null;
  const affordableRewards = sortedRewards.filter((r) => r.coin_cost <= child.points);
  const progress = nextReward ? Math.min(100, Math.round((child.points / nextReward.coin_cost) * 100)) : 100;
  const encouragements = ['Amazing work!', "You're on fire!", 'Keep it up!', 'Super star!', 'Crushing it!'];
  const encouragement = encouragements[done.length % encouragements.length];

  return (
    <div className="min-h-screen pb-10">
      <div className={`${colors.bg} pt-safe pb-6 px-6`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 mt-4">
          <ChevronLeft size={18} /> Switch
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">{child.name[0].toUpperCase()}</div>
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
        {nextReward && (
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Gift size={18} className="text-purple-500" /><span className="font-semibold text-gray-800 text-sm">Next reward</span></div>
              <span className="text-xs text-gray-500">{child.points} / {nextReward.coin_cost} pts</span>
            </div>
            <p className="font-bold text-gray-900 mb-3">{nextReward.title}</p>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">{nextReward.coin_cost - child.points} pts to go!</p>
          </div>
        )}

        {affordableRewards.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><Gift size={16} className="text-green-600" /><span className="font-semibold text-green-800 text-sm">Ready to redeem!</span></div>
            <div className="space-y-1">
              {affordableRewards.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="text-green-900 font-medium">{r.title}</span>
                  <span className="text-green-600 font-semibold">{r.coin_cost} pts</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-2">Ask a parent to redeem these for you!</p>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {allDone ? '🎉 All done for today!' : missions.length === 0 ? 'Your Missions' : `Missions to do (${pending.length})`}
          </h2>

          {allDone && (
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-2xl p-6 text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-bold text-green-800 mb-1">You finished all your missions!</p>
              <p className="text-sm text-green-600 mb-4">Ready for your next challenge?</p>
              <button onClick={onGenerateMissions} disabled={generating}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60">
                {generating ? '✨ Getting new missions…' : '✨ Get New Missions!'}
              </button>
            </div>
          )}

          {missions.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              {generating ? (
                <div className="space-y-2 animate-pulse"><div className="text-3xl">✨</div><p className="text-gray-500 text-sm">Getting your missions ready…</p></div>
              ) : (
                <>
                  <p className="text-gray-500 text-sm mb-3">No missions yet!</p>
                  <button onClick={onGenerateMissions} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all">
                    ✨ Generate My Missions!
                  </button>
                </>
              )}
            </div>
          )}

          {missionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">{missionError}</div>
          )}

          <div className="space-y-3">
            {pending.map((mission) => (
              <button key={mission.id} onClick={() => onMissionToggle(mission)}
                className="w-full bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 text-left hover:border-green-300 hover:shadow-md active:scale-[0.98] transition-all group">
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-green-400 flex items-center justify-center shrink-0 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-green-100 transition-colors" />
                </div>
                <span className="text-gray-900 font-medium text-base">{mission.title}</span>
                <span className="ml-auto text-green-500 font-bold text-sm whitespace-nowrap">+10 pts</span>
              </button>
            ))}
          </div>
        </div>

        {done.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-400 mb-2">Completed ✓</h2>
            <div className="space-y-2">
              {done.map((mission) => (
                <button key={mission.id} onClick={() => onMissionToggle(mission)}
                  className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-4 text-left opacity-70 hover:opacity-100 active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                  <span className="text-gray-500 font-medium line-through text-base">{mission.title}</span>
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

type AppPhase = 'picker' | 'mood-check' | 'mood-response' | 'missions';

export default function ChildPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selected, setSelected] = useState<Child | null>(null);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [phase, setPhase] = useState<AppPhase>('picker');
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    const [{ data: childData }, { data: walletData }, { data: missionData }, { data: rewardData }] = await Promise.all([
      supabase.from('children').select('id, name').order('created_at', { ascending: true }),
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
        body: JSON.stringify({ childId: selected.id, childName: selected.name, childAge: null, count: 5, mood: selectedMood }),
      });
      if (res.ok) await fetchData();
      else setMissionError('Could not load missions. Try again!');
    } catch {
      setMissionError('Could not load missions. Try again!');
    }
    setGenerating(false);
  }

  useEffect(() => {
    if (!selected || phase !== 'missions') return;
    const childMissions = missions.filter((m) => m.child_id === selected.id);
    if (childMissions.length === 0 && !generating && !loading) {
      handleGenerateMissions();
    }
  }, [selected, missions, loading, phase]);

  function handleSelect(child: Child) {
    const pin = localStorage.getItem(`bt_pin_${child.name.toLowerCase()}`);
    if (pin) {
      setPendingChild(child);
    } else {
      setSelected(child);
      setPhase('mood-check');
    }
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

    if (nowCompleted) fireConfetti();
    setMissionError(null);
    setMissions((prev) => prev.map((m) => m.id === mission.id ? { ...m, is_completed: nowCompleted } : m));
    const newPoints = selected.points + pointsChange;
    setSelected((prev) => prev ? { ...prev, points: newPoints } : prev);
    setChildren((prev) => prev.map((c) => c.id === selected.id ? { ...c, points: newPoints } : c));
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

      {phase === 'picker' && <ChildPicker children={children} onSelect={handleSelect} />}

      {phase === 'mood-check' && selected && (
        <MoodCheckIn childName={selected.name} onSelect={(mood) => { setSelectedMood(mood); setPhase('mood-response'); }} />
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
        />
      )}
    </>
  );
}
