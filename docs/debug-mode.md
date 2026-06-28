# BrightThrive Debug Mode

Internal developer tooling for diagnosing mission generation, Supabase schema, auth, and environment issues in production.

---

## Enabling Debug Tools

Add this environment variable in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true
```

Redeploy after setting it. Remove it (or set to `false`) when done debugging.

**Debug tools are disabled by default.** They are never shown to parents or children.

---

## Using the Debug Page

Navigate to `/dashboard/debug` while logged in as a parent.

The page shows:

- **User ID** — the authenticated parent's Supabase user ID
- **Environment Variables** — presence check (true/false) for all required vars, no values exposed
- **Children** — count and how many have location set
- **Schema Compatibility** — whether `mission_date`, `screen_time_reward`, and location columns exist
- **Service Role** — whether the service role key is functional
- **Detected Issues** — plain-English diagnosis with recommended fixes
- **Test Mission Generation** — trigger a real generation for a selected child and see the full API response including `debugRequestId`
- **SQL Migrations** — copy-paste SQL to fix missing columns

---

## Matching Logs in Vercel

Every call to `/api/generate-missions` emits structured log lines prefixed with:

```
[mission-debug <id>] {"debugRequestId":"<id>","step":"..."}
```

To find logs for a specific request:

1. Run a test from `/dashboard/debug` → copy the **Debug Request ID**
2. Open Vercel → your project → **Logs** tab
3. Search for `[mission-debug <id>]`

All steps for that request will appear in sequence.

---

## Log Step Reference

### Happy path

| Step | Meaning |
|---|---|
| `request_received` | Route handler started |
| `params` | Body parsed, key params logged |
| `auth_header_check` | Bearer token presence detected |
| `auth_getUser_ok` | Supabase confirmed valid session |
| `child_lookup_session_ok` | Child found and belongs to parent |
| `rate_limit_passed` | Not rate-limited |
| `supabase_write_client` | Write client created (service role or anon fallback) |
| `age_resolved` | Age band determined |
| `family_plan_loaded` | Personalization data fetched |
| `weather_loaded` | Weather fetched for location |
| `claude_attempt` | Calling Claude API |
| `claude_response_received` | Got response text |
| `claude_success` | JSON parsed, missions ready |
| `delete_ok` | Old incomplete missions deleted |
| `insert_start` | About to insert new missions |
| `insert_ok` | Missions written to DB |
| `complete` | Success response sent |

### Error steps

| `errorStep` | Cause |
|---|---|
| `body_parse` | Request body is not valid JSON |
| `params_validation` | `childId` missing |
| `auth_getUser` | Bearer token invalid or expired |
| `child_lookup_session` | Child not found or doesn't belong to parent |
| `child_lookup_kid_view` | Kid-view parent mismatch |
| `service_client_init` | `SUPABASE_SERVICE_ROLE_KEY` missing or invalid |
| `rate_limit` | Same child hit within 60 seconds |
| `supabase_insert` | DB insert failed (schema or RLS) |

---

## Common Errors and Fixes

### `ANTHROPIC_API_KEY` missing
- **Symptom:** `claude_attempt { hasAnthropicKey: false }` → `claude_failed_using_fallback`
- **Effect:** Missions still generate using static fallbacks. App works, but missions are not AI-personalised.
- **Fix:** Add `ANTHROPIC_API_KEY` in Vercel and redeploy.

### Claude response parse failure
- **Symptom:** `claude_json_parse_error` with `rawPreview`
- **Cause:** Claude returned markdown or text wrapping around the JSON array.
- **Fix:** Usually transient. The fallback missions will be used. If persistent, check model availability.

### `SUPABASE_SERVICE_ROLE_KEY` missing
- **Symptom:** `supabase_write_client { hasServiceKey: false, strategy: "anon_with_token" }`
- **Effect:** Inserts use the user's anon session instead of service role. RLS may block them.
- **Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel (found in Supabase → Project Settings → API).

### RLS violation on insert
- **Symptom:** `insert_with_date_failed { code: "42501" }` or similar permission error
- **Cause:** Insert client has no valid auth context (service key missing, anon key used without Bearer token).
- **Fix:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set. The service role bypasses RLS.

### `mission_date` column missing
- **Symptom:** `insert_with_date_failed { code: "42703" }` → `insert_retry without_mission_date`
- **Effect:** Inserts retry without the column. If retry succeeds, missions work but won't be date-scoped.
- **Fix:** Run the migration:
  ```sql
  ALTER TABLE missions ADD COLUMN IF NOT EXISTS mission_date date;
  UPDATE missions SET mission_date = CURRENT_DATE WHERE mission_date IS NULL;
  NOTIFY pgrst, 'reload schema';
  ```

### `screen_time_reward` column missing
- **Symptom:** Schema check shows `missions_screen_time_reward: false`
- **Effect:** Screen time tallying returns 0 for all missions.
- **Fix:**
  ```sql
  ALTER TABLE missions ADD COLUMN IF NOT EXISTS screen_time_reward integer DEFAULT 5;
  NOTIFY pgrst, 'reload schema';
  ```

### Children location columns missing
- **Symptom:** Schema check shows `children_location_columns: false`
- **Effect:** Weather-aware missions and location-based personalization don't work.
- **Fix:**
  ```sql
  ALTER TABLE children
    ADD COLUMN IF NOT EXISTS location_label text DEFAULT 'home',
    ADD COLUMN IF NOT EXISTS location_name  text,
    ADD COLUMN IF NOT EXISTS location_city  text;
  NOTIFY pgrst, 'reload schema';
  ```

### Rate limit triggered
- **Symptom:** `rate_limited { secondsLeft: N }`, HTTP 429
- **Cause:** Same child had missions generated within the last 60 seconds.
- **Effect:** Expected behaviour — prevents duplicate generation.
- **Fix:** Wait 60 seconds and retry.

---

## Full SQL Migration (all at once)

```sql
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS mission_date date,
  ADD COLUMN IF NOT EXISTS screen_time_reward integer DEFAULT 5;

UPDATE missions SET mission_date = CURRENT_DATE WHERE mission_date IS NULL;

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS location_label text DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS location_name  text,
  ADD COLUMN IF NOT EXISTS location_city  text;

NOTIFY pgrst, 'reload schema';
```

Run in Supabase → SQL Editor.

---

## Health Endpoint

`GET /api/debug/health` (requires Bearer token, requires `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true`)

Returns:
- `envVars` — each required var as `true`/`false` (no values)
- `children` — count and location coverage
- `schema` — column existence checks
- `serviceRole` — whether the service role key is functional
- `userId` — authenticated parent ID

Never returns secrets.
