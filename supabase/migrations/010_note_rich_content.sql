-- Run in the Supabase SQL Editor after migration 009.
-- Existing notes remain plain text until edited in the new editor.
alter table public.notes add column if not exists content_delta jsonb;
