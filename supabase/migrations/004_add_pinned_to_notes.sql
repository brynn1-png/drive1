-- ============================================================
-- Migration 004: Add pinned column to notes
-- Run this in your Supabase SQL Editor.
-- ============================================================

alter table notes add column if not exists pinned boolean default false;
