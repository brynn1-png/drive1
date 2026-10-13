# Results Log

## Current State Summary (Updated: 2026-10-14)

- **Latest Result:** Find works inside an open note, including formatted and view-only shared notes.
- **Verified:** Headless Chrome checks passed at compact and desktop widths; live Supabase verification still awaits migration 010.

---

## [2026-10-14] — In-note Find

**Outcome:** Added case-insensitive search with match counts and Previous/Next navigation. Enter and Shift+Enter navigate matches; closing the note clears the query. Search does not save or change note content.

**Verification:** Headless Chrome smoke checks passed at effective inner widths 500px, 884px, and 1264px. No signed-in Supabase test was available.

---

## [2026-10-14] — Collapsible note controls

**Outcome:** Phone and tablet layouts show compact Tools and Checklist buttons with both sections collapsed when a note opens. Desktop displays the existing sections.

**Verification:** Headless Chrome smoke check passed at requested 390px, 900px, and 1280px windows (Chrome's effective inner widths were 500px, 884px, and 1264px). View-only shared notes hide both controls; editable shared notes show Tools only.

---

## [2026-10-14] — Note editor expansion and formatting

**Outcome:** Expand / Restore, bold, yellow highlight, and shared-note rendering added. Pending edits are saved when the modal closes.

**Verification:** `node --test tests/note-format.test.js` passed; Chrome smoke checks passed for formatting, expansion, close-save, and shared view/edit modes. No signed-in Supabase test was available in this workspace.

**Deployment step:** Run `supabase/migrations/010_note_rich_content.sql` in Supabase SQL Editor before using the updated app.

---

## [2026-08-20] — Task #1 follow-up 4: Note sharing permissions

**Outcome:** Two-level permission system (view/edit) for note sharing implemented end-to-end.

**What changed:**
- **New:** `supabase/migrations/008_note_share_permissions.sql` — `permission` column, check constraint, RLS policies for shared editors
- **Modified:** `js/db.js` (permission in queries, `updateSharePermission`), `js/share.js` (permission picker, badges, toggle), `js/notes.js` (permission-aware shared note viewer/editor), `css/style.css` (permission picker + badge styles)

**Verified:** `node --check` clean on all modified files. Live test pending after running migrations 007 + 008.

---

## [2026-08-20] — Task #1 follow-up 3: Share page design improvements

**Outcome:** Share page UI polished to match the Neo Brutalism design system.

**What changed:**
- **`css/style.css`** (section 35): Added hover translate + shadow on cards, custom checkbox with lime accent, panel header icons, select-all toggle, user avatars, sender info, chevron indicator, animated expand/collapse, improved tags and revoke button
- **`js/share.js`**: Added SVG icon constants (note, user, share, incoming, chevron, empty state icons, submit icon), `_headerWithToggle` method, `_toggleAll`/`_updateToggle` methods, `_initials` helper, sender info on incoming cards, user avatars on picker/shared rows, chevron on incoming cards

**Verified:** `node --check` clean; headless Chrome screenshot OK; no console errors. Live browser check still pending (needs migration 007 applied).

---

## [2026-08-20] — Task #1 follow-up 2: "Shared with me" expansion bug

**Outcome:** Confirmed the bug and fixed it. Reproduced in headless Chrome: at viewport widths ≤768px (e.g. narrow windows or browser zoom) the single-column mobile layout allowed page scroll, so expanding a long shared note blew the layout out (container 1074px vs 629px available). Desktop (≥768px) never had the bug — panels scroll internally.
**Fix:** `.share-incoming-body` now has `max-height: 40vh; overflow-y: auto`, so a shared note preview is a bounded scrollable block on every screen size.
**Verified (Chrome headless, real stylesheet):** narrow 700px → body capped ~281px; desktop 1280px → `pageScrolls: false`, container fits exactly.

---

## [2026-08-20] — Task #1 follow-up: Share page full-viewport layout

**Outcome:** Share view reworked to fill the viewport with a 2×2 grid; each panel scrolls internally so the page itself has no x/y scrollbar on desktop. Long emails/titles/tags truncate with ellipsis (prevents horizontal overflow). Mobile still page-scrolls in single column.

**What changed:** `js/share.js` (all four sections now inside `.share-layout`), `css/style.css` (section 35 rewritten: full-height flex container, `minmax(0,1fr)` grid rows, `flex:1; min-height:0` scroll lists).

**Verified:** `node --check` on share.js; CSS inspected. Live browser check still pending (needs migration 007 applied).

---

## [2026-08-20] — Task #1: Note sharing

**Outcome:** Feature implemented. No live/DB test run yet — depends on the user applying migration 007 in the Supabase SQL Editor and logging in as two accounts.

**What changed:**
- **New:** `supabase/migrations/007_note_shares.sql`, `js/share.js`
- **Modified:** `js/db.js` (5 sharing functions), `js/app.js` (router), `index.html` (nav + view + script), `css/style.css` (Share styles), `schema.sql`, `SYSTEM_OVERVIEW.md`, plus log files per rules.

**Risks / issues found & fixed during the task:**
- **RLS infinite recursion:** initial `note_shares` policies referenced `notes`, and the `notes` select policy references `note_shares` → would error with "infinite recursion detected in policy". Fixed by storing `owner_user_id` on the share row and verifying ownership via a `SECURITY DEFINER` helper (`is_note_owner`) that bypasses RLS on `notes`.
- **Duplicate shares:** unique(note_id, shared_with_user_id) + client-side pre-filter of already-shared pairs so a repeat share can't fail the whole batch.

**Not yet verified (blocking go-live):**
- SQL migration executes cleanly in Supabase.
- Share/revoke round-trip between two real accounts in the browser.
- `getSharedWithMe` embedding (`note_shares → notes`) returns content correctly through PostgREST.

---
