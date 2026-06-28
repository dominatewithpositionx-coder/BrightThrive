# BrightThrive Multi-Agent Workflows

Structured workflows for common development scenarios. Each workflow specifies which agents to invoke, in what order, and what to do with their output.

---

## Workflow 1: Production Bug Investigation

**When to use:** Something is broken in production. Users are affected. You don't know the root cause.

### Step 1 — Identify scope
Determine: Is this a DB issue? An auth issue? A UI issue? An AI issue?

Look at:
- Vercel logs → search for `[mission-debug <id>]` or `[dashboard]` prefixes
- `/dashboard/debug` (if `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true`) → run a test generation

### Step 2 — DB / Schema / Auth issues
```
Agent: supabase-debug-agent
Ask: "The generate-missions route is returning 500. Here are the logs: [paste logs]. What is failing and why?"
```

### Step 3 — Mission quality / Claude issues
```
Agent: ai-mission-agent
Ask: "Claude is not generating missions / missions are wrong age / missions are ignoring weather. Here is the log output: [paste]. What's wrong?"
```

### Step 4 — UI issues
```
Agent: qa-regression-agent
Ask: "The dashboard is showing a red error on load. The error message is: [paste]. Which flow is broken and how do I reproduce it?"
```

### Step 5 — Verify fix
After applying the fix:
1. `npx tsc --noEmit`
2. `npx next build --no-lint`
3. Redeploy to Vercel
4. Check `/dashboard/debug` → run test generation → verify `debugRequestId` logs show `complete` step

---

## Workflow 2: Pre-Merge QA

**When to use:** Before merging any PR into `main`. Non-negotiable.

### Step 1 — TypeScript + Build
```bash
npx tsc --noEmit
npx next build --no-lint
```
**Block merge if either fails.**

### Step 2 — Regression sweep
```
Agent: qa-regression-agent
Ask: "Review the diff of this PR and check for regressions in: mission flow, Kid Mode, auth, demo mode, error handling, and logo usage. Files changed: [list]"
```

### Step 3 — Security check (if touching API routes, auth, or Supabase clients)
```
Agent: security-privacy-agent
Ask: "Review these changes for secret leakage, RLS concerns, or child data exposure: [paste diff or file list]"
```

### Step 4 — UI check (if touching tsx files)
```
Agent: ui-polish-agent
Ask: "Check these components against the BrightThrive design system: [list files]"
```

### Step 5 — Copy check (if touching user-facing text)
```
Agent: copy-positioning-agent
Ask: "Review the copy in these files for voice, vocabulary, and PositionX alignment: [list files]"
```

**Only merge when all agents return no Critical findings and TSC + build are clean.**

---

## Workflow 3: Mission Generation Debugging

**When to use:** Parents report "Couldn't create missions" or missions aren't appearing.

### Step 1 — Enable debug mode
In Vercel: set `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true`. Redeploy.

### Step 2 — Collect logs
1. Go to `/dashboard/debug`
2. Select the affected child → click "Run Test"
3. Copy the **Debug Request ID**
4. Go to Vercel → Logs → search `[mission-debug <id>]`
5. Paste the full log sequence

### Step 3 — Diagnose
```
Agent: supabase-debug-agent
Ask: "Here are the mission generation logs for request [id]: [paste logs]. 
The failure occurs at step [X]. What is the root cause and what SQL or code change fixes it?"
```

```
Agent: ai-mission-agent
Ask: "The Claude call is failing / missions are wrong quality. 
Log shows: [paste claude_attempt and claude_failed lines]. What should I change?"
```

### Step 4 — Common fixes

| Log Step | Root Cause | Fix |
|---|---|---|
| `auth_getUser_failed` | Session expired | Parent needs to log out and back in |
| `child_lookup_session_failed` | RLS blocking children read | Check that `parent_id` matches `user.id` |
| `supabase_write_client { hasServiceKey: false }` | `SUPABASE_SERVICE_ROLE_KEY` not set | Add to Vercel env vars, redeploy |
| `insert_with_date_failed { code: "42703" }` | `mission_date` column missing | Run migration (see below) |
| `claude_failed_using_fallback { error: "ANTHROPIC_API_KEY not set" }` | API key missing | Add to Vercel env vars |
| `rate_limited { secondsLeft: N }` | Within 60s cooldown | Wait and retry |

**SQL to fix missing columns:**
```sql
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS mission_date date,
  ADD COLUMN IF NOT EXISTS screen_time_reward integer DEFAULT 5;
UPDATE missions SET mission_date = CURRENT_DATE WHERE mission_date IS NULL;
NOTIFY pgrst, 'reload schema';
```

---

## Workflow 4: UI Polish Review

**When to use:** Before a visual release, after adding new components, or when something looks off.

### Step 1 — Design system audit
```
Agent: ui-polish-agent
Ask: "Audit [file or component] against the BrightThrive design system. 
Check: logo usage, touch targets, color tokens, spacing, typography, empty states."
```

### Step 2 — Kid Mode specific
```
Agent: child-experience-agent
Ask: "Review the Kid Mode profile picker / mission list / completion flow. 
Does it feel premium and age-appropriate for children 5–13? What's missing?"
```

### Step 3 — Copy review
```
Agent: copy-positioning-agent
Ask: "Review all visible copy in [file]. Does it match BrightThrive voice and vocabulary? 
Flag any 'AI', 'tasks', 'chores', or clinical language."
```

### Common UI issues to check:
- Logo: `/child` must use `<Logo variant="full" />` not `BRAND.mark`
- Buttons: all `min-h-[44px]`
- Touch targets on mobile: test at 375px width
- Empty states: warm and actionable, not blank
- Error states: friendly language, no raw error codes

---

## Workflow 5: Security and Privacy Review

**When to use:** Before merging any change that touches auth, API routes, Supabase clients, logging, or child data.

### Step 1 — Run automated checks
```bash
# Service role in client code
grep -rn "createServiceSupabaseClient" app/ --include="*.tsx" | grep -v "route.ts"

# Non-public env vars in client components
grep -rn "process\.env\." app/ --include="*.tsx" | grep -v "NEXT_PUBLIC_"

# Child name in Claude calls  
grep -rn "child\.name\|childName" app/api/ --include="*.ts"

# Secrets in log statements
grep -rn "console\." app/api/ --include="*.ts" | grep -iE "key|token|secret|password|email"
```

### Step 2 — Agent review
```
Agent: security-privacy-agent
Ask: "Review this diff/these files for: secret leakage, RLS concerns, PII in logs, 
child data exposure, auth bypass risks, and debug endpoint security. 
Files: [list]"
```

### Step 3 — Verify invariants
Confirm all are still true after the change:
- [ ] `createServiceSupabaseClient` not in any `'use client'` component
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` in client bundles
- [ ] `/dashboard/debug` still requires auth + `NEXT_PUBLIC_ENABLE_DEBUG_TOOLS`
- [ ] Demo mode still requires `?demo=1` URL param
- [ ] All new tables have RLS enabled
- [ ] No child name in Claude system prompt

---

## Workflow 6: Behavioral Science Review

**When to use:** Before shipping any mission design, reward mechanic, streak system, badge, retention feature, onboarding question, or anything that shapes how children and parents feel about using BrightThrive long-term.

### Step 1 — Behavioral assessment
```
Agent: growth-behavioral-science-agent
Ask: "We are building [feature]. Here is how it works: [description].
Assess: does this build lasting habits? Does it risk shame or manipulation? 
What does SDT / habit research say about this design?"
```

### Step 2 — Ethical check
```
Agent: growth-behavioral-science-agent
Ask: "Are there any dark patterns, addiction mechanics, or child welfare concerns 
in [feature]? What should we NOT build yet?"
```

### Step 3 — Mission-specific review (if changing mission categories or content)
```
Agent: ai-mission-agent
Ask: "Review the mission set for age band [X]. Do missions satisfy competence, 
connection, contribution, creativity, or curiosity? Which are weakest?"
```

### Common behavioral red flags to check:
- Streaks that shame children for rest days
- Reward withdrawal as punishment
- Social comparison between children
- Variable/random reward schedules (slot machine mechanics)
- Push notification guilt trips
- Automatic screen-time restriction (BrightThrive earns, never restricts)
- Language that frames screen time as something to be "allowed" not "earned"

---

## Workflow 8: New Feature Planning

**When to use:** Before starting implementation of a new feature.

### Step 1 — Loop alignment check
```
Agent: product-strategy-agent
Ask: "We want to add [feature description]. Does this align with the earned screen-time loop? 
Is it Pilot scope or Phase 2? What's the parent and child impact?"
```

### Step 1b — Behavioral science check (for missions, rewards, streaks, retention)
```
Agent: growth-behavioral-science-agent
Ask: "We want to add [feature]. Does this build lasting habits or short-term compliance? 
Are there risks of shame, anxiety, or dark patterns? What does behavioral science recommend?"
```

### Step 2 — Copy planning
```
Agent: copy-positioning-agent
Ask: "Draft parent-facing copy for [feature]: headlines, button labels, empty states, error states. 
Use BrightThrive voice — no AI language, positive earning framing."
```

### Step 3 — UX planning (if UI work)
```
Agent: child-experience-agent OR parent-experience-agent
Ask: "Design the UX for [feature] in [Kid Mode / parent dashboard]. 
What is the simplest, most delightful implementation? What empty/error states are needed?"
```

### Step 4 — DB planning (if new tables or columns)
```
Agent: supabase-debug-agent
Ask: "We need to store [data] for [feature]. Design the table/column with correct RLS policies. 
Write a migration using IF NOT EXISTS guards."
```

### Step 5 — Security planning (if new data)
```
Agent: security-privacy-agent
Ask: "We're adding [feature] that stores [data type]. 
What are the privacy implications? What RLS policies are required? 
Is any of this child PII that needs special handling?"
```

---

## Quick Reference: Which Agent for What

| Problem | Agent |
|---|---|
| "Should we build this?" | `product-strategy-agent` |
| "Does this build habits or just compliance?" | `growth-behavioral-science-agent` |
| "Is this streak / reward mechanic healthy?" | `growth-behavioral-science-agent` |
| "Kid Mode feels boring / confusing" | `child-experience-agent` |
| "Dashboard is confusing parents" | `parent-experience-agent` |
| "Missions are wrong age / generic" | `ai-mission-agent` |
| "Supabase 403 / insert failing" | `supabase-debug-agent` |
| "Something regressed / pre-merge QA" | `qa-regression-agent` |
| "Is this safe to ship?" | `security-privacy-agent` |
| "This UI doesn't feel premium" | `ui-polish-agent` |
| "Dashboard is slow / bundle is big" | `performance-agent` |
| "This copy feels wrong / too technical" | `copy-positioning-agent` |

---

## Invoking Agents in Claude Code

```
# In Claude Code chat, type:
Use the supabase-debug-agent to diagnose why mission inserts are failing.

# Or:
Use the qa-regression-agent to check app/child/page.tsx and app/dashboard/page.tsx for regressions before this PR merges.

# Or with specific files:
Use the security-privacy-agent to review the diff in app/api/generate-missions/route.ts.
```

Agents can also be invoked programmatically in Claude Code via the `Agent` tool with `subagent_type` matching the agent name.
