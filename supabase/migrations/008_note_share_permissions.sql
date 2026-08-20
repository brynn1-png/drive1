-- =============================================================
-- MyDrive — Supabase Migration 008
-- Adds permission column to note_shares (view / edit).
-- Run this in the Supabase SQL Editor after migration 007:
-- Dashboard → SQL Editor → New query → Paste & Run
-- =============================================================

-- Add permission column: 'view' (default) or 'edit'
alter table public.note_shares
  add column if not exists permission text not null default 'view';

-- Add a check constraint so only 'view' or 'edit' are allowed
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'note_shares_permission_check'
      and conrelid = 'public.note_shares'::regclass
  ) then
    alter table public.note_shares
      add constraint note_shares_permission_check
      check (permission in ('view', 'edit'));
  end if;
end $$;

-- Allow recipients with 'edit' permission to update the shared note
create policy "Shared editors can update notes" on public.notes
  for update using (
    exists (
      select 1 from public.note_shares
      where note_shares.note_id = notes.id
        and note_shares.shared_with_user_id = auth.uid()
        and note_shares.permission = 'edit'
    )
  );

-- Allow recipients with 'edit' permission to delete the shared note
create policy "Shared editors can delete notes" on public.notes
  for delete using (
    exists (
      select 1 from public.note_shares
      where note_shares.note_id = notes.id
        and note_shares.shared_with_user_id = auth.uid()
        and note_shares.permission = 'edit'
    )
  );
