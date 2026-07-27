/**
 * js/notes.js
 * -----------
 * Notes feature — CRUD + inline editor with auto-save.
 */

const Notes = {
  _notes: [],
  _activeNoteId: null,
  _saveTimer: null,

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    const container = document.getElementById('notes-container');
    if (container) {
      container.innerHTML = '<div class="loading-state"><div class="spinner" aria-hidden="true"></div><div>Loading your notes...</div></div>';
    }
    this._notes = await DB.getNotes();
    this.render();
    this._updateCount();
  },

  render() {
    const container = document.getElementById('notes-container');
    if (!container) return;

    container.innerHTML = '';

    if (this._notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="empty-title">No notes yet</div>
          <div class="empty-subtitle">Capture your first idea, list, or reminder</div>
          <button class="btn btn-primary empty-cta" id="notes-empty-cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Note
          </button>
        </div>`;
      document.getElementById('notes-empty-cta').addEventListener('click', () => this.createNote());
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'notes-grid';

    for (const note of this._notes) {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.dataset.id = note.id;

      const title = this._esc(note.title || 'Untitled');
      const snippet = this._esc((note.content || 'Empty note').slice(0, 120));
      const date = this._formatDate(note.updated_at || note.created_at);
      const pinnedClass = note.pinned ? ' pinned' : '';
      const pinIcon = note.pinned
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg>';

      card.className = `note-card${pinnedClass}`;
      card.dataset.id = note.id;

      card.innerHTML = `
        <div class="note-card-actions-row">
          <button class="note-card-pin${note.pinned ? ' active' : ''}" data-action="pin-note" data-id="${note.id}" title="${note.pinned ? 'Unpin note' : 'Pin to top'}">${pinIcon}</button>
          <button class="note-card-delete" data-action="delete-note" data-id="${note.id}" title="Delete note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="note-card-title">${title}</div>
        <div class="note-card-snippet">${snippet}</div>
        <div class="note-card-footer">
          <span class="note-card-date">${date}</span>
        </div>`;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        this.openNote(note.id);
      });

      grid.appendChild(card);
    }

    container.appendChild(grid);

    container.querySelectorAll('[data-action="delete-note"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNote(btn.dataset.id);
      });
    });

    container.querySelectorAll('[data-action="pin-note"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePin(btn.dataset.id);
      });
    });
  },

  openNote(id) {
    const note = this._notes.find((n) => n.id === id);
    if (!note) return;

    this._activeNoteId = id;

    const titleInput = document.getElementById('note-title-input');
    const textarea = document.getElementById('note-textarea');
    const backBtn = document.getElementById('note-back-btn');
    const pinBtn = document.getElementById('note-pin-btn');

    const editor = document.getElementById('note-editor-modal');

    titleInput.value = note.title || '';
    textarea.value = note.content || '';

    if (backBtn) {
      backBtn.onclick = () => this.closeNote();
    }

    editor.onclick = (e) => { if (e.target === editor) this.closeNote(); };

    if (pinBtn) {
      pinBtn.onclick = () => this.togglePin(id);
      pinBtn.classList.toggle('active', note.pinned);
      pinBtn.innerHTML = note.pinned
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg> Unpin'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg> Pin';
    }

    editor.classList.remove('hidden');
    textarea.focus();
    this._attachAutoSave();
    this.loadChecklist(id);
  },

  closeNote() {
    this._activeNoteId = null;
    clearTimeout(this._saveTimer);
    document.getElementById('note-editor-modal').classList.add('hidden');
    this.render();
  },

  async createNote() {
    const modal = document.getElementById('note-create-modal');
    const input = document.getElementById('note-create-input');
    const confirmBtn = document.getElementById('note-create-confirm');
    const cancelBtn = document.getElementById('note-create-cancel');

    input.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);

    const cleanup = () => {
      Confirm.hideModal('note-create-modal');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      modal.onclick = null;
      input.onkeydown = null;
    };

    confirmBtn.onclick = async () => {
      const title = input.value.trim() || 'Untitled';
      cleanup();
      try {
        const note = await DB.insertNote({ title, content: '' });
        this._notes.unshift(note);
        this.render();
        this._updateCount();
        this.openNote(note.id);
        Toast.show('Note created.', 'success');
      } catch (err) {
        console.error(err);
        Toast.show(`Failed to create note: ${friendlyError(err)}`, 'error');
      }
    };

    cancelBtn.onclick = cleanup;
    modal.onclick = (e) => { if (e.target === modal) cleanup(); };
    input.onkeydown = (e) => { if (e.key === 'Enter') confirmBtn.click(); };
  },

  async deleteNote(id) {
    const confirmed = await Confirm.show({
      title: 'Delete Note?',
      description: 'Delete this note? This cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await DB.deleteNote(id);
      this._notes = this._notes.filter((n) => n.id !== id);
      if (this._activeNoteId === id) this._activeNoteId = null;
      this.render();
      this._updateCount();
      Toast.show('Note deleted.', 'success');
    } catch (err) {
      console.error(err);
      Toast.show('Failed to delete note.', 'error');
    }
  },

  async togglePin(id) {
    const note = this._notes.find((n) => n.id === id);
    if (!note) return;
    try {
      const updated = await DB.updateNote(id, { pinned: !note.pinned });
      const idx = this._notes.findIndex((n) => n.id === id);
      if (idx !== -1) this._notes[idx] = updated;
      this._notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      this.render();
      Toast.show(note.pinned ? 'Note unpinned.' : 'Note pinned to top.', 'success');
    } catch (err) {
      console.error(err);
      Toast.show('Failed to update note.', 'error');
    }
  },

  _updateCount() {
    const badge = document.getElementById('notes-count');
    if (badge) badge.textContent = this._notes.length || '';
  },

  /* ------------------------------------------------------------------ */
  /*  Auto-save                                                           */
  /* ------------------------------------------------------------------ */

  _attachAutoSave() {
    const titleInput = document.getElementById('note-title-input');
    const textarea = document.getElementById('note-textarea');
    if (!titleInput || !textarea) return;

    const handler = () => {
      this._showSaving();
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this._autoSave(), 500);
    };

    titleInput.oninput = handler;
    textarea.oninput = handler;
  },

  _showSaving() {
    const status = document.getElementById('note-save-status');
    if (!status) return;
    status.classList.add('saving');
    status.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
      Saving...
    `;
  },

  _showSaved() {
    const status = document.getElementById('note-save-status');
    if (!status) return;
    status.classList.remove('saving');
    status.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Saved
    `;
  },

  async _autoSave() {
    if (!this._activeNoteId) return;

    const titleInput = document.getElementById('note-title-input');
    const textarea = document.getElementById('note-textarea');
    if (!titleInput || !textarea) return;

    const title = titleInput.value.trim() || 'Untitled';
    const content = textarea.value;

    try {
      const updated = await DB.updateNote(this._activeNoteId, { title, content });
      const idx = this._notes.findIndex((n) => n.id === this._activeNoteId);
      if (idx !== -1) this._notes[idx] = updated;

      const badge = document.getElementById('notes-count');
      if (badge) badge.textContent = this._notes.length || '';

      this._showSaved();
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  _formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  async loadChecklist(id) {
    const listContainer = document.getElementById('note-checklist-list');
    const countSpan = document.getElementById('note-checklist-count');
    const addInput = document.getElementById('note-checklist-add-input');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="loading-state" style="padding:10px 0;font-size:12px;"><div class="spinner" aria-hidden="true" style="width:14px;height:14px;border-width:2px"></div><div>Loading tasks...</div></div>';
    if (countSpan) countSpan.textContent = '';

    try {
      const tasks = await DB.getTasks({ noteId: id });
      listContainer.innerHTML = '';

      if (tasks.length === 0) {
        if (countSpan) countSpan.textContent = '0 tasks';
      } else {
        const completed = tasks.filter((t) => t.completed).length;
        if (countSpan) countSpan.textContent = `${completed} of ${tasks.length} done`;

        for (const task of tasks) {
          const item = document.createElement('div');
          item.className = `note-checklist-item${task.completed ? ' completed' : ''}`;
          item.dataset.id = task.id;

          const checkbox = document.createElement('button');
          checkbox.className = 'note-checklist-item-checkbox';
          checkbox.setAttribute('aria-label', task.completed ? 'Mark as active' : 'Mark as completed');
          checkbox.innerHTML = task.completed
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';

          checkbox.onclick = async (e) => {
            e.stopPropagation();
            try {
              await DB.updateTask(task.id, { completed: !task.completed });
              await this.loadChecklist(id);
              if (typeof Tasks !== 'undefined' && Tasks.load) Tasks.load();
            } catch (err) {
              console.error(err);
              Toast.show('Failed to update task.', 'error');
            }
          };

          const label = document.createElement('span');
          label.className = 'note-checklist-item-label';
          label.textContent = task.title;

          const delBtn = document.createElement('button');
          delBtn.className = 'note-checklist-item-delete';
          delBtn.setAttribute('aria-label', 'Delete task');
          delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

          delBtn.onclick = async (e) => {
            e.stopPropagation();
            const confirmed = await Confirm.show({
              title: 'Delete Task?',
              description: 'Delete this task? This cannot be undone.',
              confirmText: 'Delete',
              type: 'danger',
            });
            if (!confirmed) return;
            try {
              await DB.deleteTask(task.id);
              await this.loadChecklist(id);
              if (typeof Tasks !== 'undefined' && Tasks.load) Tasks.load();
              Toast.show('Task deleted.', 'success');
            } catch (err) {
              console.error(err);
              Toast.show('Failed to delete task.', 'error');
            }
          };

          item.appendChild(checkbox);
          item.appendChild(label);
          item.appendChild(delBtn);
          listContainer.appendChild(item);
        }
      }

      // Attach add input handler
      if (addInput) {
        addInput.onkeydown = async (e) => {
          if (e.key === 'Enter') {
            const title = addInput.value.trim();
            if (!title) return;
            try {
              await DB.insertTask(title, null, null, id);
              addInput.value = '';
              await this.loadChecklist(id);
              if (typeof Tasks !== 'undefined' && Tasks.load) Tasks.load();
              Toast.show('Task added to note.', 'success');
            } catch (err) {
              console.error(err);
              Toast.show('Failed to add task.', 'error');
            }
          }
        };
      }
    } catch (err) {
      console.error(err);
      listContainer.innerHTML = '<div style="color:var(--error);font-size:12px;padding:10px 0;">Failed to load checklist.</div>';
    }
  },
};
