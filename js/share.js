/**
 * js/share.js
 * -----------
 * Share Notes & Files view — pick one or more notes/files and one or more
 * registered users to share with (single + batch share). Also shows
 * notes and files shared *with* you. Access control is enforced by
 * RLS (see supabase/migrations/007, 008, 009), not here.
 */

const Share = {
  _notes:    [],
  _files:    [],
  _users:    [],
  _shares:   [],
  _incoming: [],
  _fileShares: [],
  _fileIncoming: [],
  _selectedNotes: new Set(),
  _selectedFiles: new Set(),
  _selectedUsers: new Set(),
  _selectedPermission: 'view',
  _activeTab: 'notes',
  _pickerController: null,
  _sharing: false,

  _CHECK_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  _BOX_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>',
  _NOTE_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  _USER_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  _SHARE_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
  _INCOMING_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  _CHEVRON_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  _EMPTY_NOTE_ICON:
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  _EMPTY_USER_ICON:
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  _EMPTY_SHARE_ICON:
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  _EMPTY_INCOMING_ICON:
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  _SUBMIT_ICON:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
  _FILE_ICON:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
  _EMPTY_FILE_ICON:
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',

  async load() {
    const container = document.getElementById('share-container');
    if (!container) return;
    container.innerHTML =
      '<div class="loading-state"><div class="spinner" aria-hidden="true"></div><div>Loading shares...</div></div>';

    try {
      const [notes, files, users, shares, incoming, fileShares, fileIncoming] = await Promise.all([
        DB.getNotes(),
        DB.getAllFiles(),
        DB.getUsers(),
        DB.getMyShares(),
        DB.getSharedWithMe(),
        DB.getFileShares(),
        DB.getSharedFilesWithMe(),
      ]);
      this._notes = notes;
      this._files = files;
      this._users = users;
      this._shares = shares;
      this._incoming = incoming;
      this._fileShares = fileShares;
      this._fileIncoming = fileIncoming;
      this._selectedNotes.clear();
      this._selectedFiles.clear();
      this._selectedUsers.clear();
      this.render();
    } catch (err) {
      console.error('Share.load:', err);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Failed to load shares</div>
          <div class="empty-subtitle">${this._esc(friendlyError(err))}</div>
        </div>`;
    }
  },

  render() {
    const container = document.getElementById('share-container');
    if (!container) return;
    container.innerHTML = '';

    const tabs = document.createElement('div');
    tabs.className = 'share-tabs';
    const notesTab = document.createElement('button');
    notesTab.className = `share-tab${this._activeTab === 'notes' ? ' active' : ''}`;
    notesTab.textContent = 'Notes';
    notesTab.addEventListener('click', () => { this._activeTab = 'notes'; this.render(); });
    const filesTab = document.createElement('button');
    filesTab.className = `share-tab${this._activeTab === 'files' ? ' active' : ''}`;
    filesTab.textContent = 'Files';
    filesTab.addEventListener('click', () => { this._activeTab = 'files'; this.render(); });
    tabs.appendChild(notesTab);
    tabs.appendChild(filesTab);
    container.appendChild(tabs);

    const layout = document.createElement('div');
    layout.className = 'share-layout';

    if (this._activeTab === 'notes') {
      this._renderNotesTab(layout);
    } else {
      this._renderFilesTab(layout);
    }

    container.appendChild(layout);
    this._updateSubmit();
    this._updateToggle(this._activeTab);
    this._updateToggle('users');
  },

  _renderNotesTab(layout) {
    layout.appendChild(this._buildPickerPanel('notes'));

    const usersPanel = this._buildUsersPanel('notes');
    layout.appendChild(usersPanel);

    const mine = document.createElement('div');
    mine.className = 'share-section';
    mine.appendChild(this._header('Currently Shared', 'Notes you own that others can view', this._SHARE_ICON));
    mine.appendChild(this._mySharesList());
    layout.appendChild(mine);

    const incoming = document.createElement('div');
    incoming.className = 'share-section';
    incoming.appendChild(this._header('Shared With Me', 'Notes other people have shared with you', this._INCOMING_ICON));
    incoming.appendChild(this._incomingList());
    layout.appendChild(incoming);
  },

  _renderFilesTab(layout) {
    layout.appendChild(this._buildPickerPanel('files'));

    const usersPanel = this._buildUsersPanel('files');
    layout.appendChild(usersPanel);

    const mine = document.createElement('div');
    mine.className = 'share-section';
    mine.appendChild(this._header('Currently Shared', 'Files you own that others can view', this._SHARE_ICON));
    mine.appendChild(this._myFileSharesList());
    layout.appendChild(mine);

    const incoming = document.createElement('div');
    incoming.className = 'share-section';
    incoming.appendChild(this._header('Shared With Me', 'Files other people have shared with you', this._INCOMING_ICON));
    incoming.appendChild(this._incomingFileList());
    layout.appendChild(incoming);
  },

  _buildPickerPanel(type) {
    const isNotes = type === 'notes';
    const items = isNotes ? this._notes : this._files;
    const selected = isNotes ? this._selectedNotes : this._selectedFiles;

    const panel = document.createElement('div');
    panel.className = 'share-panel';

    const header = document.createElement('div');
    header.className = 'share-panel-header';
    const left = document.createElement('div');
    left.className = 'share-panel-header-left';
    const h = document.createElement('h3');
    h.className = 'share-panel-title';
    h.innerHTML = `<span class="share-panel-title-icon">${isNotes ? this._NOTE_ICON : this._FILE_ICON}</span>${isNotes ? 'Your Notes' : 'Your Files'}`;
    left.appendChild(h);
    const s = document.createElement('span');
    s.className = 'share-panel-hint';
    s.textContent = isNotes ? 'Pick the notes you want to share' : 'Pick the files you want to share';
    left.appendChild(s);
    header.appendChild(left);
    panel.appendChild(header);

    if (items.length === 0) {
      panel.appendChild(this._empty(
        isNotes ? this._EMPTY_NOTE_ICON : this._EMPTY_FILE_ICON,
        isNotes ? 'No notes yet' : 'No files yet',
        isNotes ? 'Create a note first so you can share it with others.' : 'Upload a file first so you can share it with others.'
      ));
      return panel;
    }

    const chooseBtn = document.createElement('button');
    chooseBtn.className = 'btn btn-primary share-choose-btn';
    chooseBtn.innerHTML =
      `${isNotes ? this._NOTE_ICON : this._FILE_ICON}<span>Choose ${isNotes ? 'Notes' : 'Files'}</span>`;
    chooseBtn.addEventListener('click', () => this._openPickerModal(type));
    panel.appendChild(chooseBtn);

    const summary = document.createElement('div');
    summary.className = 'share-selected-summary';
    if (selected.size === 0) {
      summary.appendChild(this._empty(null, 'Nothing selected yet', `Click "Choose ${isNotes ? 'Notes' : 'Files'}" above to pick items to share.`));
    } else {
      const list = document.createElement('div');
      list.className = 'share-selected-list';
      for (const item of items) {
        if (!selected.has(item.id)) continue;
        list.appendChild(isNotes ? this._selectedNoteRow(item) : this._selectedFileRow(item));
      }
      summary.appendChild(list);
    }
    panel.appendChild(summary);

    return panel;
  },

  _selectedNoteRow(note) {
    const row = document.createElement('div');
    row.className = 'share-selected-row';

    const title = document.createElement('div');
    title.className = 'share-selected-title';
    title.textContent = note.title || 'Untitled';
    title.title = note.title || 'Untitled';

    const remove = document.createElement('button');
    remove.className = 'share-selected-remove';
    remove.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    remove.addEventListener('click', () => {
      this._selectedNotes.delete(note.id);
      this.render();
    });

    row.appendChild(title);
    row.appendChild(remove);
    return row;
  },

  _selectedFileRow(file) {
    const row = document.createElement('div');
    row.className = 'share-selected-row';

    const thumb = document.createElement('div');
    thumb.className = 'share-selected-thumb';
    const isImage = IMAGE_TYPES.includes(file.file_type);
    if (isImage) {
      const img = document.createElement('img');
      img.src = Storage.getPublicUrl(file.storage_path);
      img.alt = file.filename;
      img.loading = 'lazy';
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = this._getFileIcon(file.file_type);
    }

    const name = document.createElement('div');
    name.className = 'share-selected-title';
    name.textContent = file.filename || 'Untitled';
    name.title = file.filename || 'Untitled';

    const remove = document.createElement('button');
    remove.className = 'share-selected-remove';
    remove.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    remove.addEventListener('click', () => {
      this._selectedFiles.delete(file.id);
      this.render();
    });

    row.appendChild(thumb);
    row.appendChild(name);
    row.appendChild(remove);
    return row;
  },

  _buildUsersPanel(type) {
    const usersPanel = document.createElement('div');
    usersPanel.className = 'share-panel';
    const usersHeader = this._headerWithToggle('Share With', 'Pick registered users', this._USER_ICON, 'users');
    usersPanel.appendChild(usersHeader);

    if (this._users.length === 0) {
      usersPanel.appendChild(this._empty(this._EMPTY_USER_ICON, 'No other users', 'There are no other registered users to share with yet.'));
    } else {
      const list = document.createElement('div');
      list.className = 'share-users-list';
      for (const user of this._users) {
        list.appendChild(this._userRow(user));
      }
      usersPanel.appendChild(list);
    }

    const permGroup = document.createElement('div');
    permGroup.className = 'share-perm-group';
    permGroup.innerHTML = `
      <span class="share-perm-label">Permission:</span>
      <label class="share-perm-option">
        <input type="radio" name="share-permission" value="view" ${this._selectedPermission === 'view' ? 'checked' : ''}>
        <span class="share-perm-text">View only</span>
      </label>
      <label class="share-perm-option">
        <input type="radio" name="share-permission" value="edit" ${this._selectedPermission === 'edit' ? 'checked' : ''}>
        <span class="share-perm-text">Can edit</span>
      </label>
    `;
    permGroup.querySelectorAll('input[name="share-permission"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this._selectedPermission = e.target.value;
      });
    });
    usersPanel.appendChild(permGroup);

    const submit = document.createElement('button');
    submit.className = 'btn btn-primary share-submit-btn';
    submit.id = 'share-submit-btn';
    submit.disabled = true;
    submit.innerHTML =
      `${this._SUBMIT_ICON}<span>Share Selected</span>`;
    submit.addEventListener('click', () => this.shareSelected(type));
    usersPanel.appendChild(submit);

    return usersPanel;
  },

  /* ------------------------------------------------------------------ */
  /*  Selection UI                                                       */
  /* ------------------------------------------------------------------ */

  _pickerNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card share-picker-card' + (note.pinned ? ' pinned' : '');
    card.dataset.id = note.id;

    const title = this._esc(note.title || 'Untitled');
    const snippet = this._esc((note.content || 'Empty note').slice(0, 120));
    const date = this._formatDate(note.updated_at || note.created_at);
    const pinIcon = note.pinned
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 10H3l5 4-2 8 6-5 6 5-2-8 5-4h-5z"/></svg>'
      : '';

    card.innerHTML = `
      ${note.pinned ? `<div class="note-card-actions-row"><span class="note-card-pin active" aria-hidden="true">${pinIcon}</span></div>` : ''}
      <div class="note-card-title">${title}</div>
      <div class="note-card-snippet">${snippet}</div>
      <div class="note-card-footer"><span class="note-card-date">${date}</span></div>
      <div class="share-picker-check">${this._BOX_ICON}</div>`;

    this._wirePickerCard(card, this._selectedNotes, note.id, card.querySelector('.share-picker-check'));

    return card;
  },

  _pickerFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card share-picker-card';
    card.dataset.id = file.id;

    const isImage = IMAGE_TYPES.includes(file.file_type);
    const publicUrl = Storage.getPublicUrl(file.storage_path);

    const preview = document.createElement('div');
    preview.className = 'file-card-preview';
    if (isImage) {
      const img = document.createElement('img');
      img.src = publicUrl;
      img.alt = file.filename;
      img.loading = 'lazy';
      img.onerror = () => { preview.innerHTML = `<span class="file-icon">${this._getFileIcon(file.file_type)}</span>`; };
      preview.appendChild(img);
    } else {
      preview.innerHTML = `<span class="file-icon">${this._getFileIcon(file.file_type)}</span>`;
    }

    const info = document.createElement('div');
    info.className = 'file-card-info';
    info.innerHTML = `
      <div class="file-card-name" title="${this._esc(file.filename)}">${this._esc(file.filename)}</div>
      <div class="file-card-meta">
        <span>${this._formatSize(file.size)}</span>
        <span>${this._formatDate(file.created_at)}</span>
      </div>
    `;

    const check = document.createElement('div');
    check.className = 'share-picker-check';
    check.innerHTML = this._BOX_ICON;

    card.appendChild(check);
    card.appendChild(preview);
    card.appendChild(info);

    this._wirePickerCard(card, this._selectedFiles, file.id, check);

    return card;
  },

  _wirePickerCard(card, selected, id, check, afterToggle = null) {
    card.setAttribute('role', 'checkbox');
    card.tabIndex = 0;
    const sync = () => {
      const checked = selected.has(id);
      card.classList.toggle('selected', checked);
      card.setAttribute('aria-checked', String(checked));
      check.innerHTML = checked ? this._CHECK_ICON : this._BOX_ICON;
    };
    const toggle = () => {
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      sync();
      if (afterToggle) afterToggle();
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });
    sync();
  },

  _openPickerModal(type) {
    const isNotes = type === 'notes';
    const items = isNotes ? this._notes : this._files;
    if (items.length === 0) return;

    const modal = document.getElementById('share-picker-modal');
    const grid = modal.querySelector('.share-picker-grid');
    const titleEl = modal.querySelector('.share-picker-title');
    const doneBtn = document.getElementById('share-picker-done');
    const cancelBtn = document.getElementById('share-picker-cancel');

    const selectedSet = isNotes ? this._selectedNotes : this._selectedFiles;
    const before = new Set(selectedSet);
    this._pickerController?.abort();
    const controller = new AbortController();
    this._pickerController = controller;

    titleEl.textContent = isNotes ? 'Choose Notes to Share' : 'Choose Files to Share';
    grid.innerHTML = '';

    for (const item of items) {
      grid.appendChild(isNotes ? this._pickerNoteCard(item) : this._pickerFileCard(item));
    }

    const finish = () => {
      controller.abort();
      if (this._pickerController === controller) this._pickerController = null;
      Confirm.hideModal('share-picker-modal');
      this.render();
      document.querySelector('.share-choose-btn')?.focus();
    };
    const onDone = () => finish();
    const onCancel = () => {
      selectedSet.clear();
      before.forEach((id) => selectedSet.add(id));
      finish();
    };
    const onBackdrop = (e) => {
      if (e.target === modal) onCancel();
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    doneBtn.addEventListener('click', onDone, { signal: controller.signal });
    cancelBtn.addEventListener('click', onCancel, { signal: controller.signal });
    modal.addEventListener('click', onBackdrop, { signal: controller.signal });
    document.addEventListener('keydown', onEsc, { signal: controller.signal });

    Confirm.showModal('share-picker-modal');
    doneBtn.focus();
  },

  _getFileIcon(mimeType = '') {
    if (!mimeType) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
    if (mimeType.startsWith('image/')) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    if (mimeType.startsWith('video/')) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
    if (mimeType.startsWith('audio/')) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    if (mimeType === 'application/pdf') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz') || mimeType.includes('rar')) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V3h13l5 5z"/><path d="M12 3v6h6"/></svg>';
    if (mimeType.startsWith('text/')) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
  },

  _userRow(user) {
    const row = document.createElement('div');
    row.className = 'share-user-row';
    row.dataset.id = user.id;

    const check = document.createElement('span');
    check.className = 'share-checkbox';
    check.innerHTML = this._BOX_ICON;

    const avatar = document.createElement('span');
    avatar.className = 'share-user-avatar';
    avatar.textContent = this._initials(user.email);

    const email = document.createElement('span');
    email.className = 'share-user-email';
    email.textContent = user.email;

    row.appendChild(check);
    row.appendChild(avatar);
    row.appendChild(email);

    this._wirePickerCard(row, this._selectedUsers, user.id, check, () => {
      this._updateSubmit();
      this._updateToggle('users');
    });

    return row;
  },

  _updateSubmit() {
    const btn = document.getElementById('share-submit-btn');
    if (!btn) return;
    const label = btn.querySelector('span');
    if (!label) return;

    const n = this._activeTab === 'notes' ? this._selectedNotes.size : this._selectedFiles.size;
    const u = this._selectedUsers.size;
    const enabled = n > 0 && u > 0;
    const itemLabel = this._activeTab === 'notes' ? 'note' : 'file';
    btn.disabled = !enabled || this._sharing;
    label.textContent = enabled
      ? `Share ${n} ${itemLabel}${n > 1 ? 's' : ''} with ${u} user${u > 1 ? 's' : ''}`
      : 'Share Selected';
  },

  /* ------------------------------------------------------------------ */
  /*  Select all / deselect all                                          */
  /* ------------------------------------------------------------------ */

  _headerWithToggle(title, subtitle, icon, type) {
    const header = document.createElement('div');
    header.className = 'share-panel-header';

    const left = document.createElement('div');
    left.className = 'share-panel-header-left';

    const h = document.createElement('h3');
    h.className = 'share-panel-title';
    h.innerHTML = `<span class="share-panel-title-icon">${icon}</span>${title}`;
    left.appendChild(h);

    if (subtitle) {
      const s = document.createElement('span');
      s.className = 'share-panel-hint';
      s.textContent = subtitle;
      left.appendChild(s);
    }

    header.appendChild(left);

    const items = type === 'notes' ? this._notes : type === 'files' ? this._files : this._users;
    if (items.length > 0) {
      const toggle = document.createElement('button');
      toggle.className = 'share-select-toggle';
      toggle.dataset.type = type;
      toggle.textContent = 'Select All';
      toggle.addEventListener('click', () => this._toggleAll(type));
      header.appendChild(toggle);
    }

    return header;
  },

  _toggleAll(type) {
    const items = type === 'notes' ? this._notes : type === 'files' ? this._files : this._users;
    const selected = type === 'notes' ? this._selectedNotes : type === 'files' ? this._selectedFiles : this._selectedUsers;
    const listClass = type === 'notes' || type === 'files' ? 'share-notes-list' : 'share-users-list';

    const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

    if (allSelected) {
      selected.clear();
    } else {
      for (const item of items) selected.add(item.id);
    }

    const list = document.querySelector(`.${listClass}`);
    if (list) {
      for (const row of list.children) {
        const id = row.dataset.id;
        const isSelected = selected.has(id);
        row.classList.toggle('selected', isSelected);
        row.setAttribute('aria-checked', String(isSelected));
        const check = row.querySelector('.share-checkbox');
        if (check) check.innerHTML = isSelected ? this._CHECK_ICON : this._BOX_ICON;
      }
    }

    this._updateSubmit();
    this._updateToggle(type);
  },

  _updateToggle(type) {
    const items = type === 'notes' ? this._notes : type === 'files' ? this._files : this._users;
    const selected = type === 'notes' ? this._selectedNotes : type === 'files' ? this._selectedFiles : this._selectedUsers;
    const toggle = document.querySelector(`.share-select-toggle[data-type="${type}"]`);
    if (!toggle) return;

    const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
    toggle.classList.toggle('all-selected', allSelected);
    toggle.textContent = allSelected ? 'Deselect All' : 'Select All';
  },

  async shareSelected(type) {
    if (this._sharing) return;
    const userIds = Array.from(this._selectedUsers);
    if (userIds.length === 0) return;
    const isNotes = type === 'notes';
    const itemIds = Array.from(isNotes ? this._selectedNotes : this._selectedFiles);
    if (itemIds.length === 0) return;

    const idKey = isNotes ? 'note_id' : 'file_id';
    const noun = isNotes ? 'note' : 'file';
    const shares = isNotes ? this._shares : this._fileShares;
    const existing = new Set(shares.map((s) => `${s[idKey]}::${s.shared_with_user_id}`));
    const pairs = [];
    for (const itemId of itemIds) {
      for (const userId of userIds) {
        if (!existing.has(`${itemId}::${userId}`)) {
          pairs.push({ [idKey]: itemId, shared_with_user_id: userId, permission: this._selectedPermission });
        }
      }
    }

    if (pairs.length === 0) {
      Toast.show(`Those ${noun}s are already shared with those users.`, 'info');
      return;
    }

    this._sharing = true;
    const btn = document.getElementById('share-submit-btn');
    if (btn) btn.disabled = true;
    try {
      if (isNotes) await DB.shareNotes(pairs);
      else await DB.shareFiles(pairs);
      Toast.show(
        `Shared ${itemIds.length} ${noun}${itemIds.length > 1 ? 's' : ''} with ${userIds.length} user${userIds.length > 1 ? 's' : ''}.`,
        'success'
      );
      await this.load();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to share: ${friendlyError(err)}`, 'error');
    } finally {
      this._sharing = false;
      this._updateSubmit();
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Outgoing + incoming lists                                          */
  /* ------------------------------------------------------------------ */

  _mySharesList() {
    const list = document.createElement('div');
    list.className = 'share-shares-list';

    const own = this._shares.filter((s) => this._notes.some((n) => n.id === s.note_id));
    if (own.length === 0) {
      list.appendChild(this._empty(this._EMPTY_SHARE_ICON, 'Nothing shared yet', 'Pick a note and a user above to share it.'));
      return list;
    }

    for (const share of own) {
      const note = this._notes.find((n) => n.id === share.note_id);
      const user = this._users.find((u) => u.id === share.shared_with_user_id);

      const row = document.createElement('div');
      row.className = 'share-shares-row';

      const avatar = document.createElement('span');
      avatar.className = 'share-shares-icon';
      avatar.textContent = user ? this._initials(user.email) : '?';

      const text = document.createElement('div');
      text.className = 'share-shares-text';
      const noteTitle = document.createElement('span');
      noteTitle.className = 'share-shares-note';
      noteTitle.textContent = note ? (note.title || 'Untitled') : 'Note';
      const arrow = document.createElement('span');
      arrow.className = 'share-shares-arrow';
      arrow.textContent = ' → ';
      const userEmail = document.createElement('span');
      userEmail.className = 'share-shares-user';
      userEmail.textContent = user ? user.email : 'unknown user';
      text.appendChild(noteTitle);
      text.appendChild(arrow);
      text.appendChild(userEmail);

      const permBadge = document.createElement('button');
      permBadge.type = 'button';
      permBadge.className = `share-perm-badge share-perm-${share.permission || 'view'}`;
      permBadge.textContent = share.permission === 'edit' ? 'Can edit' : 'View only';
      permBadge.title = 'Click to toggle permission';
      permBadge.setAttribute('aria-label', `Change permission for ${note ? note.title || 'note' : 'note'} shared with ${user ? user.email : 'unknown user'}; currently ${permBadge.textContent}`);
      permBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePermission(share);
      });

      const revoke = document.createElement('button');
      revoke.className = 'share-revoke-btn';
      revoke.textContent = 'Revoke';
      revoke.addEventListener('click', (e) => {
        e.stopPropagation();
        this.revokeShare(share.id);
      });

      row.appendChild(avatar);
      row.appendChild(text);
      row.appendChild(permBadge);
      row.appendChild(revoke);
      list.appendChild(row);
    }
    return list;
  },

  async revokeShare(shareId) {
    return this._revokeShare(shareId, 'note');
  },

  async _revokeShare(shareId, kind) {
    const confirmed = await Confirm.show({
      title: 'Revoke Share?',
      description: `This user will no longer be able to view the ${kind}.`,
      confirmText: 'Revoke',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      if (kind === 'note') await DB.revokeShare(shareId);
      else await DB.revokeFileShare(shareId);
      Toast.show('Share revoked.', 'success');
      await this.load();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to revoke: ${friendlyError(err)}`, 'error');
    }
  },

  async togglePermission(share) {
    return this._togglePermission(share, 'note');
  },

  async _togglePermission(share, kind) {
    const newPerm = share.permission === 'edit' ? 'view' : 'edit';
    try {
      if (kind === 'note') await DB.updateSharePermission(share.id, newPerm);
      else await DB.updateFileSharePermission(share.id, newPerm);
      Toast.show(`Permission changed to ${newPerm === 'edit' ? 'Can edit' : 'View only'}.`, 'success');
      await this.load();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to update permission: ${friendlyError(err)}`, 'error');
    }
  },

  _incomingList() {
    const list = document.createElement('div');
    list.className = 'share-incoming-list';

    if (this._incoming.length === 0) {
      list.appendChild(this._empty(this._EMPTY_INCOMING_ICON, 'Nothing shared with you yet', 'When someone shares a note with you, it will appear here.'));
      return list;
    }

    for (const share of this._incoming) {
      const note = share.notes || {};
      const sender = this._users.find((u) => u.id === share.owner_user_id);

      const card = document.createElement('div');
      card.className = 'share-incoming-card';

      const head = document.createElement('div');
      head.className = 'share-incoming-head';

      const left = document.createElement('div');
      left.className = 'share-incoming-left';

      const title = document.createElement('div');
      title.className = 'share-incoming-title';
      title.textContent = note.title || 'Untitled';

      left.appendChild(title);

      const chevron = document.createElement('span');
      chevron.className = 'share-incoming-expand';
      chevron.innerHTML = this._CHEVRON_ICON;

      head.appendChild(left);
      head.appendChild(chevron);

      const meta = document.createElement('div');
      meta.className = 'share-incoming-meta';

      if (sender) {
        const from = document.createElement('span');
        from.className = 'share-incoming-from';
        from.textContent = `from ${sender.email}`;
        meta.appendChild(from);
      }

      const date = document.createElement('span');
      date.className = 'share-incoming-date';
      date.textContent = this._formatDate(share.created_at);
      meta.appendChild(date);

      const permBadge = document.createElement('span');
      permBadge.className = `share-perm-badge share-perm-${share.permission || 'view'}`;
      permBadge.textContent = share.permission === 'edit' ? 'Can edit' : 'View only';
      meta.appendChild(permBadge);

      const body = document.createElement('div');
      body.className = 'share-incoming-body';
      body.textContent = note.content || 'Empty note';

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(body);
      this._wireIncomingCard(card);
      list.appendChild(card);
    }
    return list;
  },

  _myFileSharesList() {
    const list = document.createElement('div');
    list.className = 'share-shares-list';

    const own = this._fileShares.filter((s) => this._files.some((f) => f.id === s.file_id));
    if (own.length === 0) {
      list.appendChild(this._empty(this._EMPTY_SHARE_ICON, 'Nothing shared yet', 'Pick a file and a user above to share it.'));
      return list;
    }

    for (const share of own) {
      const file = this._files.find((f) => f.id === share.file_id);
      const user = this._users.find((u) => u.id === share.shared_with_user_id);

      const row = document.createElement('div');
      row.className = 'share-shares-row';

      const avatar = document.createElement('span');
      avatar.className = 'share-shares-icon';
      avatar.textContent = user ? this._initials(user.email) : '?';

      const text = document.createElement('div');
      text.className = 'share-shares-text';
      const fileName = document.createElement('span');
      fileName.className = 'share-shares-note';
      fileName.textContent = file ? file.filename : 'File';
      const arrow = document.createElement('span');
      arrow.className = 'share-shares-arrow';
      arrow.textContent = ' → ';
      const userEmail = document.createElement('span');
      userEmail.className = 'share-shares-user';
      userEmail.textContent = user ? user.email : 'unknown user';
      text.appendChild(fileName);
      text.appendChild(arrow);
      text.appendChild(userEmail);

      const permBadge = document.createElement('button');
      permBadge.type = 'button';
      permBadge.className = `share-perm-badge share-perm-${share.permission || 'view'}`;
      permBadge.textContent = share.permission === 'edit' ? 'Can edit' : 'View only';
      permBadge.title = 'Click to toggle permission';
      permBadge.setAttribute('aria-label', `Change permission for ${file ? file.filename : 'file'} shared with ${user ? user.email : 'unknown user'}; currently ${permBadge.textContent}`);
      permBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFilePermission(share);
      });

      const revoke = document.createElement('button');
      revoke.className = 'share-revoke-btn';
      revoke.textContent = 'Revoke';
      revoke.addEventListener('click', (e) => {
        e.stopPropagation();
        this.revokeFileShare(share.id);
      });

      row.appendChild(avatar);
      row.appendChild(text);
      row.appendChild(permBadge);
      row.appendChild(revoke);
      list.appendChild(row);
    }
    return list;
  },

  async revokeFileShare(shareId) {
    return this._revokeShare(shareId, 'file');
  },

  async toggleFilePermission(share) {
    return this._togglePermission(share, 'file');
  },

  _incomingFileList() {
    const list = document.createElement('div');
    list.className = 'share-incoming-list';

    if (this._fileIncoming.length === 0) {
      list.appendChild(this._empty(this._EMPTY_INCOMING_ICON, 'Nothing shared with you yet', 'When someone shares a file with you, it will appear here.'));
      return list;
    }

    for (const share of this._fileIncoming) {
      const file = share.files || {};
      const sender = this._users.find((u) => u.id === share.owner_user_id);

      const card = document.createElement('div');
      card.className = 'share-incoming-card';

      const head = document.createElement('div');
      head.className = 'share-incoming-head';

      const left = document.createElement('div');
      left.className = 'share-incoming-left';

      const title = document.createElement('div');
      title.className = 'share-incoming-title';
      title.textContent = file.filename || 'Untitled';

      left.appendChild(title);

      const chevron = document.createElement('span');
      chevron.className = 'share-incoming-expand';
      chevron.innerHTML = this._CHEVRON_ICON;

      head.appendChild(left);
      head.appendChild(chevron);

      const meta = document.createElement('div');
      meta.className = 'share-incoming-meta';

      if (sender) {
        const from = document.createElement('span');
        from.className = 'share-incoming-from';
        from.textContent = `from ${sender.email}`;
        meta.appendChild(from);
      }

      const date = document.createElement('span');
      date.className = 'share-incoming-date';
      date.textContent = this._formatDate(share.created_at);
      meta.appendChild(date);

      const permBadge = document.createElement('span');
      permBadge.className = `share-perm-badge share-perm-${share.permission || 'view'}`;
      permBadge.textContent = share.permission === 'edit' ? 'Can edit' : 'View only';
      meta.appendChild(permBadge);

      const body = document.createElement('div');
      body.className = 'share-incoming-body';
      body.textContent = `${this._formatSize(file.size)} · ${file.file_type || 'Unknown type'}`;

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(body);
      this._wireIncomingCard(card);
      list.appendChild(card);
    }
    return list;
  },

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  _wireIncomingCard(card) {
    const title = card.querySelector('.share-incoming-title')?.textContent || 'shared item';
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.setAttribute('aria-label', `Show details for ${title}`);
    card.tabIndex = 0;
    const toggle = () => {
      const expanded = card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', String(expanded));
      card.setAttribute('aria-label', `${expanded ? 'Hide' : 'Show'} details for ${title}`);
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  },

  _header(title, subtitle, icon) {
    const header = document.createElement('div');
    header.className = 'share-panel-header';

    const left = document.createElement('div');
    left.className = 'share-panel-header-left';

    const h = document.createElement('h3');
    h.className = 'share-panel-title';
    h.innerHTML = icon
      ? `<span class="share-panel-title-icon">${icon}</span>${title}`
      : title;
    left.appendChild(h);

    if (subtitle) {
      const s = document.createElement('span');
      s.className = 'share-panel-hint';
      s.textContent = subtitle;
      left.appendChild(s);
    }

    header.appendChild(left);
    return header;
  },

  _empty(icon, title, subtitle) {
    const empty = document.createElement('div');
    empty.className = 'share-empty';

    if (icon) {
      const i = document.createElement('div');
      i.className = 'share-empty-icon';
      i.innerHTML = icon;
      empty.appendChild(i);
    }

    const t = document.createElement('div');
    t.className = 'share-empty-title';
    t.textContent = title;

    const s = document.createElement('div');
    s.className = 'share-empty-subtitle';
    s.textContent = subtitle;

    empty.appendChild(t);
    empty.appendChild(s);
    return empty;
  },

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  _initials(email) {
    if (!email) return '?';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return email.slice(0, 2).toUpperCase();
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

  _formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
  },
};
