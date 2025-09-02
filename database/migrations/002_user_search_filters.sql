-- User search filters table to store per-user saved/used filters for analytics
-- Includes state/city/area and normalized filters JSON for model consumption

create table if not exists public.user_search_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  city text,
  state text,
  area text,
  property_type text,
  min_rent integer,
  max_rent integer,
  amenities text[],
  filters jsonb not null default '{}',
  filters_hash text generated always as (md5(filters::text)) stored,
  usage_count integer not null default 1,
  last_used timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, filters_hash)
);

alter table public.user_search_filters enable row level security;

-- Policies: users can manage their own rows
drop policy if exists "user_filters_select_own" on public.user_search_filters;
create policy "user_filters_select_own" on public.user_search_filters
  for select using (auth.uid() = user_id);

drop policy if exists "user_filters_insert_own" on public.user_search_filters;
create policy "user_filters_insert_own" on public.user_search_filters
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_filters_update_own" on public.user_search_filters;
create policy "user_filters_update_own" on public.user_search_filters
  for update using (auth.uid() = user_id);

-- Helpful indexes
create index if not exists idx_user_filters_user on public.user_search_filters(user_id);
create index if not exists idx_user_filters_last_used on public.user_search_filters(last_used);
create index if not exists idx_user_filters_city_state_area on public.user_search_filters(city, state, area);
create index if not exists idx_user_filters_property_type on public.user_search_filters(property_type);

-- RPC to upsert/increment a user's filter usage
create or replace function public.upsert_user_search_filter(
  p_user_id uuid,
  p_session_id text,
  p_filters jsonb,
  p_city text,
  p_state text,
  p_area text,
  p_property_type text,
  p_min_rent integer,
  p_max_rent integer,
  p_amenities text[]
) returns void
language plpgsql
security definer
as $$
declare
  v_hash text := md5(coalesce(p_filters, '{}'::jsonb)::text);
begin
  -- Skip if no user (only store per-user)
  if p_user_id is null then
    return;
  end if;

  insert into public.user_search_filters as usf (
    user_id,
    session_id,
    city,
    state,
    area,
    property_type,
    min_rent,
    max_rent,
    amenities,
    filters,
    usage_count,
    last_used,
    updated_at
  ) values (
    p_user_id,
    p_session_id,
    nullif(p_city, ''),
    nullif(p_state, ''),
    nullif(p_area, ''),
    nullif(p_property_type, ''),
    p_min_rent,
    p_max_rent,
    p_amenities,
    coalesce(p_filters, '{}'::jsonb),
    1,
    now(),
    now()
  )
  on conflict (user_id, filters_hash)
  do update set
    usage_count = usf.usage_count + 1,
    last_used = now(),
    session_id = excluded.session_id,
    city = coalesce(excluded.city, usf.city),
    state = coalesce(excluded.state, usf.state),
    area = coalesce(excluded.area, usf.area),
    property_type = coalesce(excluded.property_type, usf.property_type),
    min_rent = coalesce(excluded.min_rent, usf.min_rent),
    max_rent = coalesce(excluded.max_rent, usf.max_rent),
    amenities = coalesce(excluded.amenities, usf.amenities),
    updated_at = now();
end;
$$;

grant execute on function public.upsert_user_search_filter(
  uuid, text, jsonb, text, text, text, text, integer, integer, text[]
) to authenticated;


