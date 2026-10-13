# Decisions Log

## Current State Summary (Updated: 2026-10-14)

- **Latest Decision:** Store restricted rich content in nullable `notes.content_delta`, retaining `content` as plain text
- **In Progress:** None — permissions feature complete

---

## [2026-10-14] — Rich note content

**Decision:** Use bundled Quill 2.0.3 with only bold and one highlight color. Save its restricted Delta in `content_delta` and plain text in the existing `content` column.

**Why:** Existing notes and snippets remain readable; shared content can be rendered from a small allowlist; the app needs no build step or runtime CDN for the editor.

**Alternative considered:** Hand-built `contenteditable` formatting would require maintaining browser selection, paste, and undo behavior.

---

## [2026-08-20] — Task #1 follow-up 4: Note sharing permissions

**Decision:** Two permission levels — "View only" (default) and "Can edit". Owner picks permission via radio buttons when sharing. Existing shares show a clickable badge to toggle permission.

**Why:**
- Simple binary covers the common use cases (read-only share vs collaborative edit)
- Radio buttons are clear and explicit at share time
- Click-to-toggle on existing shares is fast for changing permission without revoke+re-share

**Technical details:**
- New `permission` column on `note_shares` (text, default 'view', check constraint for 'view'/'edit')
- RLS: new policies allow recipients with `permission = 'edit'` to update/delete the shared note
- Shared notes in the Notes grid show permission badge; opening a shared note with edit permission enables the editor with auto-save

**Alternatives considered:**
- Dropdown selector: rejected — radio buttons are simpler for two options
- Permission per share only (no edit on notes side): rejected — user wants shared notes to appear in Notes view

---

## [2026-08-20] — Task #1 follow-up 3: Share page design decisions

**Decision:** Share page UI upgraded to match Neo Brutalism design system consistently with other views.

**Design choices:**
- Hover translate + shadow effect on selectable cards (consistent with `.note-card` hover behavior)
- Lime green accent on selected checkboxes/cards (ties to the app's secondary accent color)
- Solid black accent background for share tags (was muted gray — now more visible)
- Initials-based avatars on user rows (no profile images in the system yet, so derive from email)
- Select All / Deselect All toggle in panel headers (top-right, same as other app buttons)
- Animated expand/collapse on incoming cards (CSS keyframe, not JS-driven)
- Chevron indicator on incoming cards (rotates 180° on expand)
- Sender info ("from email") shown on incoming cards (the `owner_user_id` is already on the share row)

**Alternatives considered:**
- Profile images: not added — the profiles table has no image column yet; initials avatars are a lightweight first step
- Select dropdown for users: rejected — checkbox list is better for batch selection

---

## [2026-08-20] — Task #1: Note sharing design decisions

**Decision:** In-app Share page (nav item + `js/share.js`) instead of email-based or link-based sharing. User picks recipients from the registered-users list; supports single and batch (N notes × M users) sharing.

**Why:**
- Keeps everything inside the app and reuses the existing `profiles` table for the picker.
- Batch share is a natural fit for a checkbox UI + single bulk insert.
- Link/anonymous sharing would require `anon`-role RLS design — larger change, rejected.

**Alternatives considered / rejected:**
- Email-triggered share (enter an email): rejected by user in favor of in-app picker.
- Public share link with token: rejected (anon access complexity).
- Opening `profiles` narrowly via a search RPC: rejected by user; chose open profiles (simplest; privacy tradeoff documented in SYSTEM_OVERVIEW).

**Key technical decisions:**
- Added `owner_user_id` column + `is_note_owner()` security-definer function to `note_shares` RLS. This breaks the mutual-recursion loop that would otherwise occur because the `notes` select policy reads `note_shares` and a `note_shares` policy would read `notes`.
- Recipients get **read-only** access (notes update/delete policies remain owner-only). Shared notes are viewed inline (expandable) in the Share page rather than wired into the full note editor, to avoid touching notes.js auto-save/pin/delete for non-owned notes.
- Self-sharing is blocked at the DB level (`shared_with_user_id <> auth.uid()`); duplicate shares blocked by unique constraint + client-side pre-filter.

---
