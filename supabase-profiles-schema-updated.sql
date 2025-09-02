-- Updated Profiles table to include name field
-- Add name column to existing profiles table
alter table public.profiles add column if not exists name text;

-- Update existing schema comment
comment on table public.profiles is 'User profiles with account type, name, and one-time lock functionality';

-- If you're creating the table from scratch, use this instead:
/*
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  account_type text not null default 'normal' check (account_type in ('normal','broker')),
  locked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);
*/