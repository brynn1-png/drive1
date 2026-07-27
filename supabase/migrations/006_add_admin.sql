-- =============================================================
-- MyDrive — Supabase Migration 006
-- Adds an admin-only "registered users" view for the Settings page.
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Paste & Run
-- =============================================================

-- profiles mirrors auth.users(id, email) into the public schema so it can
-- be queried through PostgREST with normal RLS — auth.users itself is never
-- exposed to the client, and the service_role key is never shipped to it.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- admins lists which user_ids may read every row in profiles.
-- No insert/update/delete policy is defined below, so this table can only
-- be managed from the SQL Editor (or another connection using the
-- service_role key) — a signed-in user can never grant themselves access.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Keep profiles in sync whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts that already existed before this migration.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;

alter table public.profiles enable row level security;
alter table public.admins   enable row level security;

-- profiles: a user can always read their own row; admins can read every row.
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (exists (
    select 1 from public.admins where user_id = auth.uid()
  ));

-- admins: a user may check whether *they themselves* are an admin, nothing more.
create policy "Users can check their own admin status" on public.admins
  for select using (auth.uid() = user_id);

-- Grant the first admin. Replace the email below if needed, or run this
-- statement again later to promote another account.
insert into public.admins (user_id)
select id from auth.users where email = 'bryanmagnaye2003@gmail.com'
on conflict (user_id) do nothing;
