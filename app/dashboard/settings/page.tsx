'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bell, Mail, Shield, MapPin } from 'lucide-react';

type Prefs = {
  reward_notifications: boolean;
  weekly_summary: boolean;
  location: string;
};

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description: string;
  icon: React.ElementType;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 bg-gray-100 rounded-lg">
          <Icon size={16} className="text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({ reward_notifications: false, weekly_summary: false, location: '' });
  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = getSupabase();

  useEffect(() => { fetchUser(); }, []);

  async function fetchUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) { setLoading(false); return; }
    setUserEmail(user.email || null);
    setUserId(user.id);

    const { data } = await supabase
      .from('family_plans')
      .select('personalization_data')
      .eq('parent_id', user.id)
      .maybeSingle();

    if (data?.personalization_data) {
      const pd = data.personalization_data as Record<string, unknown>;
      const loc = (pd.location as string) ?? '';
      setPrefs({
        reward_notifications: Boolean(pd.reward_notifications),
        weekly_summary: Boolean(pd.weekly_summary),
        location: loc,
      });
      setLocationInput(loc);
    }
    setLoading(false);
  }

  async function persistPrefs(uid: string, next: Prefs) {
    const { data: existing } = await supabase
      .from('family_plans')
      .select('parent_id')
      .eq('parent_id', uid)
      .maybeSingle();

    if (existing) {
      return supabase
        .from('family_plans')
        .update({ personalization_data: next, updated_at: new Date().toISOString() })
        .eq('parent_id', uid);
    }
    return supabase
      .from('family_plans')
      .insert({ parent_id: uid, personalization_data: next, updated_at: new Date().toISOString() });
  }

  async function updatePref(field: 'reward_notifications' | 'weekly_summary', value: boolean) {
    if (!userId || saving) return;
    setSaving(true);
    const next = { ...prefs, [field]: value };
    const { error } = await persistPrefs(userId, next);
    if (error) toast.error('Failed to update settings.');
    else { setPrefs(next); toast.success('Settings saved!'); }
    setSaving(false);
  }

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || savingLocation) return;
    setSavingLocation(true);
    const next = { ...prefs, location: locationInput.trim() };
    const { error } = await persistPrefs(userId, next);
    if (error) toast.error('Failed to save location.');
    else { setPrefs(next); toast.success('Location saved!'); }
    setSavingLocation(false);
  }

  const locationChanged = locationInput.trim() !== prefs.location;

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse max-w-lg">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">
          Please <a href="/login" className="underline text-green-600">log in</a> to access your settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
            {userEmail[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{userEmail}</p>
            <p className="text-xs text-gray-500">Parent account</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Notifications</h2>
        <div className="divide-y">
          <Toggle
            icon={Bell}
            label="Reward Redemption Alerts"
            description="Get an email when a child redeems a reward"
            checked={prefs.reward_notifications}
            onChange={(v) => updatePref('reward_notifications', v)}
            disabled={saving}
          />
          <Toggle
            icon={Mail}
            label="Weekly Summary"
            description="Receive a weekly digest of your family's activity"
            checked={prefs.weekly_summary}
            onChange={(v) => updatePref('weekly_summary', v)}
            disabled={saving}
          />
        </div>
        {saving && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin inline-block" />
            Saving…
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Location</h2>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
            <MapPin size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">City for weather-aware missions</p>
            <p className="text-xs text-gray-500 mt-0.5">
              When set, missions will account for today's weather — sunny, rainy, snowy, or hot.
            </p>
          </div>
        </div>
        <form onSubmit={saveLocation} className="flex gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Sydney, Toronto, Vancouver"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            aria-label="City for weather-aware missions"
          />
          <button
            type="submit"
            disabled={savingLocation || !locationChanged}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[72px]"
          >
            {savingLocation ? (
              <span className="flex items-center justify-center gap-1">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving
              </span>
            ) : 'Save'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Privacy</h2>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
            <Shield size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Your data stays private</p>
            <p className="text-xs text-gray-500 mt-0.5">
              BrightThrive never sells or shares your family's data. All data is stored securely in Canada.{' '}
              <a href="/privacy" className="text-green-600 underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
