# Progress Log

## Current State Summary (Updated: 2026-10-15)

- **Active Task:** Open-note title focus
- **Status:** 🟢 Fixed, browser tested, and committed locally; remote publication pending approval
- **Next Action:** Publish the fix after explicit approval, then test with a signed-in account; migration 010 remains needed for formatted content
- **Blockers:** Automatic approval review rejected the push to the unverified private GitHub remote without explicit authorization
- **Last Completed:** Open-note title focus on 2026-10-15

---

## [2026-10-15] — Open-note title focus

**Status:** 🟢 Fixed locally
**Summary:** Reproduced the title click moving focus back to the note body. A Quill `selection-change` callback called `getFormat()` after the editor blurred, which caused Quill to focus the body again. Formatting controls now update only while the body has focus.
**Verification:** Real mouse click and typing passed in headless Chrome at phone and desktop widths. The complete note-editor smoke check, four note-format tests, syntax checks, and diff check passed.
**Publication:** Committed locally as `6e1eb79`; a push to `origin/main` was rejected by automatic approval review pending explicit user authorization.

---

## [2026-10-15] — Note title entry and rename reliability

**Status:** 🟢 Fixed locally
**Summary:** Reproduced the create dialog disappearing on quick reopen and title-only renames failing against a schema without `content_delta`. Reopening now cancels the pending modal close. Title-only edits save only the title; content edits still save plain text and rich-text data together.
**Verification:** Local Chrome smoke passed at 500px and 1264px effective widths, including title text entry, create, rename, and combined title/content edits. Four note-format tests passed. A signed-in Supabase test remains outstanding.

---

## [2026-10-14] — Find within an open note

**Status:** 🟢 Implemented locally
**Summary:** Added in-note search with match counts, next/previous navigation, and keyboard controls for owned and shared notes.
**Steps completed:**

- [x] Added Find controls to the note modal without changing note content
- [x] Reset search when closing or opening another note
- [x] Verified case-insensitive matching, formatted text, no-match state, keyboard navigation, view-only notes, and no search-triggered saves in Chrome

---

## [2026-10-14] — Collapsible note tools and checklist

**Status:** 🟢 Implemented locally
**Summary:** Tools and Checklist start collapsed on screens up to 1024px and can be expanded independently.
**Steps completed:**

- [x] Added accessible toggles and responsive layout
- [x] Reset toggle state on each note open and respect shared-note permissions
- [x] Verified phone-range, tablet, and desktop layouts in headless Chrome

---

## [2026-10-14] — Expandable formatted note editor

**Status:** 🟢 Implemented locally; live Supabase verification pending
**Summary:** Added Expand / Restore, bold and highlight formatting, safe shared-note display, and save flushing on close.
**Steps completed:**

- [x] Bundled Quill 2.0.3 and license files
- [x] Added `content_delta` migration while preserving plain-text `content`
- [x] Updated owned and shared note editing, display, and save flow
- [x] Added unit tests and headless Chrome smoke checks
- [ ] Apply migration 010 in Supabase and test with a real account

---

## [2026-08-20] — Task #1 follow-up 4: Note sharing permissions (view/edit)

**Status:** 🟢 Done
**Summary:** Added permission system to note sharing — owners can choose "View only" or "Can edit" when sharing. Recipients with edit permission can modify the shared note with auto-save.
**Steps completed:**

- [x] Created `supabase/migrations/008_note_share_permissions.sql` — adds `permission` column (view/edit), check constraint, update/delete RLS policies for shared editors
- [x] Updated `db.js`: `getMyShares` and `getSharedWithMe` now return `permission`; added `updateSharePermission` function
- [x] Updated `share.js`: added permission radio picker (View only / Can edit) in users panel, permission badge on currently-shared rows (click to toggle), permission badge on incoming cards
- [x] Updated `notes.js`: shared notes now carry `_permission` field; `_openSharedNote` checks permission — read-only for view, editable with auto-save for edit
- [x] Added CSS for permission picker and badges (`.share-perm-group`, `.share-perm-badge`, `.share-perm-view`, `.share-perm-edit`)
- [x] `node --check` passes on all modified JS files

---

## [2026-08-20] — Task #1 follow-up 3: Share page design improvements

**Status:** 🟢 Done
**Summary:** Visual polish pass on the Share page to match the Neo Brutalism design system and bring it up to par with other views.
**Steps completed:**

- [x] Added hover translate + shadow effect to note/user selection cards (matching `.note-card` pattern)
- [x] Added custom checkbox styling with lime accent border/background when selected
- [x] Added SVG icons to all empty states (note, user, share, incoming icons)
- [x] Added smooth expand/collapse CSS animation (`@keyframes share-expand-in`) for incoming cards
- [x] Added user avatar (initials-based) to user picker rows and currently-shared rows
- [x] Added sender info ("from user@email") to incoming cards
- [x] Added chevron expand indicator to incoming cards (rotates on expand)
- [x] Added Select All / Deselect All toggle buttons to notes and users panels
- [x] Added panel header icons (note, user, share, incoming icons)
- [x] Improved revoke button with hover translate + red shadow effect
- [x] Improved share tags to use solid accent background instead of muted gray
- [x] `node --check` passes on share.js; headless Chrome screenshot captured successfully

---

## [2026-08-20] — Task #1 follow-up 2: "Shared with me" expansion bug

**Status:** 🟢 Done (confirmed + fixed)
**Summary:** User reported the screen expanding when clicking a shared-with-me note. Reproduced with headless Chrome at viewport widths ≤768px (the single-column mobile layout allowed page scroll, so expanding a long note blew out the container). Fixed by capping `.share-incoming-body` at `max-height: 40vh` with internal `overflow-y: auto`.
**Steps completed:**

- [x] Built standalone HTML harness replicating the Share layout with the real stylesheet
- [x] Confirmed via Chrome headless: desktop (≥768px) never page-scrolls; narrow (<768px) expands
- [x] Applied `max-height: 40vh; overflow-y: auto` to `.share-incoming-body`
- [x] Re-tested: narrow shows body capped at ~281px (was ~4200), desktop still no page scroll
- [x] Removed temp test file; logged

---

## [2026-08-20] — Task #1 follow-up: Share page full-viewport layout

**Status:** 🟢 Done
**Summary:** Share page no longer scrolls the whole page. It now fills the viewport with a 2×2 grid (Your Notes / Share With / Currently Shared / Shared With Me), each panel scrolling internally. Horizontal overflow guarded with ellipsis on emails/titles/tags. Mobile keeps single-column page scroll.
**Steps completed:**

- [x] Moved "Currently Shared" and "Shared With Me" sections into the `.share-layout` grid in `js/share.js` render()
- [x] Reworked share CSS: full-height container, `minmax(0,1fr)` rows, flex-column panels, `flex:1; min-height:0` scroll lists
- [x] Added ellipsis/overflow guards for long emails/titles/tags
- [x] `node --check` passes on share.js; CSS verified by inspection

---

## [2026-08-20] — Task #1: Add in-app note sharing (Share page)

**Status:** 🟢 Done
**Summary:** New Share view lets a user select one or more notes and one or more registered users to share with (single + batch), shows who each note is shared with, allows revoke, and lists notes shared *with* the user (read-only).
**Steps completed:**

- [x] Read current patterns (db.js, app.js, notes.js, index.html, migrations, style.css)
- [x] Created `supabase/migrations/007_note_shares.sql` (note_shares table, is_note_owner helper, RLS, profiles opened to authenticated)
- [x] Added DB functions: getUsers, shareNotes, getMyShares, getSharedWithMe, revokeShare
- [x] Added Share nav item + Share view + script include to index.html
- [x] Created js/share.js (note/user multi-select, batch share, revoke, shared-with-me)
- [x] Wired Share view into app.js router
- [x] Appended Share CSS to style.css
- [x] Updated schema.sql + SYSTEM_OVERVIEW.md
- [x] Fixed RLS mutual-recursion risk found during review (owner_user_id + security-definer helper)
- [x] Verified: `node --check` passes on all touched JS files; HTML/DOM wiring confirmed by inspection
      **Notes:** Migration must be pasted into the Supabase SQL Editor manually (repo convention — no CLI/CI). Browser test pending user's end.

---
