/**
 * js/notes.js
 * -----------
 * Notes feature — CRUD + inline editor with auto-save.
 */

const Notes = {
  _notes: [],
  _sharedNotes: [],
  _users: [],
  _activeNoteId: null,
  _saveTimer: null,
  _saveQueue: Promise.resolve(),
  _changeVersion: 0,
  _savedVersion: 0,
  _titleChangeVersion: 0,
  _contentChangeVersion: 0,
  _activeShared: false,
  _canEdit: false,
  _findMatches: [],
  _findPosition: -1,

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    const container = document.getElementById('notes-container');
    if (container) {
      container.innerHTML = '<div class="loading-state"><div class="spinner" aria-hidden="true"></div><div>Loading your notes...</div></div>';
    }
    const [notes, shared, users] = await Promise.all([
      DB.getNotes(),
      DB.getSharedWithMe(),
      DB.getUsers(),
    ]);
    this._notes = notes;
    this._sharedNotes = shared;
    this._users = users;
    this.render();
    this._updateCount();
  },

  render() {
    const container = document.getElementById('notes-container');
    if (!container) return;

    container.innerHTML = '';

    const allNotes = this._notes.length + this._sharedNotes.length;

    if (allNotes === 0) {
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
      grid.appendChild(this._noteCard(note, false));
    }

    for (const share of this._sharedNotes) {
      const note = share.notes || {};
      const sender = this._users.find((u) => u.id === share.owner_user_id);
      const sharedNote = {
        id: share.note_id,
        title: note.title || 'Untitled',
        content: note.content || '',
        content_delta: note.content_delta || null,
        updated_at: note.updated_at,
        created_at: share.created_at,
        _isShared: true,
        _sharedBy: sender ? sender.email : 'someone',
        _permission: share.permission || 'view',
      };
      grid.appendChild(this._noteCard(sharedNote, true));
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

  _noteCard(note, isShared) {
    const card = document.createElement('div');
    card.className = 'note-card' + (note.pinned && !isShared ? ' pinned' : '') + (isShared ? ' shared' : '');
    card.dataset.id = note.id;

    const title = this._esc(note.title || 'Untitled');
    const snippet = this._esc((note.content || 'Empty note').slice(0, 120));
    const date = this._formatDate(note.updated_at || note.created_at);
    const pinIcon = note.pinned
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg>';

    let badgeHtml = '';
    if (isShared) {
      badgeHtml = `<div class="note-card-badge shared-badge">Shared by ${this._esc(note._sharedBy.split('@')[0])}</div>`;
    } else {
      const shareCount = this._getShareCount(note.id);
      if (shareCount > 0) {
        badgeHtml = `<div class="note-card-badge owned-badge">Shared with ${shareCount}</div>`;
      }
    }

    card.innerHTML = `
      ${isShared ? '' : `<div class="note-card-actions-row">
        <button class="note-card-pin${note.pinned ? ' active' : ''}" data-action="pin-note" data-id="${note.id}" title="${note.pinned ? 'Unpin note' : 'Pin to top'}">${pinIcon}</button>
        <button class="note-card-delete" data-action="delete-note" data-id="${note.id}" title="Delete note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`}
      ${badgeHtml}
      <div class="note-card-title">${title}</div>
      <div class="note-card-snippet">${snippet}</div>
      <div class="note-card-footer">
        <span class="note-card-date">${date}</span>
      </div>`;

    if (!isShared) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        this.openNote(note.id);
      });
    } else {
      card.addEventListener('click', () => {
        this._openSharedNote(note);
      });
    }

    return card;
  },

  _getShareCount(noteId) {
    if (typeof Share === 'undefined' || !Share._shares) return 0;
    return Share._shares.filter((s) => s.note_id === noteId).length;
  },

  _openSharedNote(note) {
    const modal = document.getElementById('note-editor-modal');
    const titleInput = document.getElementById('note-title-input');
    const pinBtn = document.getElementById('note-pin-btn');
    const backBtn = document.getElementById('note-back-btn');
    const canEdit = note._permission === 'edit';

    this._ensureRichEditor();
    this._activeNoteId = note.id;
    this._activeShared = true;
    this._canEdit = canEdit;
    this._changeVersion = 0;
    this._savedVersion = 0;
    this._titleChangeVersion = 0;
    this._contentChangeVersion = 0;
    titleInput.value = note.title || '';
    titleInput.readOnly = !canEdit;
    this._quill.setContents(note.content_delta ? NoteFormat.clean(note.content_delta) : NoteFormat.fromPlainText(note.content), 'silent');
    this._quill.enable(canEdit);
    this._resetFind();
    document.getElementById('note-format-toolbar').hidden = !canEdit;
    document.getElementById('note-checklist').hidden = true;
    this._resetCompactSections(canEdit, false);
    this._showSaved();
    if (!canEdit) document.getElementById('note-save-status').textContent = 'View only';

    if (pinBtn) pinBtn.style.display = 'none';
    if (backBtn) backBtn.onclick = () => this.closeNote();
    modal.onclick = (e) => { if (e.target === modal) this.closeNote(); };
    titleInput.oninput = canEdit ? () => this._scheduleSave('title') : null;

    modal.classList.remove('hidden');
    this._resetExpanded();
    if (canEdit) this._quill.focus();
  },

  openNote(id) {
    const note = this._notes.find((n) => n.id === id);
    if (!note) return;

    this._activeNoteId = id;

    const titleInput = document.getElementById('note-title-input');
    const backBtn = document.getElementById('note-back-btn');
    const pinBtn = document.getElementById('note-pin-btn');

    const editor = document.getElementById('note-editor-modal');

    this._ensureRichEditor();
    this._activeShared = false;
    this._canEdit = true;
    this._changeVersion = 0;
    this._savedVersion = 0;
    this._titleChangeVersion = 0;
    this._contentChangeVersion = 0;
    titleInput.value = note.title || '';
    titleInput.readOnly = false;
    this._quill.setContents(note.content_delta ? NoteFormat.clean(note.content_delta) : NoteFormat.fromPlainText(note.content), 'silent');
    this._quill.enable(true);
    this._resetFind();
    document.getElementById('note-format-toolbar').hidden = false;
    document.getElementById('note-checklist').hidden = false;
    this._resetCompactSections(true, true);
    this._showSaved();

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
    this._resetExpanded();
    this._quill.focus();
    titleInput.oninput = () => this._scheduleSave('title');
    this.loadChecklist(id);
  },

  async closeNote() {
    try {
      await this._saveCurrent();
    } catch (err) {
      Toast.show(`Could not save note: ${friendlyError(err)}`, 'error');
      return;
    }
    this._activeNoteId = null;
    this._canEdit = false;
    document.getElementById('note-editor-modal').classList.add('hidden');
    document.getElementById('note-title-input').oninput = null;
    this._resetFind();
    this._resetExpanded();
    this.render();
  },

  async createNote() {
    const modal = document.getElementById('note-create-modal');
    const input = document.getElementById('note-create-input');
    const confirmBtn = document.getElementById('note-create-confirm');
    const cancelBtn = document.getElementById('note-create-cancel');

    input.value = '';
    Confirm.showModal('note-create-modal');
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

  _ensureRichEditor() {
    if (this._quill) return;
    if (typeof Quill === 'undefined') throw new Error('Rich-text editor failed to load. Reload the page and try again.');
    this._quill = new Quill('#note-textarea', {
      theme: null,
      formats: ['bold', 'background'],
      modules: { toolbar: false },
      placeholder: 'Start writing...',
    });
    this._quill.on('text-change', (_change, _old, source) => {
      if (source === 'user' && this._canEdit) {
        this._scheduleSave('content');
        if (!document.getElementById('note-find-bar').hidden) this._refreshFind();
      }
    });
    this._quill.on('selection-change', () => this._updateFormatButtons());
    const bold = document.getElementById('note-bold-btn');
    const highlight = document.getElementById('note-highlight-btn');
    for (const button of [bold, highlight]) button.addEventListener('mousedown', (e) => e.preventDefault());
    bold.onclick = () => {
      if (!this._canEdit) return;
      this._quill.format('bold', !this._quill.getFormat().bold, 'user');
      this._updateFormatButtons();
    };
    highlight.onclick = () => {
      if (!this._canEdit) return;
      this._quill.format('background', this._quill.getFormat().background ? false : '#fff2a8', 'user');
      this._updateFormatButtons();
    };
    document.getElementById('note-expand-btn').onclick = () => this._toggleExpanded();
    document.getElementById('note-find-btn').onclick = () => this._toggleFind();
    document.getElementById('note-find-close').onclick = () => {
      this._resetFind();
      document.getElementById('note-find-btn').focus();
    };
    document.getElementById('note-find-input').oninput = () => this._refreshFind();
    document.getElementById('note-find-next').onclick = () => this._stepFind(1);
    document.getElementById('note-find-prev').onclick = () => this._stepFind(-1);
    document.getElementById('note-find-input').onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      this._stepFind(e.shiftKey ? -1 : 1);
      e.currentTarget.focus({ preventScroll: true });
    };
    document.getElementById('note-tools-toggle').onclick = () => this._toggleCompactSection('note-tools-toggle', 'note-format-toolbar');
    document.getElementById('note-checklist-toggle').onclick = () => this._toggleCompactSection('note-checklist-toggle', 'note-checklist');
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('note-editor-modal');
      if (e.key !== 'Escape' || modal.classList.contains('hidden')) return;
      if (!document.getElementById('note-find-bar').hidden) {
        e.preventDefault();
        this._resetFind();
        document.getElementById('note-find-btn').focus();
        return;
      }
      if (modal.classList.contains('note-expanded')) {
        e.preventDefault();
        this._resetExpanded();
      }
    });
  },

  _updateFormatButtons() {
    if (!this._quill?.hasFocus()) return;
    const formats = this._quill.getFormat();
    document.getElementById('note-bold-btn').setAttribute('aria-pressed', String(!!formats.bold));
    document.getElementById('note-highlight-btn').setAttribute('aria-pressed', String(!!formats.background));
  },

  _toggleFind() {
    const bar = document.getElementById('note-find-bar');
    if (!bar.hidden) return this._resetFind();
    bar.hidden = false;
    document.getElementById('note-find-btn').setAttribute('aria-expanded', 'true');
    document.getElementById('note-find-count').textContent = 'Type to find';
    document.getElementById('note-find-input').focus();
  },

  _resetFind() {
    if (this._findPosition >= 0) this._quill.setSelection(null, 'silent');
    document.getElementById('note-find-bar').hidden = true;
    document.getElementById('note-find-btn').setAttribute('aria-expanded', 'false');
    document.getElementById('note-find-input').value = '';
    document.getElementById('note-find-count').textContent = '';
    this._findMatches = [];
    this._findPosition = -1;
    document.getElementById('note-find-prev').disabled = true;
    document.getElementById('note-find-next').disabled = true;
  },

  _refreshFind() {
    const query = document.getElementById('note-find-input').value.trim().toLowerCase();
    const count = document.getElementById('note-find-count');
    if (this._findPosition >= 0) this._quill.setSelection(null, 'silent');
    this._findMatches = [];
    this._findPosition = -1;
    if (query) {
      const text = this._quill.getText().toLowerCase();
      let from = 0;
      let index;
      while ((index = text.indexOf(query, from)) !== -1) {
        this._findMatches.push({ index, length: query.length });
        from = index + query.length;
      }
    }
    count.textContent = !query ? 'Type to find' : this._findMatches.length ? `${this._findMatches.length} ${this._findMatches.length === 1 ? 'match' : 'matches'}` : 'No matches';
    const disabled = this._findMatches.length === 0;
    document.getElementById('note-find-prev').disabled = disabled;
    document.getElementById('note-find-next').disabled = disabled;
  },

  _stepFind(direction) {
    if (!this._findMatches.length) return;
    const count = this._findMatches.length;
    this._findPosition = this._findPosition < 0
      ? (direction > 0 ? 0 : count - 1)
      : (this._findPosition + direction + count) % count;
    const match = this._findMatches[this._findPosition];
    this._quill.setSelection(match.index, match.length, 'api');
    document.getElementById('note-find-count').textContent = `${this._findPosition + 1} of ${count}`;
  },

  _resetCompactSections(showTools, showChecklist) {
    document.getElementById('note-mobile-sections').hidden = !showTools && !showChecklist;
    for (const [buttonId, sectionId, visible] of [
      ['note-tools-toggle', 'note-format-toolbar', showTools],
      ['note-checklist-toggle', 'note-checklist', showChecklist],
    ]) {
      const button = document.getElementById(buttonId);
      button.hidden = !visible;
      button.setAttribute('aria-expanded', 'false');
      document.getElementById(sectionId).classList.add('is-collapsed');
    }
  },

  _toggleCompactSection(buttonId, sectionId) {
    const button = document.getElementById(buttonId);
    const section = document.getElementById(sectionId);
    const expanded = section.classList.toggle('is-collapsed') === false;
    button.setAttribute('aria-expanded', String(expanded));
  },

  _toggleExpanded() {
    const modal = document.getElementById('note-editor-modal');
    modal.classList.toggle('note-expanded');
    const expanded = modal.classList.contains('note-expanded');
    const button = document.getElementById('note-expand-btn');
    button.textContent = expanded ? 'Restore' : 'Expand';
    button.setAttribute('aria-label', expanded ? 'Restore note size' : 'Expand note');
    button.setAttribute('aria-pressed', String(expanded));
  },

  _resetExpanded() {
    const modal = document.getElementById('note-editor-modal');
    modal.classList.remove('note-expanded');
    const button = document.getElementById('note-expand-btn');
    button.textContent = 'Expand';
    button.setAttribute('aria-label', 'Expand note');
    button.setAttribute('aria-pressed', 'false');
  },

  _scheduleSave(field) {
    this._changeVersion += 1;
    if (field === 'title') this._titleChangeVersion = this._changeVersion;
    if (field === 'content') this._contentChangeVersion = this._changeVersion;
    this._showSaving();
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveCurrent().catch((err) => {
      console.error('Note auto-save failed:', err);
      document.getElementById('note-save-status').textContent = 'Save failed';
    }), 500);
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

  _saveCurrent() {
    clearTimeout(this._saveTimer);
    if (!this._activeNoteId || !this._canEdit || this._changeVersion === this._savedVersion) return this._saveQueue;
    const id = this._activeNoteId;
    const shared = this._activeShared;
    const version = this._changeVersion;
    const updates = {};
    if (this._titleChangeVersion > this._savedVersion) {
      updates.title = document.getElementById('note-title-input').value.trim() || 'Untitled';
    }
    if (this._contentChangeVersion > this._savedVersion) {
      const content_delta = NoteFormat.clean(this._quill.getContents());
      updates.content = NoteFormat.toText(content_delta);
      updates.content_delta = content_delta;
    }
    this._savedVersion = version;
    this._saveQueue = this._saveQueue.catch(() => {}).then(async () => {
      const updated = shared ? await DB.updateSharedNote(id, updates) : await DB.updateNote(id, updates);
      if (shared) {
        const share = this._sharedNotes.find((item) => item.note_id === id);
        if (share) share.notes = { ...share.notes, ...updated };
      } else {
        const idx = this._notes.findIndex((item) => item.id === id);
        if (idx !== -1) this._notes[idx] = updated;
      }
      if (this._activeNoteId === id && this._changeVersion === version) this._showSaved();
      return updated;
    }).catch((err) => {
      if (this._activeNoteId === id) this._savedVersion = -1;
      throw err;
    });
    return this._saveQueue;
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
