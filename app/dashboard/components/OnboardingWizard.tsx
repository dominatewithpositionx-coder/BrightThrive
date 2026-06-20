'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, Users, ClipboardList, Gift, Sparkles } from 'lucide-react';

const supabase = getSupabase();

const TASK_TEMPLATES = [
  'Make your bed',
  'Do homework',
  'Read for 20 minutes',
  'Clean your room',
  'Help with dishes',
];

const REWARD_TEMPLATES = [
  { title: '30 min extra screen time', cost: 50 },
  { title: 'Choose dinner tonight', cost: 75 },
  { title: 'Movie night pick', cost: 100 },
  { title: 'Stay up 30 min later', cost: 100 },
  { title: 'Ice cream trip', cost: 150 },
];

type Props = {
  onComplete: () => void;
};

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Step 1 — child
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');

  // Step 2 — task
  const [taskTitle, setTaskTitle] = useState('');
  const [childId, setChildId] = useState('');

  // Step 3 — reward
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState<number | ''>('');

  async function saveChild() {
    if (!childName.trim()) return;
    setSaving(true);
    setSaveError('');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[OnboardingWizard] Auth error:', authError);
      setSaveError('Session expired. Please refresh and log in again.');
      setSaving(false);
      return;
    }

    console.log('[OnboardingWizard] Inserting child for user:', user.id);
    const { data, error } = await supabase
      .from('children')
      .insert([{
        name: childName.trim(),
        age: childAge ? Number(childAge) : null,
        points: 0,
        user_id: user.id,
      }])
      .select('id')
      .single();

    setSaving(false);

    if (error) {
      console.error('[OnboardingWizard] Insert error:', error.code, error.message, error.details);
      setSaveError(`Could not save child: ${error.message}`);
      return;
    }
    if (!data) {
      console.error('[OnboardingWizard] No data returned after insert');
      setSaveError('Something went wrong. Please try again.');
      return;
    }

    console.log('[OnboardingWizard] Child saved:', data.id);
    setChildId(data.id);
    setStep(2);
  }

  async function saveTask() {
    if (!taskTitle.trim() || !childId) { setStep(3); return; }
    setSaving(true);
    const { error } = await supabase.from('tasks').insert([{ child_id: childId, title: taskTitle.trim(), completed: false }]);
    if (error) console.error('[OnboardingWizard] saveTask error:', error.message);
    setSaving(false);
    setStep(3);
  }

  async function saveReward() {
    if (rewardTitle.trim() && rewardCost) {
      setSaving(true);
      await supabase.from('rewards').insert([{ title: rewardTitle.trim(), cost: Number(rewardCost) }]);
      setSaving(false);
    }
    setDone(true);
    setTimeout(onComplete, 2000);
  }

  const steps = [
    { n: 1, label: 'Add a child', icon: Users },
    { n: 2, label: 'First task', icon: ClipboardList },
    { n: 3, label: 'First reward', icon: Gift },
  ];

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
          <p className="text-gray-500">BrightThrive is ready for your family. Let's go!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to BrightThrive!</h2>
          <p className="text-sm text-gray-500">Let's get your family set up in 3 quick steps.</p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-5">
            {steps.map(({ n, label, icon: Icon }, i) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  step > n ? 'bg-green-500' : step === n ? 'bg-green-600' : 'bg-gray-200'
                }`}>
                  {step > n
                    ? <CheckCircle size={16} className="text-white" />
                    : <Icon size={14} className={step === n ? 'text-white' : 'text-gray-400'} />
                  }
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {i < steps.length - 1 && <div className={`h-px flex-1 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold mb-1 mt-4">Add your first child</h3>
                <p className="text-sm text-gray-500 mb-4">You can add more children later from the Children page.</p>
                <div className="space-y-3">
                  <input
                    className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Child's name (e.g. Emma)"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveChild()}
                    autoFocus
                  />
                  <input
                    className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Age (optional)"
                    type="number"
                    min="1"
                    max="18"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                  />
                </div>
                {saveError && <p className="mt-3 text-sm text-red-500">{saveError}</p>}
                <button
                  onClick={saveChild}
                  disabled={!childName.trim() || saving}
                  className="mt-5 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {saving ? 'Saving…' : <>Continue <ChevronRight size={18} /></>}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold mb-1 mt-4">Create {childName}'s first task</h3>
                <p className="text-sm text-gray-500 mb-4">Tasks earn 10 points when completed. Pick one or write your own.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TASK_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTaskTitle(t)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        taskTitle === t ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Or write your own task…"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={saveTask}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {saving ? 'Saving…' : <>Continue <ChevronRight size={18} /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold mb-1 mt-4">Set your first reward</h3>
                <p className="text-sm text-gray-500 mb-4">Rewards give kids something to work toward. Pick one or create your own.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {REWARD_TEMPLATES.map((r) => (
                    <button
                      key={r.title}
                      onClick={() => { setRewardTitle(r.title); setRewardCost(r.cost); }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        rewardTitle === r.title ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {r.title} <span className="opacity-70">· {r.cost}pts</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  <input
                    className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Or write your own reward…"
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                  />
                  <input
                    className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Points cost (e.g. 100)"
                    type="number"
                    value={rewardCost}
                    onChange={(e) => setRewardCost(Number(e.target.value))}
                  />
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => saveReward()}
                    className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={saveReward}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Finish Setup ✓'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
