-- Win Journal: one daily family win recorded by the parent
-- Parents record a single win per day; displayed on the dashboard to celebrate momentum.

create table if not exists public.win_journal (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references auth.users(id) on delete cascade,
  win_date     date not null default current_date,
  win_text     text not null check (char_length(win_text) between 1 and 280),
  created_at   timestamptz not null default now(),
  unique (parent_id, win_date)  -- one win per parent per day
);

-- Index for dashboard query (recent wins for a parent)
create index if not exists win_journal_parent_date_idx
  on public.win_journal (parent_id, win_date desc);

-- RLS: parents can only see and write their own wins
alter table public.win_journal enable row level security;

create policy "win_journal_select_own"
  on public.win_journal for select
  using (auth.uid() = parent_id);

create policy "win_journal_insert_own"
  on public.win_journal for insert
  with check (auth.uid() = parent_id);

create policy "win_journal_update_own"
  on public.win_journal for update
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

create policy "win_journal_delete_own"
  on public.win_journal for delete
  using (auth.uid() = parent_id);

-- Grant authenticated users access
grant select, insert, update, delete on public.win_journal to authenticated;
