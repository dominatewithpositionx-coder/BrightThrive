# BrytThrive Figma Workflow

> Figma is the source of visual truth. Code is the implementation of approved designs.

---

## Principle

No major screen ships without a Figma frame.

No Figma frame ships to code without founder approval.

No code ships to production without matching the approved Figma frame.

This is not bureaucracy. This is quality control. Every pixel counts when you're building for families.

---

## Design → Code Flow

```
Figma Frame (approved)
    ↓
Developer reads DESIGN_SYSTEM.md
    ↓
Build with exact tokens, spacing, radii from design system
    ↓
Screenshot comparison (browser vs Figma)
    ↓
Founder approval
    ↓
Merge to main → Vercel deploy
```

---

## Figma File Structure

Organize the Figma file as follows:

```
📁 BrytThrive Design System
  └── 🎨 Styles (colors, text styles, effects)
  └── 🧩 Components
      ├── MoodCard
      ├── MissionCard
      ├── RewardCard
      ├── ChildCard
      ├── AvatarCircle
      ├── CoinDisplay
      ├── XPBadge
      ├── StreakBadge
      ├── Toggle
      ├── EmptyState
      ├── ErrorBanner
      └── SuccessToast

📁 BrytThrive Screens
  └── 📱 Child Flow
      ├── Child Picker
      ├── Mood Check-In
      ├── Mood Response — Happy
      ├── Mood Response — Calm
      ├── Mood Response — Energetic
      ├── Mood Response — Tired
      ├── Mood Response — Sad
      ├── Mood Response — Frustrated
      └── Mission View
  └── 📊 Parent Dashboard
      ├── Dashboard Home
      ├── Children
      ├── Rewards
      ├── History
      ├── Analytics
      └── Settings
  └── 🌐 Landing Page
      ├── Hero
      ├── Why BrytThrive
      ├── Features
      ├── Science
      ├── Pricing
      ├── Founder Note
      └── CTA Footer
  └── 🔐 Auth
      ├── Login
      └── Onboarding Wizard

📁 BrytThrive — Archived
  └── (old versions go here, never deleted)
```

---

## Component Naming Rules

Figma component names **must exactly match** code component names.

| Figma Name | Code Component | File |
|---|---|---|
| `MoodCard` | `MoodCard` | `app/child/page.tsx` |
| `MoodCheckIn` | `MoodCheckIn` | `app/child/page.tsx` |
| `MoodResponse` | `MoodResponse` | `app/child/page.tsx` |
| `MissionCard` | mission `<button>` row | `app/child/page.tsx` |
| `RewardCard` | reward `<div>` | `app/dashboard/rewards/page.tsx` |
| `ChildCard` | child `<div>` | `app/dashboard/page.tsx` |
| `ChildPicker` | `ChildPicker` | `app/child/page.tsx` |
| `AvatarCircle` | `getColors` + initial div | Multiple |
| `StatCard` | `StatCard` | `app/dashboard/page.tsx` |
| `Toggle` | `Toggle` | `app/dashboard/settings/page.tsx` |
| `PinDialog` | `PinDialog` | `app/child/page.tsx` |
| `OnboardingWizard` | `OnboardingWizard` | `app/dashboard/components/` |
| `EmptyState` | `EmptyState` | (not yet created) |
| `XPBadge` | `XPBadge` | (not yet created) |
| `StreakBadge` | `StreakBadge` | (not yet created) |

---

## Design Token → Tailwind Mapping

Every Figma style must map to a Tailwind class. No ad-hoc hex values in code.

| Figma Style | Tailwind Class |
|---|---|
| `Brand/Primary` | `bg-green-500` / `text-green-500` |
| `Brand/Primary Dark` | `bg-green-600` |
| `Brand/Primary Light` | `bg-green-50` |
| `Mood/Happy` | `bg-amber-50 border-amber-200` |
| `Mood/Calm` | `bg-sky-50 border-sky-200` |
| `Mood/Energetic` | `bg-orange-50 border-orange-200` |
| `Mood/Tired` | `bg-purple-50 border-purple-200` |
| `Mood/Sad` | `bg-blue-50 border-blue-200` |
| `Mood/Frustrated` | `bg-rose-50 border-rose-200` |
| `Semantic/Success` | `text-green-600` / `bg-green-100` |
| `Semantic/Error` | `text-red-600` / `bg-red-50` |
| `Semantic/Coin` | `text-yellow-500` |
| `Radius/Card` | `rounded-2xl` |
| `Radius/Modal` | `rounded-3xl` |
| `Shadow/Card` | `shadow-sm` |
| `Shadow/Hover` | `shadow-md` |
| `Text/Primary` | `text-gray-900` |
| `Text/Secondary` | `text-gray-600` |
| `Text/Muted` | `text-gray-400` |

---

## Screen Approval Checklist

Before a screen goes to code:

- [ ] Figma frame is complete (not a sketch)
- [ ] All states designed: default, loading, empty, error, success
- [ ] Mobile frame (375px) and tablet (768px) both visible
- [ ] Typography matches `DESIGN_SYSTEM.md`
- [ ] Colors use named styles, not raw hex values
- [ ] Spacing follows the 8-point grid
- [ ] Interactive states (hover, pressed, focus) are shown
- [ ] Wayne has approved the frame
- [ ] Frame is marked "Ready for Dev" in Figma

---

## Code → Figma Comparison Checklist

Before merging any screen to main:

- [ ] Screenshot taken in Chrome at 375px width
- [ ] Screenshot compared side-by-side with Figma frame
- [ ] Typography matches (size, weight, color)
- [ ] Spacing matches (padding, gap)
- [ ] Corner radii match
- [ ] Color tokens match
- [ ] Hover/tap states match
- [ ] Empty and error states tested
- [ ] Wayne has approved the implementation

---

## Stitch AI Prompt Guidance

When using Stitch or AI tools to generate Figma screens:

**Always include in the prompt:**
- "BrytThrive design system"
- "Poppins font"
- "8-point grid spacing"
- Specific mood color if applicable
- "Mobile-first, 375px width"
- "Warm, calm, parent-friendly"
- "Apple Health meets Duolingo meets Calm"

**Never accept from Stitch:**
- Serif fonts
- Dark backgrounds (child screens)
- Sharp corners (use rounded-2xl minimum)
- Generic stock icons (use Lucide React icons to match code)
- Placeholder grey boxes without layout intent

---

## Figma → Resend Email Sync

When designing email templates:

- Use Figma to approve layout and copy first
- Then implement in Resend/React Email
- Email width: 600px fixed
- Font: system-safe fallbacks (Helvetica, Arial) — not Poppins
- Colors: same tokens as web
- Always test: Gmail, Apple Mail, Outlook web

---

## What Figma Does NOT Control

- Database schema (Supabase owns this)
- API response formats
- Authentication flows (logic, not visual)
- Error messages from third-party services

Everything visual that a family sees → Figma first.
