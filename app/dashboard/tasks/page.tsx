'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
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

type Task = {
  id: string;
  child_id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  points: number;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🧠 Fetch all children and tasks
  async function fetchData() {
    const { data: childData } = await supabase
      .from('children')
      .select('id, name, points')
      .order('created_at', { ascending: false });
    setChildren(childData || []);

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    setTasks(taskData || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ➕ Add a new task
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!childId || !title) {
      toast.error('Please select a child and enter a task.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('tasks').insert([
      {
        child_id: childId,
        title,
        completed: false,
      },
    ]);

    if (error) toast.error('Error adding task: ' + error.message);
    else {
      toast.success('Task added!');
      setTitle('');
      fetchData();
    }
    setLoading(false);
  }

  // ✅ Toggle task completion + update points + log reason
  async function toggleTaskCompletion(id: string, completed: boolean, child_id: string, taskTitle: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      toast.error('Error updating task.');
      return;
    }

    // 🧮 Update child points (+10 for complete, -10 for undo)
    const pointsChange = completed ? -10 : +10;
    const reason = completed
      ? `Undid task: ${taskTitle}`
      : `Completed task: ${taskTitle}`;

    const { error: pointsError } = await supabase.rpc('increment_points', {
      child_id,
      points_change: pointsChange,
      reason,
    });

    if (pointsError) {
      console.error('Error updating points:', pointsError);
      toast.error('Error updating points.');
    } else {
      toast.success(
        completed
          ? 'Task undone. Points removed.'
          : 'Task completed! +10 pts logged.'
      );
    }

    fetchData();
  }

  // ❌ Delete a task
  async function deleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) toast.error('Error deleting task.');
    else {
      toast.success('Task deleted.');
      fetchData();
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      {/* Add Task Form */}
      <form
        onSubmit={addTask}
        className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-md mb-8"
      >
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
              {child.name} ({child.points ?? 0} pts)
            </option>
          ))}
        </select>
        {/* Template pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TASK_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTitle(t)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                title === t
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
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
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full"
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {/* Task List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
        {tasks.length === 0 && children.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="font-medium text-gray-700 mb-1">No children added yet</p>
            <p className="text-sm text-gray-500 mb-4">Add a child first, then you can assign tasks to them.</p>
            <a href="/dashboard/children" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Add a Child</a>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="font-medium text-gray-700 mb-1">No tasks yet</p>
            <p className="text-sm text-gray-500">Create your first task above — kids earn 10 points each time they complete one.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center ${
                  task.completed ? 'opacity-70' : ''
                }`}
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-gray-600">
                    Child:{' '}
                    {children.find((c) => c.id === task.child_id)?.name ||
                      'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleTaskCompletion(
                        task.id,
                        task.completed,
                        task.child_id,
                        task.title
                      )
                    }
                    className={`px-3 py-1 rounded-md text-white ${
                      task.completed
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {task.completed ? 'Undo' : 'Complete'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
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
