# BrightThrive Design System

> **Standard:** Every screen must feel like Apple Health, Calm, Duolingo, and Airbnb had a child.
> **Test:** Would Tim Cook demo this? Would Jony Ive remove something? Would a tired parent understand it immediately?

---

## Brand Principles

| Principle | Definition |
|---|---|
| **Calm** | Never rushed. Never panicked. Breathing room in every layout. |
| **Warm** | Humans first. No clinical language. No robotic copy. |
| **Simple** | One thing per screen. One action per moment. |
| **Hopeful** | Every interaction ends with possibility, not pressure. |
| **Honest** | No dark patterns. No manipulation. No shame. |
| **Joyful** | Small delights: confetti, soft animations, warm colors. |

---

## Color Tokens

### Brand

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `brand-primary` | `#22c55e` | `green-500` | Primary actions, success states |
| `brand-primary-dark` | `#16a34a` | `green-600` | Hover states, pressed buttons |
| `brand-primary-light` | `#f0fdf4` | `green-50` | Backgrounds, callout panels |

### Mood Colors

Each mood has a full color set: background card, border, text, gradient.

| Mood | Emoji | Card BG | Border | Text | Gradient From |
|---|---|---|---|---|---|
| Happy | 😊 | `amber-50` | `amber-200` | `amber-900` | `amber-50` |
| Calm | 😌 | `sky-50` | `sky-200` | `sky-900` | `sky-50` |
| Energetic | ⚡ | `orange-50` | `orange-200` | `orange-900` | `orange-50` |
| Tired | 😴 | `purple-50` | `purple-200` | `purple-900` | `purple-50` |
| Sad | 😔 | `blue-50` | `blue-200` | `blue-900` | `blue-50` |
| Frustrated | 😠 | `rose-50` | `rose-200` | `rose-900` | `rose-50` |

### Semantic Colors

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `success` | `#22c55e` | `green-500` | Completions, positive states |
| `warning` | `#f59e0b` | `amber-500` | Alerts, streak risk |
| `error` | `#ef4444` | `red-500` | Errors, blockers |
| `info` | `#3b82f6` | `blue-500` | Tips, neutral information |
| `coin` | `#f59e0b` | `yellow-500` | Points, XP, coins |
| `streak` | `#f97316` | `orange-500` | Streaks, fire motif |

### Neutrals

| Token | Tailwind | Use |
|---|---|---|
| Page background | `white` / `gray-50` | All page backgrounds |
| Card background | `white` | Elevated card surfaces |
| Border | `gray-100` / `gray-200` | Subtle separation |
| Text primary | `gray-900` | Headlines, labels |
| Text secondary | `gray-600` | Descriptions, body |
| Text muted | `gray-400` | Hints, timestamps |

### Avatar Colors (deterministic by name)

```
green-400 / blue-400 / purple-400 / orange-400 / pink-400 / teal-400
```

Assigned via `hash(childName) % 6` — always consistent per child.

---

## Typography

| Role | Font | Weight | Size | Tailwind |
|---|---|---|---|---|
| Display / Hero | Poppins | 700 | 36–48px | `text-4xl font-bold` |
| Section heading | Poppins | 700 | 24px | `text-2xl font-bold` |
| Card heading | Poppins | 600 | 18px | `text-lg font-semibold` |
| Body | Poppins | 400 | 14–16px | `text-sm` / `text-base` |
| Label / Caption | Poppins | 500 | 12px | `text-xs font-medium` |
| Numeric / Stat | Poppins | 700 | 20–32px | `text-xl font-bold` |

---

## Spacing (8-point grid)

| Token | px | Tailwind |
|---|---|---|
| `spacing-1` | 4px | `p-1` |
| `spacing-2` | 8px | `p-2` |
| `spacing-3` | 12px | `p-3` |
| `spacing-4` | 16px | `p-4` |
| `spacing-5` | 20px | `p-5` |
| `spacing-6` | 24px | `p-6` |
| `spacing-8` | 32px | `p-8` |
| `spacing-10` | 40px | `p-10` |

Page padding: `p-6` (24px) on all dashboard screens.
Card inner padding: `p-5` (20px).
Section gap: `space-y-6` or `gap-6`.

---

## Border Radius

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `radius-sm` | 8px | `rounded-lg` | Inputs, small chips |
| `radius-md` | 12px | `rounded-xl` | Cards, stat blocks |
| `radius-lg` | 16px | `rounded-2xl` | Mission cards, reward cards |
| `radius-xl` | 24px | `rounded-3xl` | Mood cards, child picker cards |
| `radius-full` | 9999px | `rounded-full` | Avatars, badges, pills |

---

## Shadow Scale

| Token | Tailwind | Use |
|---|---|---|
| `shadow-card` | `shadow-sm` | Default elevated card |
| `shadow-hover` | `shadow-md` | Hovered card state |
| `shadow-modal` | `shadow-2xl` | Dialogs, overlays |

---

## Motion Principles

**Timing:**
- Micro-interactions: `150ms` (tap feedback, toggle)
- Transitions: `200ms` (fade, slide)
- Success animations: `400ms` (XP burst, confetti)
- Page transitions: `300ms`

**Easing:** `ease-in-out` for all transitions.

**Rules:**
- Every interactive element has a pressed state: `active:scale-95` or `active:scale-[0.98]`
- Cards on hover: `hover:scale-105` (mood cards, child picker only)
- Loading states: `animate-pulse`
- Success: `confetti` burst + toast
- Never animate layout shifts — only transforms and opacity

**Named animation moments:**
- `XPBurst` — confetti on mission complete
- `MoodTransition` — fade between mood check-in phases
- `StreakFlame` — pulse on streak display (future)

---

## Accessibility Rules

- All interactive elements have `focus:ring-2 focus:ring-green-500 focus:ring-offset-1`
- Buttons have `role` and `aria-*` attributes where needed (toggles: `role="switch" aria-checked`)
- Color is never the only signal — always paired with shape, icon, or text
- Minimum tap target: 44×44px (all mobile tap targets)
- Contrast: text on colored backgrounds must pass WCAG AA
- Loading skeletons use `animate-pulse` with `aria-busy`
- Error states always use text in addition to red color

---

## Component Inventory

### BrightThrive Components

| Component | Location | Status | Description |
|---|---|---|---|
| `MoodCard` | `app/child/page.tsx` | Inline | 6-mood tap card, large emoji |
| `MoodResponse` | `app/child/page.tsx` | Inline | EI feedback screen after mood tap |
| `MoodCheckIn` | `app/child/page.tsx` | Inline | Full mood picker screen |
| `MissionCard` | `app/child/page.tsx` | Inline | Pending/complete mission row |
| `RewardCard` | `app/dashboard/rewards/page.tsx` | Inline | Reward tile with cost |
| `ChildCard` | `app/dashboard/page.tsx` | Inline | Child summary panel |
| `ChildPicker` | `app/child/page.tsx` | Inline | Child selection screen |
| `StatCard` | `app/dashboard/page.tsx` | Inline | KPI number block |
| `QuickLink` | `app/dashboard/page.tsx` | Inline | Action card with icon |
| `AvatarCircle` | Multiple | **Duplicated** | Initial + color from name hash |
| `CoinDisplay` | Multiple | **Duplicated** | Points/balance with star icon |
| `Toggle` | `app/dashboard/settings/page.tsx` | Inline | Accessible on/off switch |
| `PinDialog` | `app/child/page.tsx` | Inline | 4-digit PIN entry modal |
| `ProgressBar` | `app/child/page.tsx` | Inline | Reward goal progress |
| `OnboardingWizard` | `app/dashboard/components/` | Extracted | Multi-step parent onboarding |

### UI Primitives (needed — not yet created)

| Component | Props Spec | Priority |
|---|---|---|
| `XPBadge` | `amount: number` | Phase 2 |
| `StreakBadge` | `days: number` | Phase 2 |
| `EmptyState` | `icon, title, description, cta?` | Phase 1 |
| `InsightCard` | `label, value, trend, icon` | Phase 3 |
| `WeatherCard` | `condition, tempC, city` | Phase 2 |

---

## EI Feedback Copy Standard

EI responses must feel like **Mr Rogers + Pixar + Bluey**.

**Rules:**
- Maximum 2 sentences
- Never clinical ("your emotional regulation")
- Never preachy ("you should feel...")
- Never vague ("that's interesting")
- Always specific to the mood
- Always ends with invitation to act, not pressure

**Voice check:** Would a 7-year-old feel understood? Would a parent read this over their child's shoulder and feel proud of the product?

---

## Empty States

Every empty state must have:
1. An emoji or illustration
2. A warm, specific headline
3. One clear action (optional)

Example — no missions:
```
✨
No missions yet!
[Generate My Missions!]
```

Never: "No data found." Never: "Nothing here yet."

---

## Error States

Every error must:
1. Be honest without being alarming
2. Tell the user what to do next
3. Never show a raw error message from the server

Example: "Oops! Could not save that. Try again." ✅
Never: "Error 500: Internal Server Error" ❌

---

## Loading States

Always use skeleton loaders (`animate-pulse`) not spinners.
Skeleton shapes should approximate the real content shape.
Never show a blank white screen.

---

## App Icons

### Source Asset
- Master file: `public/brand/favicon.png` (1024×1024, RGB, white background)
- Design: BrightThrive brain+orbit mark, green→teal→blue gradient
- No text inside the app icon

### Color Palette (icon gradient)
- Green: `#22C55E`
- Teal: `#14B8A6`
- Blue: `#3B82F6` (→ `#0EA5E9`)

### Safe Zone
- Icon content must fit within **80% of canvas** (leave ≥10% padding on each side)
- Current icon bounds: (157,169)→(871,838) on a 1024×1024 canvas ✅

### Corner Radius (OS-applied)
- iOS/macOS apply squircle mask automatically — do not pre-round the source PNG
- Android adaptive icons use the `maskable` purpose on 192 and 512 sizes

### Generated Sizes (`public/icons/`)
| File | Size | Purpose |
|------|------|---------|
| icon-20x20.png | 20×20 | iOS small |
| icon-32x32.png | 32×32 | Favicon / browser tab |
| icon-40x40.png | 40×40 | iOS spotlight |
| icon-60x60.png | 60×60 | iOS home screen |
| icon-72x72.png | 72×72 | Android legacy |
| icon-76x76.png | 76×76 | iPad |
| icon-96x96.png | 96×96 | Android / install prompt |
| icon-120x120.png | 120×120 | iOS retina |
| icon-144x144.png | 144×144 | Android / Windows |
| icon-152x152.png | 152×152 | iPad retina |
| apple-touch-icon.png | 180×180 | iOS `<link rel="apple-touch-icon">` |
| icon-192x192.png | 192×192 | PWA manifest (maskable) |
| icon-384x384.png | 384×384 | Android Play Store |
| icon-512x512.png | 512×512 | PWA manifest (maskable) |
| icon-1024x1024.png | 1024×1024 | App Store / master |

### Manifest Rules
- 192 and 512 must include `"purpose": "any maskable"`
- All other sizes use `"purpose": "any"`
- `background_color` in manifest: `#ffffff`

### Quality Check
- Verify icon is recognizable at 20×20 (≥30% colored pixel coverage)
- Run `python3 -c "from PIL import Image; img=Image.open('public/icons/icon-20x20.png').convert('RGB'); px=[p for r in img.getdata() for p in [r]]; colored=sum(1 for p in px if not (p[0]>230 and p[1]>230 and p[2]>230)); print(colored/len(px))"` to verify
