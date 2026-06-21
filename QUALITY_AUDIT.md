# BrightThrive Quality Audit
## "Where Would Apple Simplify?"

> Run before every milestone. Updated: 2026-06-21
> Standard: Would Tim Cook demo this? Would Jony Ive remove something?

---

## Top 20 Simplifications

### Typography & Spacing

**1. Inconsistent heading hierarchy across dashboard pages**
- Problem: `page.tsx` files mix `text-2xl`, `text-3xl`, `text-xl` without a consistent page-title style
- Fix: Establish `H1 = text-2xl font-bold`, `section title = text-base font-semibold text-gray-500 uppercase tracking-wide`
- Files: `dashboard/children/page.tsx`, `dashboard/rewards/page.tsx`, `dashboard/history/page.tsx`

**2. Body text line-height varies page to page**
- Problem: Some paragraphs use `leading-relaxed`, some have no leading class — visually inconsistent
- Fix: Add `leading-relaxed` to all body copy globally via `globals.css` on `p` tags

**3. Mobile padding is 16px on some pages, missing entirely on others**
- Problem: Dashboard inner pages lack `px-4 sm:px-6` container
- Fix: Add consistent horizontal padding to all dashboard child pages

---

### Card Consistency

**4. Card border-radius varies: `rounded-lg`, `rounded-xl`, `rounded-2xl` appear on the same page**
- Problem: No visual rhythm — cards look assembled, not designed
- Fix: Standardize to `rounded-2xl` for all content cards. `rounded-xl` for chips/tags. `rounded-full` for avatars.

**5. Card shadows are inconsistent**
- Problem: Some cards use Tailwind defaults, some use custom `shadow-card` tokens, some have no shadow
- Fix: All content cards → `shadow-card` (`0 1px 3px 0 rgb(0 0 0 / 0.1)`)

**6. Mission cards in `child/page.tsx` lack hover/active states**
- Problem: Tapping a mission card gives no visual feedback before the completion animation
- Fix: Add `active:scale-[0.98] transition-transform duration-100` to tappable mission rows

---

### Buttons

**7. Primary button styles differ between onboarding, dashboard, and child views**
- Problem: Three different button designs for the same action type
- Fix: Extract `<PrimaryButton>` component with brand gradient, `rounded-full`, consistent padding

**8. Destructive actions (Delete child, Remove reward) have no confirmation step**
- Problem: A single tap deletes data permanently — no undo, no confirm
- Fix: Add inline "Are you sure?" confirmation with 2-second delay or swipe-to-confirm pattern

**9. Icon buttons lack `aria-label`**
- Problem: `<Trash2>` and `<ChevronRight>` icon-only buttons have no accessible label
- Fix: Add `aria-label` to every icon-only button

---

### Colors

**10. `text-navy` class used inconsistently — some pages default to `text-gray-900`**
- Problem: Heading colour drifts between pages
- Fix: Global `body { color: #0b1a27 }` in `globals.css` — let it cascade

**11. Success green used at 3 different weights: `green-500`, `green-600`, `green-700`**
- Problem: No single brand green — visual incoherence
- Fix: Standardize all UI to `green-600` primary. `green-50` background. `green-700` on hover.

**12. Mood card colours in child view don't match the design token names in `tailwind.config.ts`**
- Problem: Cards use raw Tailwind (`bg-amber-50`) instead of `bg-mood-happy-light`
- Fix: Update `child/page.tsx` to use design tokens from tailwind config

---

### Loading States

**13. Dashboard home shows blank white during data fetch**
- Problem: No skeleton — feels broken on first load, especially on slow connections
- Fix: Add 3 skeleton card placeholders while `loading === true`

**14. Mission generation shows no progress state**
- Problem: After tapping "Generate missions", nothing happens for 2–4 seconds
- Fix: Add animated dots or a brief "Creating your missions..." loading state during fetch

**15. Settings page save button has no loading state**
- Problem: After tapping "Save", there's no feedback that the save is in progress
- Fix: Button should show "Saving..." with spinner during the async save

---

### Empty States

**16. Children page shows blank space when no children exist**
- Status: `EmptyState` component now exists — needs to be wired in

**17. Rewards page shows blank form with no guidance when rewards list is empty**
- Fix: Show `EMPTY_STATES.noRewards` above the "Create reward" form

**18. History page shows nothing when ledger is empty**
- Fix: Show `EMPTY_STATES.noHistory`

---

### Accessibility

**19. Mood tap cards lack `role="button"` and keyboard focus styles**
- Problem: Screen readers see these as `div` elements, not interactive
- Fix: Use `<button>` elements for all mood cards. Add `focus-visible:ring-2 focus-visible:ring-offset-2`

**20. Colour contrast on ghost/secondary text**
- Problem: `text-gray-400` on white background fails WCAG AA (3.5:1 ratio, needs 4.5:1)
- Fix: Upgrade secondary text to `text-gray-500` minimum on white backgrounds

---

## Screen-by-Screen Audit

| Screen | Typography | Spacing | Cards | Loading | Empty | Accessibility | Score |
|---|---|---|---|---|---|---|---|
| Landing page | ✅ | ✅ | ✅ | n/a | n/a | ⚠️ | 85 |
| Onboarding | ✅ | ✅ | ✅ | ⚠️ | n/a | ⚠️ | 80 |
| Child flow | ✅ | ✅ | ⚠️ | ⚠️ | n/a | ⚠️ | 75 |
| Dashboard home | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | 55 |
| Children page | ⚠️ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | 60 |
| Rewards page | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | 50 |
| History page | ⚠️ | ⚠️ | ⚠️ | n/a | ❌ | ⚠️ | 55 |
| Settings page | ✅ | ✅ | ✅ | ❌ | n/a | ⚠️ | 70 |

---

## Priority Queue

Ship in this order:

1. ✅ Empty states — `EmptyState` component built, needs wiring
2. ⬜ Skeleton loading — Dashboard home (highest-traffic screen)
3. ⬜ Mission card tap feedback — `active:scale-[0.98]`
4. ⬜ Destructive action confirmation — Delete child / Remove reward
5. ⬜ Accessibility — `role="button"`, `aria-label`, focus rings on mood cards
6. ⬜ Global colour standardisation — `green-600` primary, `text-gray-500` minimum body
7. ⬜ Card radius unification — `rounded-2xl` everywhere
8. ⬜ Settings save loading state

---

## The Standard (repeated here intentionally)

Before shipping any screen, answer all:

- Would Tim Cook demo this?
- Would Jony Ive remove something?
- Would an overwhelmed parent smile immediately?
- Would a child feel understood?
- Would this reduce stress?
- Would this create delight?
- Would someone tell a friend?

All seven → ship. Any no → simplify first.
