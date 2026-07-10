-- ============================================================
-- Migration 003: Multi-User Auth & Row Level Security
-- Run this in your Supabase SQL Editor if you already have data.
-- ============================================================

-- Add user_id column to each table (nullable initially for existing rows).
alter table files    add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table folders  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table notes    add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table notes    add column if not exists pinned boolean default false;
alter table tasks    add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table projects add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Backfill existing rows with a default user ID.
-- If you have existing data, set this to your actual auth user ID first:
--   update files    set user_id = 'YOUR_USER_UUID' where user_id is null;
--   update folders  set user_id = 'YOUR_USER_UUID' where user_id is null;
--   update notes    set user_id = 'YOUR_USER_UUID' where user_id is null;
--   update tasks    set user_id = 'YOUR_USER_UUID' where user_id is null;
--   update projects set user_id = 'YOUR_USER_UUID' where user_id is null;

-- Once backfilled, make user_id NOT NULL.
-- alter table files    alter column user_id set not null;
-- alter table folders  alter column user_id set not null;
-- alter table notes    alter column user_id set not null;
-- alter table tasks    alter column user_id set not null;
-- alter table projects alter column user_id set not null;

-- Drop existing unique constraint on folder name (was single-user).
alter table folders  drop constraint if exists folders_name_key;

-- Add per-user unique constraint on folder name.
alter table folders  add constraint folders_user_id_name_key unique (user_id, name);

-- Drop existing unique constraint on project name.
alter table projects drop constraint if exists projects_name_key;

-- Add per-user unique constraint on project name.
alter table projects add constraint projects_user_id_name_key unique (user_id, name);

-- Indexes for user_id queries.
create index if not exists idx_files_user_id    on files(user_id);
create index if not exists idx_folders_user_id  on folders(user_id);
create index if not exists idx_notes_user_id    on notes(user_id);
create index if not exists idx_tasks_user_id    on tasks(user_id);
create index if not exists idx_projects_user_id on projects(user_id);

-- Enable RLS on every table.
alter table files    enable row level security;
alter table folders  enable row level security;
alter table notes    enable row level security;
alter table tasks    enable row level security;
alter table projects enable row level security;

-- Files policies.
create policy "Users can view their own files" on files
  for select using (auth.uid() = user_id);
create policy "Users can insert their own files" on files
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own files" on files
  for update using (auth.uid() = user_id);
create policy "Users can delete their own files" on files
  for delete using (auth.uid() = user_id);

-- Folders policies.
create policy "Users can view their own folders" on folders
  for select using (auth.uid() = user_id);
create policy "Users can insert their own folders" on folders
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own folders" on folders
  for update using (auth.uid() = user_id);
create policy "Users can delete their own folders" on folders
  for delete using (auth.uid() = user_id);

-- Notes policies.
create policy "Users can view their own notes" on notes
  for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on notes
  for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on notes
  for delete using (auth.uid() = user_id);

-- Tasks policies.
create policy "Users can view their own tasks" on tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- Projects policies.
create policy "Users can view their own projects" on projects
  for select using (auth.uid() = user_id);
create policy "Users can insert their own projects" on projects
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own projects" on projects
  for update using (auth.uid() = user_id);
create policy "Users can delete their own projects" on projects
  for delete using (auth.uid() = user_id);
