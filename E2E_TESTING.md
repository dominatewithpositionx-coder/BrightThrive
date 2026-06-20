# BrightThrive — E2E Smoke Test Guide

## Prerequisites

- Node.js 18 or later ([nodejs.org](https://nodejs.org))
- Git
- A terminal (PowerShell or Command Prompt on Windows)
- Three Supabase test accounts on `brightthrive.vercel.app`:
  - **Test parent** — a dedicated account used only for automated testing
  - **Account A** — your real account that has August and Nova as children
  - **Account B** — a fresh account with no children

---

## 1. Pull Latest Code

```powershell
git pull origin main
npm install
npx playwright install chromium
```

---

## 2. Set Test Credentials Safely

Copy the example file and fill in your values:

```powershell
copy .env.e2e.example .env.e2e
notepad .env.e2e
```

Fill in `.env.e2e`:

```env
E2E_BASE_URL=https://brightthrive.vercel.app

E2E_PARENT_EMAIL=your-test-parent@example.com
E2E_PARENT_PASSWORD=your-test-password

ACCOUNT_A_EMAIL=your-real-account@example.com
ACCOUNT_A_PASSWORD=your-real-password

ACCOUNT_B_EMAIL=fresh-account@example.com
ACCOUNT_B_PASSWORD=fresh-password
```

> `.env.e2e` is gitignored. It will never be committed.

---

## 3. Run the Smoke Test

**Headless (no browser window — fastest):**
```powershell
Get-Content .env.e2e | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.+)$') { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }; npm run test:e2e
```

**Headed (watch the browser — useful for debugging):**
```powershell
Get-Content .env.e2e | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.+)$') { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }; npm run test:e2e:headed
```

**Shortcut — if you prefer setting vars manually in PowerShell:**
```powershell
$env:E2E_PARENT_EMAIL="you@example.com"
$env:E2E_PARENT_PASSWORD="yourpassword"
$env:ACCOUNT_A_EMAIL="a@example.com"
$env:ACCOUNT_A_PASSWORD="apassword"
$env:ACCOUNT_B_EMAIL="b@example.com"
$env:ACCOUNT_B_PASSWORD="bpassword"
npm run test:e2e
```

---

## 4. Where Screenshots Are Saved

Every major step saves a screenshot automatically:

```
tests/screenshots/
  01-landing.png
  02-accountB-dashboard.png
  03-accountA-dashboard.png
  04-parent-dashboard.png
  05a-settings-before.png
  05b-settings-location-saved.png
  06a-children-before.png
  06b-child-added.png
  07a-tasks-before.png
  07b-mission-created.png
  08a-mission-completed.png
  08b-wallet-after-completion.png
  09a-rewards-before.png
  09b-reward-created.png
  10-reward-redeemed.png   (or 10-reward-insufficient-points.png)
  11-history.png
  12-email-route-check.png
```

---

## 5. Where the HTML Report Is Saved

After the run, open the full report:

```powershell
npm run test:e2e:report
```

Or open directly in your browser:
```
tests/report/index.html
```

The report shows pass/fail per step, duration, and inline screenshots.

---

## 6. Interpreting Pass/Fail Results

| Result | Meaning |
|--------|---------|
| ✅ passed | Step completed successfully |
| ❌ failed | Step hit an error — check the screenshot and error message |
| ⏭ skipped | Credentials for that step were not set |

**Common failures and what they mean:**

| Failure | Likely cause |
|---------|-------------|
| Step 1 — empty title | Site is down or not deployed |
| Step 2 — August/Nova visible for Account B | RLS fix not applied in Supabase |
| Step 3 — August/Nova not visible for Account A | RLS too restrictive, or wrong credentials |
| Step 6 — child not added | UI changed, or add-child form error |
| Step 8 — wallet not updated | `add_coins` RPC failed or points not reflected |
| Step 10 — reward not redeemed | Insufficient points — complete more missions first |
| Step 12 — 500 from email route | `RESEND_API_KEY` or Supabase env var missing in Vercel |

---

## 7. What to Send Back if a Test Fails

Please share:

1. The terminal output (copy/paste the lines starting with `✘`)
2. The relevant screenshot from `tests/screenshots/`
3. The step number and what you expected vs what happened

Example:
> Step 8 failed. Screenshot `08a-mission-completed.png` shows the task checkbox but clicking it didn't update the points. Terminal says `add_coins failed`.
