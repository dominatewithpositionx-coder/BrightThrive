# BrightThrive Pilot Support Playbook
**Version:** 1.0  
**Date:** June 2026  
**For:** Wayne (support contact during pilot)

This document covers how to diagnose and resolve the most common issues pilot families may report.

---

## Support Channel

During pilot: families message Wayne directly (text, email, or DM — whichever you gave them).  
Response target: within 24 hours on weekdays.

---

## Issue 1: Parent Cannot Log In

### Symptoms
- "Invalid login credentials" error
- Page spins but never advances
- "Email not confirmed" message

### Diagnosis

**"Invalid login credentials"**
- Ask: did you use the same email you signed up with? (spell check — common mistake)
- Ask: did you verify your email after signing up? (check spam folder for confirmation email)
- Fix: Send password reset from `/login` → "Forgot your password?"

**"Email not confirmed"**
- Fix: Ask them to check spam. Subject is "Confirm your signup" from Supabase.
- If not found: in Supabase dashboard → Authentication → Users → find email → click "Resend confirmation"

**Page spins forever**
- Ask: are you on a stable internet connection?
- Try: hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Try: clear browser cache or try incognito mode
- If persists: check Vercel function logs for auth errors

### What to Screenshot
- The exact error message shown on screen
- URL they're on

---

## Issue 2: Child Data Not Showing

### Symptoms
- Child added but not appearing on dashboard
- Missions completed but not reflected in coin balance
- History shows nothing

### Diagnosis

**Child not appearing on dashboard**
- Ask: which browser/device? Try a full reload.
- The dashboard fetches on load — if the session expired mid-session it may show stale data.
- Fix: log out and log back in, then reload `/dashboard`

**Coin balance wrong**
- This is the most likely `add_coins` RPC issue.
- Check Vercel function logs for errors when missions complete or rewards redeem.
- Verify RPC exists: run the SQL in `PILOT_TEST_PLAN.md` → Pre-Flight Checklist.
- If RPC is missing: the mission and reward flows still work (UI updates optimistically) but balance won't persist. Need to create the RPC in Supabase.

**History empty**
- Go to `/dashboard/history` — confirm correct filter is selected (not filtered to a child with no activity)
- If completely empty and missions have been completed: check `bt_coin_ledger` table in Supabase for entries with that `child_id`

### What to Screenshot
- Dashboard URL showing the issue
- Child's name so you can look up their row in Supabase

---

## Issue 3: Missions Not Generating

### Symptoms
- Child gets to mission screen — spins forever
- "Could not load missions" error
- Missions generate but are generic (not personalized)

### Diagnosis

**Spins forever / error message**
1. Check Vercel function logs → `/api/generate-missions`
2. Common causes:
   - `ANTHROPIC_API_KEY` not set → missions fall back to 5 hardcoded defaults (not an error, but generic)
   - `SUPABASE_SERVICE_ROLE_KEY` not set → mission INSERT fails after generation
   - Claude API outage → check status.anthropic.com

**"Just a moment!" message**
- Rate limit is working. Parent/child clicked Generate too quickly.
- Tell them: wait 60 seconds and try again.

**Missions generate but are generic**
- If `ANTHROPIC_API_KEY` missing: Claude call fails silently, fallback missions show.
- Check Vercel env vars.

**Missions don't account for weather**
- Likely: no city set in Settings, or wttr.in returned an error.
- Fix: go to Settings → Location → enter their city → Save → try generating again.

### What to Screenshot
- The error message on screen (if any)
- The browser console (F12) — any red errors

---

## Issue 4: Emails Not Arriving

### Symptoms
- No welcome email after signup
- No reward notification after redemption

### Diagnosis

**Step 1:** Ask them to check spam/junk folder. Subject lines:
- Welcome: "Welcome to BrightThrive! Here's what happens next 💛"
- Reward: "🎁 [ChildName] redeemed [RewardName]!"

**Step 2:** Check Vercel function logs:
- `/api/welcome-email` → look for `[welcome-email] RESEND_API_KEY not set` (means key missing)
- `/api/notify-reward` → look for `[notify-reward] RESEND_API_KEY not set`

**Step 3:** If key is set but emails still not arriving:
- Check Resend dashboard (resend.com) → Emails sent log
- Look for bounces or delivery failures

**Reward email not arriving even when Resend works:**
- Confirm "Reward Redemption Alerts" is toggled ON in Settings
- It defaults to OFF — many parents won't have turned it on

### What to Collect
- Their email address so you can check Resend logs
- Approximate time of the action that should have triggered the email

---

## Issue 5: Reward Redemption Issue

### Symptoms
- "Could not deduct coins" toast
- Coins deducted but redemption not in history
- Child's balance shows wrong amount

### Diagnosis

**"Could not deduct coins"**
- This is the `add_coins` RPC failing.
- Check Supabase → Database → Functions for `add_coins`
- Run verification SQL in `PILOT_TEST_PLAN.md`
- If RPC is missing, run the creation SQL (contact Wayne to get the migration)

**Redemption missing from history**
- The `reward_redemptions` INSERT happens after the coin deduction.
- If the coin RPC succeeds but redemption insert fails, it's a RLS issue on `reward_redemptions` table.
- Check: in Supabase → Authentication → Policies → `reward_redemptions` — ensure parents can INSERT for their own `parent_id`.

**Balance wrong after redemption**
- Ask: did the page refresh? The balance updates optimistically.
- If a reload shows the wrong balance, the RPC call failed silently.
- Check `bt_coin_wallet` table for that `child_id`'s actual balance.

### What to Screenshot
- The toast/error message exactly as shown
- Child's name and reward name

---

## Issue 6: How to Collect Feedback

### During Pilot (Week 1–2)
Check in once after 3 days:
> "Hey! Just checking in — have you had a chance to try BrightThrive with the kids? Anything working well or anything that felt confusing?"

### End of Week 2 Survey (informal)
Ask these 3 questions:
1. On a scale of 1–10, how likely are you to use this weekly?
2. What's the one thing that would make it better?
3. Is there anything broken or missing that stopped you from using it?

### Tracking
Keep a simple doc with:
- Family name
- Issues reported
- Feedback quotes (verbatim)
- Usage (did they actually use it past day 1?)

---

## Issue 7: PWA / Install Issues

**Android — no install banner:**
- Must visit the site twice in Chrome with a gap in between (browser heuristic)
- Or: tap the three-dot menu → "Add to Home Screen" manually

**iOS — installed but looks like browser:**
- Must install via Safari, not Chrome
- Chrome on iOS does not support PWA install to home screen

**Icon looks wrong on home screen:**
- Cache issue — delete the app and reinstall
- If consistently wrong: check `public/icons/` are deployed (Vercel deployment should include them)

**Offline page not showing:**
- Service worker may not have activated yet (requires two page loads)
- Hard reload clears the SW cache — tell them to just wait for it to re-register

---

## Escalation

If an issue can't be resolved remotely:

1. Ask for their email → look up in Supabase directly
2. Check `children`, `missions`, `bt_coin_wallet`, `bt_coin_ledger`, `reward_redemptions` tables for their data
3. If data is corrupt or missing: manually correct via Supabase dashboard SQL
4. If it's a code bug: log in `KNOWN_ISSUES.md`, deploy a fix, notify the family

---

## Data Access Policy

Wayne can view family data in Supabase dashboard for support purposes only.  
Do not share any family's data with other families.  
Delete any support screenshots after the issue is resolved.
