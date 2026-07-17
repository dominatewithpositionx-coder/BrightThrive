# BrytThrive Design Principles

> **Status:** Active
> **Last updated:** July 17, 2026

These principles govern every screen, interaction, and visual decision in BrytThrive. They apply to product design, UX writing, motion design, and engineering implementation of UI components.

Design work that conflicts with these principles must be revised before shipping.

---

## Core Principles

### 1. Every screen has one primary action.

Clarity beats choice. Each screen presents the user with one thing to do. Supporting actions exist, but they do not compete visually with the primary action. When in doubt, remove an element rather than add one.

### 2. Parents should never feel judged.

BrytThrive is a growth platform, not a parenting scorecard. The tone, language, and visual design must never suggest that a parent is failing. We celebrate the effort to show up — not perfection.

### 3. Children should never read paragraphs.

A child's attention is precious and brief. If an instruction, mission, or message requires more than two short sentences, it is too long. Simplify until a child can read and act in under 10 seconds.

### 4. Celebrate progress frequently.

Small wins deserve visible recognition. Use animation, color, and copy to acknowledge every completed action — not just milestones. Progress should feel good from the first tap.

### 5. Reduce friction relentlessly.

Every unnecessary tap, required field, confirmation dialog, or loading state is a threat to the experience. Before adding friction, ask whether it genuinely protects the user or merely makes the engineering simpler.

### 6. Every interaction should create hope.

The emotional residue of every interaction must be positive. A child who taps the app should feel capable. A parent who opens the dashboard should feel optimistic. Design for the emotional outcome, not just the functional one.

### 7. Small wins beat big promises.

BrytThrive does not sell transformation. It delivers today's win. Design should reflect this by keeping scope small, feedback immediate, and expectations honest. The next win is always one mission away.

### 8. Design for encouragement, never guilt.

Missed missions, empty streaks, and low coin balances should never feel like failures. Design for re-engagement without shame. Default to warm, optimistic language. Remove red states where possible.

---

## UX Writing Standards

- **Parent voice:** Warm, specific, adult. Never condescending.
- **Child voice:** Direct, energetic, identity-affirming. Always second person ("You did it!").
- **AI voice:** Encouraging, brief, process-focused. Never clinical.
- **Error messages:** Honest and helpful. Never alarming.
- **Empty states:** Inviting and action-oriented. Never blank.

---

## Motion and Animation

- Use motion to celebrate completion, not to fill loading time.
- Transitions should be fast (under 300ms) and purposeful.
- Never use animation that could distract from a primary action.
- Coin earn animations and completion celebrations are encouraged — they reinforce the Family Win moment.

---

## Accessibility

- Minimum touch target: 44×44pt
- Color must not be the only differentiator for state (use label + color)
- All interactive elements must have accessible names
- Modal dialogs must trap focus and restore it on close
- Body scroll must be locked when a modal is open

---

## Platform Notes

BrytThrive is mobile-first. Design for a single-hand, portrait-orientation experience. Desktop dashboard for parents is secondary and should not drive primary layout decisions for the child experience.
