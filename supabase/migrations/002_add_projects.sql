-- =============================================================
-- MyDrive — Supabase Migration 002
-- Add projects table + project_id to tasks
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Paste & Run
-- =============================================================

-- Projects table: groups tasks by project
CREATE TABLE IF NOT EXISTS public.projects (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Add project_id to tasks (nullable — tasks can be uncategorized)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON public.projects(name);

-- Disable RLS for single-user setup
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
