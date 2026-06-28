'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

type HealthData = {
  ok: boolean;
  userId: string;
  envVars: Record<string, boolean>;
  children: { count: number; withLocation: number; error?: string };
  schema: Record<string, { exists: boolean; error?: string }>;
  serviceRole: { keyPresent: boolean; works: boolean; error?: string };
  timestamp: string;
};

type GenerateResult = {
  tasks?: unknown[];
  generated?: number;
  debugRequestId?: string;
  usedFallback?: boolean;
  error?: string;
  errorStep?: string;
  errorType?: string;
  fallbackAttempted?: boolean;
  fallbackSucceeded?: boolean;
};

type Child = { id: string; name: string; age: number | null };

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      <span>{ok ? '✓' : '✗'}</span> {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function MonoBlock({ data }: { data: unknown }) {
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 overflow-auto max-h-64 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function DebugPage() {
  const router = useRouter();
  const debugEnabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_TOOLS === 'true';

  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

  useEffect(() => {
    if (!debugEnabled) { router.replace('/dashboard'); return; }
    loadHealth();
    loadChildren();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function loadHealth() {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const token = await getToken();
      if (!token) { setHealthError('No session — please log in.'); setHealthLoading(false); return; }
      const res = await fetch('/api/debug/health', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) { setHealthError(json.error ?? `HTTP ${res.status}`); }
      else setHealth(json as HealthData);
    } catch (e) {
      setHealthError(String(e));
    }
    setHealthLoading(false);
  }

  async function loadChildren() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('children')
      .select('id, name, age')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true });
    if (data) {
      setChildren(data as Child[]);
      if (data.length > 0) setSelectedChildId((data[0] as Child).id);
    }
  }

  async function runTestGenerate() {
    if (!selectedChildId || generating) return;
    setGenerating(true);
    setGenerateResult(null);
    try {
      const token = await getToken();
      if (!token) { setGenerateResult({ error: 'No session.' }); setGenerating(false); return; }
      const child = children.find(c => c.id === selectedChildId);
      const res = await fetch('/api/generate-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ childId: selectedChildId, childAge: child?.age }),
      });
      const json = await res.json();
      setGenerateResult(json as GenerateResult);
    } catch (e) {
      setGenerateResult({ error: String(e) });
    }
    setGenerating(false);
  }

  if (!debugEnabled) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold text-gray-700">Debug tools are disabled.</p>
          <p className="text-sm text-gray-500 mt-1">
            Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true</code> in Vercel to enable.
          </p>
        </div>
      </div>
    );
  }

  function interpretHealth(h: HealthData): { issue: string; fix: string }[] {
    const issues: { issue: string; fix: string }[] = [];
    if (!h.envVars.SUPABASE_SERVICE_ROLE_KEY)
      issues.push({ issue: 'SUPABASE_SERVICE_ROLE_KEY missing', fix: 'Mission inserts will use the anon key (RLS may block them). Add the service role key in Vercel.' });
    if (!h.envVars.ANTHROPIC_API_KEY)
      issues.push({ issue: 'ANTHROPIC_API_KEY missing', fix: 'Missions will use static fallbacks instead of AI generation.' });
    if (!h.envVars.NEXT_PUBLIC_SITE_URL)
      issues.push({ issue: 'NEXT_PUBLIC_SITE_URL missing', fix: 'Password reset emails will be broken.' });
    if (!h.schema.missions_mission_date?.exists)
      issues.push({ issue: 'missions.mission_date column missing', fix: 'Run the SQL migration to add this column. Mission inserts will retry without it.' });
    if (!h.schema.missions_screen_time_reward?.exists)
      issues.push({ issue: 'missions.screen_time_reward column missing', fix: 'Run the SQL migration to add this column.' });
    if (!h.schema.children_location_columns?.exists)
      issues.push({ issue: 'children location columns missing', fix: 'Run the SQL migration to add location_label, location_city.' });
    if (h.envVars.SUPABASE_SERVICE_ROLE_KEY && !h.serviceRole.works)
      issues.push({ issue: `Service role key present but unusable: ${h.serviceRole.error}`, fix: 'Check that SUPABASE_SERVICE_ROLE_KEY matches the correct Supabase project.' });
    return issues;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Developer Debug</h1>
        <p className="text-xs text-gray-400 mt-0.5">Internal tooling — not visible to parents or children.</p>
      </div>

      {/* Health check */}
      <Section title="System Health">
        <div className="flex items-center gap-3">
          <button
            onClick={loadHealth}
            disabled={healthLoading}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {healthLoading ? 'Loading…' : 'Refresh'}
          </button>
          {health && <span className="text-xs text-gray-400">Last checked: {new Date(health.timestamp).toLocaleTimeString()}</span>}
        </div>
        {healthError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{healthError}</div>
        )}
        {health && (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">User</p>
              <p className="text-xs font-mono text-gray-600">{health.userId}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Environment Variables</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(health.envVars).map(([key, present]) => (
                  <StatusBadge key={key} ok={present} label={key.replace('NEXT_PUBLIC_', '')} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Children</p>
              <p className="text-xs text-gray-600">{health.children.count} child(ren) found — {health.children.withLocation} with location set.</p>
              {health.children.error && <p className="text-xs text-red-600 mt-0.5">{health.children.error}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Schema Compatibility</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(health.schema).map(([key, check]) => (
                  <StatusBadge key={key} ok={check.exists} label={key.replace(/_/g, '.')} />
                ))}
              </div>
              {Object.entries(health.schema).filter(([, c]) => !c.exists || c.error).map(([key, c]) => (
                <p key={key} className="text-xs text-red-600 mt-1">{key}: {c.error}</p>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Service Role</p>
              <StatusBadge ok={health.serviceRole.works} label={health.serviceRole.works ? 'Connected' : 'Not working'} />
              {health.serviceRole.error && <p className="text-xs text-red-600 mt-1">{health.serviceRole.error}</p>}
            </div>

            {(() => {
              const issues = interpretHealth(health);
              return issues.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-700">Detected Issues</p>
                  {issues.map((i, idx) => (
                    <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-800">{i.issue}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{i.fix}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 font-semibold">
                  ✓ No issues detected.
                </div>
              );
            })()}
          </>
        )}
      </Section>

      {/* Test mission generation */}
      <Section title="Test Mission Generation">
        {children.length === 0 ? (
          <p className="text-xs text-gray-500">No children found. Add a child first.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <select
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700"
              >
                {children.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (age {c.age ?? 'unknown'})
                  </option>
                ))}
              </select>
              <button
                onClick={runTestGenerate}
                disabled={generating || !selectedChildId}
                className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating…' : 'Run Test'}
              </button>
            </div>
            <p className="text-xs text-gray-400">This will replace today&apos;s missions for the selected child. Check Vercel logs for <code className="bg-gray-100 px-1 rounded">[mission-debug &lt;id&gt;]</code> entries.</p>

            {generateResult && (
              <div className="space-y-3">
                {generateResult.debugRequestId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-800">Debug Request ID</p>
                    <p className="text-xs font-mono text-blue-700 mt-0.5">{generateResult.debugRequestId}</p>
                    <p className="text-xs text-blue-600 mt-1">Search Vercel logs for: <code className="bg-blue-100 px-1 rounded">[mission-debug {generateResult.debugRequestId}]</code></p>
                  </div>
                )}

                {generateResult.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-red-700">Error</p>
                    <p className="text-xs text-red-600">{generateResult.error}</p>
                    {generateResult.errorStep && <p className="text-xs text-red-500">Step: <strong>{generateResult.errorStep}</strong></p>}
                    {generateResult.errorType && <p className="text-xs text-red-500">Type: <strong>{generateResult.errorType}</strong></p>}
                    {generateResult.fallbackAttempted != null && (
                      <p className="text-xs text-red-500">Fallback attempted: {String(generateResult.fallbackAttempted)} / succeeded: {String(generateResult.fallbackSucceeded)}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-emerald-700">Success</p>
                    <p className="text-xs text-emerald-600">{generateResult.generated} missions generated, {generateResult.tasks?.length ?? 0} inserted.</p>
                    {generateResult.usedFallback && <p className="text-xs text-amber-600">⚠ Used static fallback missions (Claude unavailable).</p>}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Raw API Response</p>
                  <MonoBlock data={{ ...generateResult, tasks: generateResult.tasks ? `[${generateResult.tasks.length} rows]` : undefined }} />
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* SQL migrations reminder */}
      <Section title="Required SQL Migrations">
        <p className="text-xs text-gray-500 mb-3">Run in Supabase SQL Editor if schema checks above show failures.</p>
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-auto whitespace-pre">
{`ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS mission_date date,
  ADD COLUMN IF NOT EXISTS screen_time_reward integer DEFAULT 5;

UPDATE missions SET mission_date = CURRENT_DATE WHERE mission_date IS NULL;

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS location_label text DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS location_name  text,
  ADD COLUMN IF NOT EXISTS location_city  text;

NOTIFY pgrst, 'reload schema';`}
        </pre>
      </Section>

      {/* Log format reference */}
      <Section title="Log Format Reference">
        <p className="text-xs text-gray-500 mb-2">
          Every log line from <code className="bg-gray-100 px-1 rounded">/api/generate-missions</code> is prefixed with the request ID.
          Filter Vercel logs by the Debug Request ID shown after a test run.
        </p>
        <MonoBlock data={{
          example: '[mission-debug abc12345] {"debugRequestId":"abc12345","step":"insert_ok","rowsInserted":10,"strategy":"with_mission_date","usedFallback":false}',
          steps: ['request_received','params','auth_header_check','auth_getUser_ok','child_lookup_session_ok','rate_limit_passed','supabase_write_client','age_resolved','family_plan_loaded','weather_loaded','claude_attempt','claude_response_received','claude_success','fallback_missions_loaded','delete_ok','insert_start','insert_ok','complete'],
          errorSteps: ['body_parse','params_validation','auth_getUser','child_lookup_session','child_lookup_kid_view','service_client_init','rate_limit','supabase_write_client','family_plan_lookup','weather_exception','claude_failed_using_fallback','delete_with_date_failed','insert_with_date_failed','insert_without_date_failed'],
        }} />
      </Section>
    </div>
  );
}
