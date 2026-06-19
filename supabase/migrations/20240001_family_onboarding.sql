-- BrightThrive: family_onboarding table
-- Run this in your Supabase project: Dashboard → SQL Editor → paste & run

create table if not exists family_onboarding (
  id                   uuid primary key default gen_random_uuid(),
  parent_id            uuid not null references auth.users(id) on delete cascade,
  primary_goal         text,
  child_description    text,
  parent_involvement   text,
  motivation_preference text,
  selected_habits      text[],
  screen_time_preference text,
  routine_timing       text,
  success_definition   text,
  completed_at         timestamptz default now(),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- One row per parent (upsert on parent_id)
create unique index if not exists family_onboarding_parent_id_idx
  on family_onboarding (parent_id);

-- Row Level Security: parents can only read/write their own row
alter table family_onboarding enable row level security;

create policy "Parents can insert their own onboarding data"
  on family_onboarding for insert
  with check (auth.uid() = parent_id);

create policy "Parents can read their own onboarding data"
  on family_onboarding for select
  using (auth.uid() = parent_id);

create policy "Parents can update their own onboarding data"
  on family_onboarding for update
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger family_onboarding_updated_at
  before update on family_onboarding
  for each row execute function update_updated_at();
