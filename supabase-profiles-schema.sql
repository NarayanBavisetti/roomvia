-- Profiles table to store per-user account type (normal|broker) with one-time lock
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'normal' check (account_type in ('normal','broker')),
  locked boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);


