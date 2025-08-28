create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  hours numeric not null check (hours >= 0),
  notes text,
  created_at timestamp with time zone default now()
);
create table if not exists public.pto_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id uuid not null,
  status text not null check (status in ('pending','approved','rejected')),
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamp with time zone default now()
);
alter table public.timesheets enable row level security;
alter table public.pto_requests enable row level security;
create policy "timesheets_owner" on public.timesheets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pto_owner_select" on public.pto_requests
  for select using (auth.uid() = user_id);
create policy "pto_owner_insert" on public.pto_requests
  for insert with check (auth.uid() = user_id);
