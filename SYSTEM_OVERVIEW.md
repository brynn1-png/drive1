---
title: MyDrive — System Overview
tags: [mydrive, architecture, supabase, reference]
aliases: [System Overview, MyDrive Overview]
updated: 2026-10-14
---

# MyDrive — System Overview

Reference doc for future work on this app. Last updated 2026-10-14.

> [!info] Related notes
> - [[plan]] — original build plan / feature checklist (historical)
> - [[user]] — original auth/multi-user design doc (historical)

## What this is

A personal, multi-user "drive" web app: file storage + folders, notes, tasks/projects,
and a lightweight admin view — all client-side, talking directly to Supabase (Postgres +
Auth + Storage). No backend server, no build step, no framework.

## Stack

- **Frontend**: plain HTML/CSS/vanilla JS (no bundler, no framework). Two visual themes
  (classic flat + [[theme-3d.css]]), five color palettes ([[palettes.css]]), switchable
  in Settings.
- **Note editor**: bundled Quill 2.0.3 assets in `vendor/quill/`, limited to bold and
  one highlight color. `js/note-format.js` converts restricted Delta content to
  safe display HTML and plain text.
- **Backend**: Supabase — Postgres database (via PostgREST/`supabase-js`), Supabase Auth
  (email/password), Supabase Storage (public `drive` bucket).
- **Auth model**: the browser talks to Supabase directly using the **anon/public key**
  ([[config.js]]). There is no server-side component, so all access control is enforced
  by Postgres **Row Level Security (RLS)** policies, not by application code. The
  `service_role` key must never be added to client code — it bypasses RLS entirely.

## File structure (`drive1/`)

- [[index.html]] — single-page app shell; all views live here, toggled via classes
- css/
  - [[style.css]] — main stylesheet
  - [[theme-3d.css]] — 3D theme overrides
  - [[palettes.css]] — 5 color-scheme overrides (Classic/Violet/Ocean/Coral/Forest),
    loaded last so it always wins; toggled via `#palette-picker` in `app.js`, persisted
    to `localStorage["ui-palette"]`
- js/
  - [[config.js]] — Supabase URL + anon key
  - [[supabase-client.js]] — creates the shared `supabaseClient`
  - [[auth.js]] — `Auth`: session state, sign in/up/out, password change
  - [[db.js]] — `DB`: all Postgres reads/writes (one function per operation)
  - [[storage.js]] — `Storage`: Supabase Storage upload/delete/URL helpers
  - [[app.js]] — `App`: entry point, view routing, global UI wiring
  - [[upload.js]] — file upload pipeline (drag-drop, progress, Storage → DB)
  - [[gallery.js]] — file grid/list rendering, lightbox, download/delete/move
  - [[folders.js]] — folder sidebar, breadcrumb, "move file" modal
  - [[notes.js]] — Notes feature (CRUD + auto-save editor)
  - [[tasks.js]] — Tasks feature, grouped by project
  - [[projects.js]] — project CRUD (used by tasks.js)
  - [[share.js]] — Share view: pick own notes + registered users to share (single/batch), revoke, and read "shared with me"
  - [[admin.js]] — admin-only "registered users" panel (Settings)
  - [[confirm.js]] — reusable confirm/alert modal helper
- [[schema.sql]] — full current schema, hand-maintained (source of truth to eyeball)
- supabase/migrations/ — incremental SQL migrations, run manually in Supabase SQL Editor:
  - [[001_create_tables.sql]] — `files`, `folders`
  - [[002_add_projects.sql]] — `projects`, `tasks.project_id`
  - [[003_add_auth.sql]] — `user_id` + RLS on every table
  - [[004_add_pinned_to_notes.sql]] — `notes.pinned`
  - [[005_add_note_id_to_tasks.sql]] — `tasks.note_id`
  - [[006_add_admin.sql]] — `profiles`, `admins`, the signup trigger
  - [[007_note_shares.sql]] — `note_shares` + note sharing RLS; opens `profiles` to all authenticated users
  - `008_note_share_permissions.sql` — view/edit sharing permissions
  - `009_file_shares.sql` — in-app file sharing
  - `010_note_rich_content.sql` — nullable `notes.content_delta` for formatted notes

Migrations are **not applied automatically** — there's no CLI/CI wiring. Any new
`NNN_*.sql` file must be pasted into the Supabase Dashboard → SQL Editor and run by hand.

## Data model

All tables live in `public`, all have `user_id uuid references auth.users(id)`, and all
have RLS enabled with `select/insert/update/delete` policies scoped to `auth.uid() = user_id`.

| Table | Purpose | Notable columns | Defined in |
|---|---|---|---|
| `files` | uploaded file metadata | `filename`, `storage_path`, `size`, `file_type`, `folder` | [[001_create_tables.sql]] |
| `folders` | user-created folders | `name` (unique per user) | [[001_create_tables.sql]] |
| `notes` | notes | `title`, `content` (plain text), `content_delta` (formatted text), `pinned`, `updated_at` | [[schema.sql]] / `010_note_rich_content.sql` |
| `tasks` | to-dos | `title`, `completed`, `due_date`, `project_id` (FK), `note_id` (FK) | [[schema.sql]] / [[002_add_projects.sql]] / [[005_add_note_id_to_tasks.sql]] |
| `projects` | task groupings | `name` (unique per user) | [[002_add_projects.sql]] |
| `note_shares` | read-access grants for notes | `note_id` (FK), `owner_user_id`, `shared_with_user_id` (unique pair) | [[007_note_shares.sql]] |
| `profiles` | mirrors `auth.users(id, email)` into `public` so it's queryable via RLS | `email`, `created_at`; kept in sync by an `on_auth_user_created` trigger | [[006_add_admin.sql]] |
| `admins` | allow-list of user IDs with elevated read access | `user_id`; **no insert/update/delete policy** — only editable from the SQL Editor / service role, so a client can never self-promote | [[006_add_admin.sql]] |

All `user_id` columns + RLS policies were added in [[003_add_auth.sql]].

Actual file storage lives in the Supabase Storage bucket `drive` (public, so public URLs
work for previews); `files.storage_path` points into it.

## Key features

- **Files**: upload (drag-drop or picker, via [[upload.js]]), grid/list view
  ([[gallery.js]]), folders ([[folders.js]]), move, download, delete, image lightbox
  preview.
- **Notes** ([[notes.js]]): card grid → editor modal with Expand / Restore, bold,
  highlight, and 500ms auto-save; pin-to-top; per-note checklist (backed by
  `tasks.note_id`). Existing plain-text notes load without conversion until edited.
- **Tasks** ([[tasks.js]]): grouped by project ([[projects.js]]); project cards double
  as rename/delete entry points.
- **Share** ([[share.js]]): pick notes and registered recipients, then grant view or
  edit access; see and revoke grants. Shared notes display formatting safely. RLS
  enforces the selected permission; recipients cannot pin or delete the note.
- **Settings**: appearance (theme + color palette), storage usage meter, change
  password ([[auth.js]]), admin panel (if applicable), sign out.
- **Admin panel** ([[admin.js]]): visible only to accounts listed in the `admins`
  table. Shows every registered user's email + signup date, sourced from `profiles`
  via RLS — the client never talks to `auth.users` or holds a privileged key.

## Notable design decisions / gotchas

- **Settings page layout** uses CSS multi-column (`columns: 400px` on
  `#settings-container`, `break-inside: avoid` per `.settings-section`) rather than CSS
  Grid. Grid was tried first but forces every card in a row to the height of the tallest
  card in that row, which left large dead gaps under shorter cards — multi-column packs
  by actual content height instead. Section order in the HTML determines column
  placement (first sections fill column 1 top-down, etc.).
- **Notes list can go stale**: [[notes.js]]'s `Notes.render()` builds the card grid
  from `Notes._notes`; make sure any mutation to that array (create, edit/close, pin,
  delete) is followed by a `render()` call, or the grid will show outdated
  titles/snippets until the user navigates away from and back to the Notes view (which
  calls `Notes.load()` and re-fetches). `closeNote()` and `createNote()` were
  previously missing this and have since been fixed.
- **Modal close-on-backdrop-click** is a manual per-modal pattern (each modal in
  [[index.html]] wires `modal.onclick = (e) => { if (e.target === modal) close(); }`
  itself) — there's no global handler. When adding a new modal, remember to wire this
  explicitly; it's easy to forget (the note editor modal originally shipped without it).
- **No server-side code at all.** Every access-control decision must be enforced in
  Postgres RLS, not in [[db.js]] — the JS layer is a convenience wrapper, not a
  security boundary. Never add the `service_role` key to any client file.

## Known follow-ups / things not yet done

- [[006_add_admin.sql]] must be run manually in the Supabase SQL Editor before the
  admin panel will work in a given environment.
- [[007_note_shares.sql]] must be run manually too — until it's applied, the Share
  page will show "Failed to load shares" because `note_shares` doesn't exist yet.
- Opening `profiles` to all authenticated users (for the Share picker) means every
  registered user's email is visible to every signed-in user. Fine for a trusted
  personal app; revisit with a narrower search RPC if that ever becomes a concern.
- Shared notes are read-only and viewed inline in the Share page; opening them in
  the full note editor (with the checklist) is a possible follow-up.
- Storage bucket is public — fine for a personal/trusted-user app, but would need
  private buckets + signed URLs if this ever needs to keep files confidential from
  other authenticated users.
