-- ============================================================
-- MyDrive Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Files table
create table if not exists files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  size bigint not null default 0,
  file_type text,
  folder text not null default 'root',
  created_at timestamptz default now()
);

-- Folders table
create table if not exists folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- Notes table
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- Tasks table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean default false,
  due_date date,
  project_id uuid references projects(id) on delete set null,
  note_id uuid references notes(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_files_user_id on files(user_id);
create index if not exists idx_files_folder on files(folder);
create index if not exists idx_files_filename on files(filename);
create index if not exists idx_folders_user_id on folders(user_id);
create index if not exists idx_notes_user_id on notes(user_id);
create index if not exists idx_notes_updated_at on notes(updated_at desc);
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_tasks_created_at on tasks(created_at desc);
create index if not exists idx_tasks_completed on tasks(completed);
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_note_id on tasks(note_id);
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_name on projects(name);

-- ============================================================
-- Row Level Security (RLS)
-- Each user can only see, insert, update, and delete their own data.
-- ============================================================
alter table files enable row level security;
alter table folders enable row level security;
alter table notes enable row level security;
alter table tasks enable row level security;
alter table projects enable row level security;

-- Files policies
create policy "Users can view their own files" on files
  for select using (auth.uid() = user_id);
create policy "Users can insert their own files" on files
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own files" on files
  for update using (auth.uid() = user_id);
create policy "Users can delete their own files" on files
  for delete using (auth.uid() = user_id);

-- Folders policies
create policy "Users can view their own folders" on folders
  for select using (auth.uid() = user_id);
create policy "Users can insert their own folders" on folders
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own folders" on folders
  for update using (auth.uid() = user_id);
create policy "Users can delete their own folders" on folders
  for delete using (auth.uid() = user_id);

-- Notes policies
create policy "Users can view their own notes" on notes
  for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on notes
  for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on notes
  for delete using (auth.uid() = user_id);

-- Tasks policies
create policy "Users can view their own tasks" on tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- Projects policies
create policy "Users can view their own projects" on projects
  for select using (auth.uid() = user_id);
create policy "Users can insert their own projects" on projects
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own projects" on projects
  for update using (auth.uid() = user_id);
create policy "Users can delete their own projects" on projects
  for delete using (auth.uid() = user_id);
