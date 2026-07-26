-- Link tasks to notes (optional), mirroring the existing project_id link.
-- A note's tasks show as an inline checklist in the note editor; deleting
-- the note un-links its tasks (they become ordinary unlinked tasks)
-- rather than deleting them, same behavior as project_id on delete.
alter table tasks add column if not exists note_id uuid references notes(id) on delete set null;
create index if not exists idx_tasks_note_id on tasks(note_id);
