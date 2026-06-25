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
    this._notes = await DB.getNotes();
    this.render();
    this._updateCount();
  },

  render() {
    const container = document.getElementById('notes-container');
    const editor = document.getElementById('note-editor');
    if (!container) return;

    if (this._activeNoteId) {
      container.classList.add('hidden');
      editor.classList.remove('hidden');
      return;
    }

    container.classList.remove('hidden');
    editor.classList.add('hidden');
    container.innerHTML = '';

    if (this._notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No notes yet</div>
          <div class="empty-subtitle">Click <strong>New Note</strong> to get started</div>
        </div>`;
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

      card.innerHTML = `
        <div class="note-card-title">${title}</div>
        <div class="note-card-snippet">${snippet}</div>
        <div class="note-card-footer">
          <span class="note-card-date">${date}</span>
          <button class="note-card-delete" data-action="delete-note" data-id="${note.id}" title="Delete note">&times;</button>
        </div>`;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="delete-note"]')) return;
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
  },

  openNote(id) {
    const note = this._notes.find((n) => n.id === id);
    if (!note) return;

    this._activeNoteId = id;

    const titleInput = document.getElementById('note-title-input');
    const textarea = document.getElementById('note-textarea');
    const backBtn = document.getElementById('note-back-btn');

    titleInput.value = note.title || '';
    textarea.value = note.content || '';

    if (backBtn) {
      backBtn.onclick = () => this.closeNote();
    }

    this.render();

    textarea.focus();
    this._attachAutoSave();
  },

  closeNote() {
    this._activeNoteId = null;
    clearTimeout(this._saveTimer);
    this.render();
  },

  async createNote() {
    try {
      const note = await DB.insertNote({ title: 'Untitled', content: '' });
      this._notes.unshift(note);
      this.openNote(note.id);
    } catch (err) {
      console.error(err);
      Toast.show('Failed to create note.', 'error');
    }
  },

  async deleteNote(id) {
    if (!confirm('Delete this note? This cannot be undone.')) return;
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
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this._autoSave(), 500);
    };

    titleInput.oninput = handler;
    textarea.oninput = handler;
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
};
