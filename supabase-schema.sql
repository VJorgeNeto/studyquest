-- =====================================================
-- StudyQuest — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- Table: user_progress
-- Public read, public write (no auth required).
-- Each user gets a random UUID stored in localStorage.
create table if not exists public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null unique,       -- random UUID from localStorage
  display_name text not null default 'Anônimo',
  avatar_emoji text not null default '⚡',  -- chosen by user
  tech         text not null default '',
  xp           integer not null default 0,
  level        integer not null default 1,
  streak       integer not null default 0,
  streak_max   integer not null default 0,
  lessons_done integer not null default 0,
  total_lessons integer not null default 0,
  state_json   jsonb not null default '{}',
  updated_at   timestamptz not null default now()
);

-- Index for leaderboard queries
create index if not exists idx_user_progress_xp on public.user_progress (xp desc);

-- Row Level Security: public read, write only own row (by user_id claim)
alter table public.user_progress enable row level security;

-- Allow anyone to read (public leaderboard)
create policy "Public leaderboard read"
  on public.user_progress for select
  using (true);

-- Allow insert/update only for the matching user_id
-- Since we have no auth, we use a loose policy — anyone can insert/update
-- In production you'd tighten this with a JWT claim
create policy "Upsert own row"
  on public.user_progress for insert
  with check (true);

create policy "Update own row"
  on public.user_progress for update
  using (true);

-- =====================================================
-- Done! Copy your Project URL and anon key from:
-- Supabase Dashboard → Settings → API
-- =====================================================
