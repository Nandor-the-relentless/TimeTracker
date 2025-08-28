-- Treats Time by WT — Supabase schema (RLS-first)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('user','manager','admin')),
  department text,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create or replace function public.is_admin(uid uuid) returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.role = 'admin')
$$;
create policy profiles_self on public.profiles for select using (id = auth.uid() or is_admin(auth.uid())) with check (id = auth.uid() or is_admin(auth.uid()));
