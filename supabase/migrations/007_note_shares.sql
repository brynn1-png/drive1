-- =============================================================
-- MyDrive — Supabase Migration 007
-- Adds note sharing between registered users.
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Paste & Run
-- =============================================================

-- note_shares: lets a note's owner grant another registered user
-- read access to that note. Deleting the note (or the profile of
-- either party) cascades and removes the share automatically.
--
-- owner_user_id is stored on the row so the note_shares policies never
-- have to query the notes table — otherwise the notes policy (which
-- reads note_shares) and a note_shares policy (which reads notes)
-- would recurse infinitely under RLS.
create table if not exists public.note_shares (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  shared_with_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (note_id, shared_with_user_id)
);

alter table public.note_shares enable row level security;

-- Security-definer helper: does the *current* JWT user own this note?
-- It queries notes with RLS bypassed, so the note_shares insert policy
-- can verify ownership without recursing into the notes policy.
create or replace function public.is_note_owner(note_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.notes
    where notes.id = note_id
      and notes.user_id = auth.uid()
  );
$$;

-- Notes: owners can still see their own notes (existing policy), and
-- recipients can now also read any note that has a share row for them.
create policy "Users can view notes shared with them" on public.notes
  for select using (
    exists (
      select 1 from public.note_shares
      where note_shares.note_id = notes.id
        and note_shares.shared_with_user_id = auth.uid()
    )
  );

-- note_shares: only the note's owner can create a share, and never to
-- themselves. The FK to profiles ensures recipients actually exist.
create policy "Note owners can insert shares" on public.note_shares
  for insert with check (
    owner_user_id = auth.uid()
    and shared_with_user_id <> auth.uid()
    and public.is_note_owner(note_id)
  );

-- note_shares: owners can see all shares on their notes; recipients can
-- see the rows where they are the recipient (so they can tell a note
-- was shared with them).
create policy "Users can view their note shares" on public.note_shares
  for select using (
    owner_user_id = auth.uid()
    or shared_with_user_id = auth.uid()
  );

-- note_shares: only the owner can revoke a share.
create policy "Note owners can delete shares" on public.note_shares
  for delete using (owner_user_id = auth.uid());

-- Profiles: open the registered-user list to every signed-in user so
-- the Share page can offer a picker of who to share with. Scoped to the
-- authenticated role so anonymous visitors still can't read it.
create policy "Authenticated users can view all profiles" on public.profiles
  for select to authenticated using (true);