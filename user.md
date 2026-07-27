---
title: Multi-User Authentication & Per-User Data Isolation Plan
tags: [mydrive, planning, auth, historical]
aliases: [user]
---

> [!note] This is the original design doc for adding auth. It shipped — see [[SYSTEM_OVERVIEW]] for the current data model and RLS setup.

# Plan: Multi-User Authentication & Per-User Data Isolation

## Overview
Add Supabase Auth (email/password) to MyDrive. Every feature (files, notes, tasks, folders, projects) becomes isolated per user. Each user only sees their own data.

---

## Step 1: Database Schema Changes (`schema.sql` + new migration)

Add `user_id uuid` (FK to `auth.users`) to **all 5 tables**: `files`, `folders`, `notes`, `tasks`, `projects`.

Enable **Row Level Security (RLS)** on every table with policies:
- `SELECT` — only rows where `user_id = auth.uid()`
- `INSERT` — only if `user_id = auth.uid()`
- `UPDATE` — only rows where `user_id = auth.uid()`
- `DELETE` — only rows where `user_id = auth.uid()`

Add indexes on `user_id` for each table for query performance.

---

## Step 2: Create `js/auth.js` (new file)

New `Auth` module handling:
- `Auth.init()` — check for existing session on load
- `Auth.signUp(email, password)` — register new user
- `Auth.signIn(email, password)` — login
- `Auth.signOut()` — logout
- `Auth.getUser()` — return current user or null
- `Auth.onAuthChange(callback)` — subscribe to session changes
- `Auth.renderLoginScreen()` — show login/signup form in a modal or full-screen overlay
- Store user session in `Auth._user` and `Auth._session`

---

## Step 3: Add Login/Signup UI (`index.html`)

- Add a `#auth-screen` div (full-screen overlay) with login/signup form (email, password, toggle between modes)
- Add a user info section in the sidebar footer (email display + logout button)
- The auth screen is shown by default; on successful login it hides and the app loads

---

## Step 4: Update `js/db.js` — Scope All Queries by `user_id`

Every DB function gets `user_id` filtering:
- `insertFile`, `insertNote`, `insertTask`, `createProject`, `createFolder` — set `user_id` on insert
- `getFiles`, `getNotes`, `getTasks`, `getProjects`, `getFolders` — `.eq('user_id', uid)`
- `deleteFile`, `deleteNote`, `deleteTask`, `deleteProject`, `deleteFolder` — `.eq('user_id', uid)`
- `updateTask`, `updateNote`, `moveFile`, `renameProject` — `.eq('user_id', uid)`

---

## Step 5: Update `js/storage.js` — User-Scoped File Paths

Change storage paths from `filename` to `{user_id}/{filename}` so each user's files are in a separate folder in the Supabase Storage bucket.

---

## Step 6: Update `js/app.js` — Auth-Gated Init

- `App.init()` calls `Auth.init()` first
- If no session → show auth screen, stop init
- If session exists → proceed with normal init, pass `user_id` to all modules
- Add `Auth.onAuthChange()` listener to re-init or show login on logout

---

## Step 7: Update `js/config.js` — Add Auth Redirect URL

Add a `SITE_URL` constant for Supabase auth redirect.

---

## Step 8: Update `css/style.css` — Auth Screen Styles

Add styles for the login/signup form matching the existing dark glassmorphism design system.

---

## Files Modified

| File | Action |
|---|---|
| `schema.sql` | Add `user_id` columns, enable RLS, add policies |
| `js/auth.js` | **New** — auth module |
| `js/db.js` | Add `user_id` filtering to all queries |
| `js/storage.js` | User-scoped storage paths |
| `js/app.js` | Auth-gated initialization |
| `index.html` | Auth screen HTML, sidebar user info, load `auth.js` |
| `css/style.css` | Auth screen styles |

---

## Migration SQL (new file: `supabase/migrations/003_add_user_id.sql`)
```sql
-- Add user_id to all tables
-- Enable RLS
-- Create policies
-- Add indexes
```

---

## Security Notes
- RLS policies ensure database-level isolation (even if JS is bypassed)
- Anon key stays in config.js (same as current) — RLS prevents cross-user access
- Storage bucket can stay public or be switched to private with signed URLs (optional upgrade)
