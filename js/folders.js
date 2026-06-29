/**
 * js/folders.js
 * --------------
 * Renders the folder sidebar, breadcrumb trail, and the "move file" modal.
 */

const Folders = {
  /* ------------------------------------------------------------------ */
  /*  Sidebar folder list                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Render the folder navigation sidebar.
   * @param {Array}  folders       - Array of folder rows from DB
   * @param {string} activeFolder  - Currently active folder name
   */
  render(folders, activeFolder) {
    const list = document.getElementById('folder-list');
    list.innerHTML = '';

    // "All Files" root item
    list.appendChild(this._buildFolderItem({
      name: 'root',
      label: 'All Files',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      active: activeFolder === 'root',
    }));

    // User folders
    folders.forEach(f => {
      list.appendChild(this._buildFolderItem({
        name: f.name,
        label: f.name,
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
        active: activeFolder === f.name,
      }));
    });
  },

  _buildFolderItem({ name, label, icon, active }) {
    const item = document.createElement('div');
    item.className = `folder-item ${active ? 'active' : ''}`;
    item.dataset.folder = name;

    const deleteBtnHtml = name !== 'root'
      ? `<button class="folder-delete-btn" data-folder="${this._esc(name)}" title="Delete folder"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
      : '';

    item.innerHTML = `
      <span class="folder-item-icon">${icon}</span>
      <span class="folder-item-label">${this._esc(label)}</span>
      ${deleteBtnHtml}
    `;

    // Navigate on click (but not the delete button)
    item.addEventListener('click', (e) => {
      if (e.target.closest('.folder-delete-btn')) return;
      App.navigateTo(name);
    });

    // Delete folder button
    const deleteBtn = item.querySelector('.folder-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        App.deleteFolder(name);
      });
    }

    return item;
  },

  /* ------------------------------------------------------------------ */
  /*  Breadcrumb                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Update the breadcrumb trail in the top bar.
   * @param {string} folder - Current folder ('root' or folder name)
   */
  renderBreadcrumb(folder) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';

    const rootSpan = document.createElement('span');
    rootSpan.className = `breadcrumb-item ${folder === 'root' ? 'active' : ''}`;
    rootSpan.textContent = 'All Files';
    rootSpan.addEventListener('click', () => {
      if (folder !== 'root') App.navigateTo('root');
    });
    breadcrumb.appendChild(rootSpan);

    if (folder !== 'root') {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '/';
      breadcrumb.appendChild(sep);

      const folderSpan = document.createElement('span');
      folderSpan.className = 'breadcrumb-item active';
      folderSpan.textContent = folder;
      breadcrumb.appendChild(folderSpan);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Move-to-folder modal                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Show the "Move to folder" modal.
   * @param {Object} file    - The file being moved
   * @param {Array}  folders - All available folders
   */
  showMoveModal(file, folders) {
    const modal = document.getElementById('move-modal');
    const list  = document.getElementById('move-folder-list');
    list.innerHTML = '';

    const allFolders = [{ name: 'root', label: 'All Files (root)', icon: '🏠' }, ...folders.map(f => ({ name: f.name, label: f.name, icon: '📁' }))];

    allFolders.forEach(f => {
      if (f.name === file.folder) return; // skip current folder

      const btn = document.createElement('button');
      btn.className = 'move-folder-btn';
      btn.innerHTML = `<span>${f.icon}</span> <span>${this._esc(f.label)}</span>`;
      btn.addEventListener('click', () => {
        this.hideMoveModal();
        App.moveFile(file, f.name);
      });
      list.appendChild(btn);
    });

    if (list.children.length === 0) {
      list.innerHTML = '<p class="move-empty">No other folders available.</p>';
    }

    modal.classList.remove('hidden');

    // Cancel button
    document.getElementById('move-modal-cancel').onclick = () => this.hideMoveModal();

    // Backdrop close
    modal.onclick = (e) => { if (e.target === modal) this.hideMoveModal(); };
  },

  hideMoveModal() {
    document.getElementById('move-modal').classList.add('hidden');
  },

  /* ------------------------------------------------------------------ */
  /*  Create folder modal                                                 */
  /* ------------------------------------------------------------------ */

  showCreateModal() {
    const modal = document.getElementById('folder-modal');
    const input = document.getElementById('folder-name-input');
    input.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);

    const confirm = document.getElementById('folder-modal-confirm');
    const cancel  = document.getElementById('folder-modal-cancel');

    const cleanup = () => {
      modal.classList.add('hidden');
      confirm.onclick = null;
      cancel.onclick  = null;
      modal.onclick   = null;
    };

    confirm.onclick = async () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      cleanup();
      await App.createFolder(name);
    };

    cancel.onclick = cleanup;
    modal.onclick  = (e) => { if (e.target === modal) cleanup(); };

    input.onkeydown = (e) => { if (e.key === 'Enter') confirm.click(); if (e.key === 'Escape') cancel.click(); };
  },

  _esc(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};
