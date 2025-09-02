-- Saves table for flats and people
create table if not exists saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('flat', 'person')) not null,
  target_id text not null,
  created_at timestamptz default now()
);

create index if not exists idx_saves_user_id on saves(user_id);
create index if not exists idx_saves_type on saves(type);
create unique index if not exists idx_saves_unique on saves(user_id, type, target_id);

alter table saves enable row level security;

-- Policies
create policy "Users can view their saves" on saves
  for select using (auth.uid() = user_id);

create policy "Users can insert their saves" on saves
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their saves" on saves
  for delete using (auth.uid() = user_id);


