# Family Timeline Architecture

> Status: Design only. Do not build tables yet.
> Trigger: After 60+ days of pilot data. Minimum 2 weeks per family before timeline is meaningful.

---

## What this is

The Family Timeline is BrightThrive's emotional moat.

It is not a feature. It is a memory.

A parent opening the app 6 months from now should see:
"August completed his first streak. October 14. 🔥"
"Mia said she felt calm for the first time. November 2. 💙"
"Everyone had a perfect week. December 8. ⭐"

This is the thing that makes cancellation feel like loss.

---

## Data Model (future)

### `family_timeline_events` table

```sql
create table family_timeline_events (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references auth.users(id) on delete cascade,
  child_id     uuid references children(id) on delete set null,
  event_type   text not null,          -- see types below
  title        text not null,          -- "First 7-day streak 🔥"
  body         text,                   -- optional detail copy
  emoji        text,                   -- display emoji
  occurred_at  timestamptz not null default now(),
  metadata     jsonb default '{}',     -- flexible payload
  is_pinned    boolean default false,  -- parent can pin favourite moments
  created_at   timestamptz default now()
);

create index on family_timeline_events (parent_id, occurred_at desc);
create index on family_timeline_events (child_id, occurred_at desc);
```

### Event types

| event_type | When it fires | Example title |
|---|---|---|
| `first_mission_completed` | First ever mission done | "August completed their first mission! 🎯" |
| `streak_milestone` | 3, 7, 14, 30-day streaks | "7-day streak — that's a habit forming 🔥" |
| `mood_milestone` | First time each mood logged | "Mia shared 'Calm' for the first time 💙" |
| `perfect_week` | All missions completed 7 days | "Perfect week — the whole family showed up ⭐" |
| `reward_redeemed` | Any reward redemption | "Ethan earned Roblox time 🎮" |
| `coins_milestone` | 100, 500, 1000 coins total | "500 coins earned — incredible effort 🪙" |
| `parent_note` | Parent writes a note | "Wayne wrote: 'Mia helped set the table without being asked.'" |
| `quote` | Child says something memorable | Future: parent captures quote in app |
| `photo` | Family memory | Phase 5 only |

---

## Generation Logic

Timeline events are NOT manually created. They are generated automatically by:

1. **Triggers in existing routes** — when `mission_completed` is processed, check if it's the first ever → fire `first_mission_completed` event
2. **Nightly Vercel Cron** — check streak data → fire streak milestones
3. **Parent notes** — simple text input in the timeline UI (future)

No ML required. No embeddings. Pure event sourcing.

---

## UI Concept (future screens)

### `/dashboard/timeline`

```
┌─────────────────────────────┐
│  This Month                 │
│                             │
│  🔥 Jun 18                  │
│  August hit a 7-day streak  │
│                             │
│  ⭐ Jun 14                  │
│  Perfect week for the family│
│                             │
│  🎯 Jun 10                  │
│  Mia completed her 50th     │
│  mission                    │
└─────────────────────────────┘
```

- Reverse chronological feed
- Filter by child
- Parent can pin moments
- Export to PDF (Year in Review — future)

---

## Why This Is The Emotional Moat

Every product feature can be copied.

A 2-year family timeline cannot.

The day a parent sees their child's first mood check-in and their 100th side by side — that is the day BrightThrive becomes irreplaceable.

**Build trigger:** When 10 families have 60+ days of data.
**Estimated time:** 1 sprint UI + 1 sprint event wiring.
**DB dependency:** `family_timeline_events` table (create when ready to build).

---

## What NOT to build yet

- Photos (Phase 5)
- Sharing / social features (Year 2)
- AI-generated summaries of the timeline (evaluate at 500+ families)
- PDF Year in Review (nice, but not now)
