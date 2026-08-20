-- =============================================================
-- MyDrive — Supabase Migration 009
-- Adds file sharing between registered users.
-- Run this in the Supabase SQL Editor after migration 008:
-- Dashboard → SQL Editor → New query → Paste & Run
-- =============================================================

-- file_shares: lets a file's owner grant another registered user
-- access to that file. Deleting the file (or the profile of
-- either party) cascades and removes the share automatically.
--
-- owner_user_id is stored on the row so the file_shares policies never
-- have to query the files table — otherwise the files policy (which
-- reads file_shares) and a file_shares policy (which reads files)
-- would recurse infinitely under RLS.
create table if not exists public.file_shares (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  shared_with_user_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null default 'view' check (permission in ('view', 'edit')),
  created_at timestamptz not null default now(),
  unique (file_id, shared_with_user_id)
);

alter table public.file_shares enable row level security;

-- Security-definer helper: does the *current* JWT user own this file?
-- It queries files with RLS bypassed, so the file_shares insert policy
-- can verify ownership without recursing into the files policy.
create or replace function public.is_file_owner(file_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.files
    where files.id = file_id
      and files.user_id = auth.uid()
  );
$$;

-- Files: owners can still see their own files (existing policy), and
-- recipients can now also read any file that has a share row for them.
create policy "Users can view files shared with them" on public.files
  for select using (
    exists (
      select 1 from public.file_shares
      where file_shares.file_id = files.id
        and file_shares.shared_with_user_id = auth.uid()
    )
  );

-- Files: recipients with 'edit' permission can update file metadata (e.g. move to folder)
create policy "Shared editors can update files" on public.files
  for update using (
    exists (
      select 1 from public.file_shares
      where file_shares.file_id = files.id
        and file_shares.shared_with_user_id = auth.uid()
        and file_shares.permission = 'edit'
    )
  );

-- Files: recipients with 'edit' permission can delete files
create policy "Shared editors can delete files" on public.files
  for delete using (
    exists (
      select 1 from public.file_shares
      where file_shares.file_id = files.id
        and file_shares.shared_with_user_id = auth.uid()
        and file_shares.permission = 'edit'
    )
  );

-- file_shares: only the file's owner can create a share, and never to
-- themselves. The FK to profiles ensures recipients actually exist.
create policy "File owners can insert shares" on public.file_shares
  for insert with check (
    owner_user_id = auth.uid()
    and shared_with_user_id <> auth.uid()
    and public.is_file_owner(file_id)
  );

-- file_shares: owners can see all shares on their files; recipients can
-- see the rows where they are the recipient (so they can tell a file
-- was shared with them).
create policy "Users can view their file shares" on public.file_shares
  for select using (
    owner_user_id = auth.uid()
    or shared_with_user_id = auth.uid()
  );

-- file_shares: only the owner can revoke a share.
create policy "File owners can delete shares" on public.file_shares
  for delete using (owner_user_id = auth.uid());

-- file_shares: only the owner can update permission
create policy "File owners can update shares" on public.file_shares
  for update using (owner_user_id = auth.uid());
