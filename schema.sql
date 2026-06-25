-- ============================================================
-- MyDrive Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Files table (existing)
create table if not exists files (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  size bigint not null default 0,
  file_type text,
  folder text not null default 'root',
  created_at timestamptz default now()
);

-- Folders table (existing)
create table if not exists folders (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- Notes table (new)
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  title text not null default 'Untitled',
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks table (new)
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  due_date date,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_files_folder on files(folder);
create index if not exists idx_files_filename on files(filename);
create index if not exists idx_notes_updated_at on notes(updated_at desc);
create index if not exists idx_tasks_created_at on tasks(created_at desc);
create index if not exists idx_tasks_completed on tasks(completed);

-- ============================================================
-- Row Level Security (RLS)
-- Since this is a personal single-user app, we disable RLS
-- to allow full access with the anon key.
-- ============================================================
alter table files disable row level security;
alter table folders disable row level security;
alter table notes disable row level security;
alter table tasks disable row level security;
