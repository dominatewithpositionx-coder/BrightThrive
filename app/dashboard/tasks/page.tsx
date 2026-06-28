'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TASK_TEMPLATES = [
  'Make your bed',
  'Do homework',
  'Read for 20 minutes',
  'Clean your room',
  'Help with dishes',
  'Practice instrument',
  'Get ready on time',
  'Feed the pet',
];

type Mission = {
  id: string;
  child_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  points: number;
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function TasksPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const supabase = getSupabase();

  async function fetchData() {
    setFetching(true);
    const [{ data: childData }, { data: walletData }, { data: missionData }] = await Promise.all([
      supabase.from('children').select('id, name').order('created_at', { ascending: false }),
      supabase.from('bt_coin_wallet').select('child_id, balance'),
      supabase.from('missions').select('id, child_id, title, is_completed, created_at').order('created_at', { ascending: false }),
    ]);

    const walletMap = Object.fromEntries((walletData || []).map(w => [w.child_id, w.balance]));
    setChildren((childData || []).map(c => ({ ...c, points: walletMap[c.id] ?? 0 })));
    setMissions(missionData || []);
    setFetching(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!childId || !title) {
      toast.error('Please select a child and enter a task.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('missions').insert([{
      child_id: childId,
      title,
      category: 'general',
      screen_time_reward: 5,
      is_completed: false,
      mission_date: today(),
    }]);
    if (error) console.error('[dashboard/tasks] insert error:', error.message, error.code, error.details);

    if (error) toast.error('Error adding task: ' + error.message);
    else {
      toast.success('Task added!');
      setTitle('');
      fetchData();
    }
    setLoading(false);
  }

  async function toggleTaskCompletion(mission: Mission) {
    const nowCompleted = !mission.is_completed;
    const { error } = await supabase
      .from('missions')
      .update({ is_completed: nowCompleted })
      .eq('id', mission.id);

    if (error) { toast.error('Error updating task.'); return; }

    const pointsChange = mission.is_completed ? -10 : +10;
    const description = mission.is_completed
      ? `Undid task: ${mission.title}`
      : `Completed task: ${mission.title}`;

    const { error: coinError } = await supabase.rpc('add_coins', {
      p_child_id: mission.child_id,
      p_amount: pointsChange,
      p_type: pointsChange > 0 ? 'earned' : 'deducted',
      p_description: description,
      p_mission_id: mission.id,
    });

    if (coinError) {
      console.error('[dashboard/tasks] add_coins error:', coinError.message, coinError.code, coinError.details);
      toast.error('Error updating points.');
    } else {
      console.log(`[dashboard/tasks] add_coins ok: child=${mission.child_id} amount=${pointsChange}`);
      toast.success(mission.is_completed ? 'Task undone. Points removed.' : 'Task completed! +10 pts logged.');
    }

    fetchData();
  }

  async function deleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('missions').delete().eq('id', id);
    if (error) toast.error('Error deleting task.');
    else { toast.success('Task deleted.'); fetchData(); }
  }


if (fetching) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-48 bg-gray-200 rounded-xl max-w-md" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Parent Tasks</h1>
      <p className="text-sm text-gray-500 mb-6">Add your own custom tasks. AI-generated missions are created from the Dashboard.</p>

      {/* Note: AI mission generation is handled from the main Dashboard */}
      {children.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 max-w-md mb-6 flex items-center gap-3">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">AI missions are created from the Dashboard</p>
            <p className="text-xs text-blue-700 mt-0.5">Use the <a href="/dashboard" className="underline font-medium">Dashboard</a> to generate today&apos;s personalised missions for each child.</p>
          </div>
        </div>
      )}

      {/* Add Task Form */}
      <form onSubmit={addTask} className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Add a Task</h2>
        {children.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            You need to <a href="/dashboard/children" className="underline font-medium">add a child</a> before creating tasks.
          </p>
        )}
        <select
          className="border rounded-md px-3 py-2 w-full mb-3"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          required
        >
          <option value="">Select a child</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name} ({child.points} pts)
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TASK_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTitle(t)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                title === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className="border rounded-md px-3 py-2 w-full mb-3"
          placeholder="Or write your own task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full">
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {/* Task List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
        {missions.length === 0 && children.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="font-medium text-gray-700 mb-1">No children added yet</p>
            <p className="text-sm text-gray-500 mb-4">Add a child first, then you can assign tasks to them.</p>
            <a href="/dashboard/children" className="inline-block bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">Add a Child</a>
          </div>
        ) : missions.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="font-medium text-gray-700 mb-1">No tasks yet</p>
            <p className="text-sm text-gray-500">Create your first task above — kids earn 10 points each time they complete one.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {missions.map((mission) => (
              <li
                key={mission.id}
                className={`p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center ${mission.is_completed ? 'opacity-70' : ''}`}
              >
                <div>
                  <p className="font-medium">{mission.title}</p>
                  <p className="text-sm text-gray-600">
                    Child: {children.find((c) => c.id === mission.child_id)?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleTaskCompletion(mission)}
                    className={`px-3 py-1 rounded-md text-white ${
                      mission.is_completed ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {mission.is_completed ? 'Undo' : 'Complete'}
                  </button>
                  <button
                    onClick={() => deleteTask(mission.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
