-- =============================================================
-- MyDrive — Supabase Migration 001
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Paste & Run
-- =============================================================

-- Files table: stores metadata for every uploaded file
CREATE TABLE IF NOT EXISTS public.files (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     text        NOT NULL,
  storage_path text        NOT NULL UNIQUE,
  size         bigint      DEFAULT 0,
  file_type    text        DEFAULT 'application/octet-stream',
  folder       text        DEFAULT 'root',
  created_at   timestamptz DEFAULT now()
);

-- Folders table: user-created folders (name only)
CREATE TABLE IF NOT EXISTS public.folders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ⚠️  Single-user personal drive — disable RLS for simplicity.
--     If you add authentication later, re-enable and add policies.
ALTER TABLE public.files   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;

-- Seed four default folders
INSERT INTO public.folders (name)
VALUES ('Photos'), ('Documents'), ('Projects'), ('Backups')
ON CONFLICT (name) DO NOTHING;

-- =============================================================
-- Storage bucket setup (do this in the Supabase Dashboard UI):
--
-- 1. Go to Storage → New bucket
-- 2. Name: "drive"
-- 3. ✅ Public bucket (so public URLs work for previews)
-- 4. Save
-- =============================================================
