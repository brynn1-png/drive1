/**
 * js/app.js
 * ----------
 * Main application entry point.
 * Owns global state and coordinates all modules.
 */

/* ------------------------------------------------------------------ */
/*  Toast notification helper                                           */
/* ------------------------------------------------------------------ */
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => toast.classList.add('toast-show'));

    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  },
};

/* ------------------------------------------------------------------ */
/*  Application state + coordinator                                     */
/* ------------------------------------------------------------------ */
const App = {
  state: {
    currentFolder: 'root',
    currentView:   'files', // 'files' | 'notes' | 'tasks'
    searchQuery:   '',
    sortBy:        'created_at',
    sortOrder:     'desc',
    viewMode:      'grid',
    files:         [],
    folders:       [],
  },

  /* ------------------------------------------------------------------ */
  /*  Bootstrap                                                           */
  /* ------------------------------------------------------------------ */

  async init() {
    // Validate config
    if (SUPABASE_URL.includes('YOUR_PROJECT_ID') || SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('files-container').innerHTML = `
        <div class="config-warning">
          <div class="config-warning-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <h2>Setup Required</h2>
          <p>Open <strong>js/config.js</strong> and fill in your Supabase URL and Anon Key to get started.</p>
        </div>
      `;
      return;
    }

    this._initControls();
    Upload.init();
    Gallery.initActionSheet();
    await Projects.load();

    await this.refresh();
  },

  /* ------------------------------------------------------------------ */
  /*  Control wiring                                                      */
  /* ------------------------------------------------------------------ */

  _initControls() {
    // Search (debounced)
    let searchTimer;
    document.getElementById('search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        this.state.searchQuery = e.target.value;
        // When searching, look across all folders
        await this.refresh();
      }, 300);
    });

    // Sort — use a lookup map so column names with underscores (created_at) parse safely
    const SORT_MAP = {
      'created_at_desc': { sortBy: 'created_at', sortOrder: 'desc' },
      'created_at_asc':  { sortBy: 'created_at', sortOrder: 'asc'  },
      'filename_asc':    { sortBy: 'filename',    sortOrder: 'asc'  },
      'filename_desc':   { sortBy: 'filename',    sortOrder: 'desc' },
      'size_desc':       { sortBy: 'size',        sortOrder: 'desc' },
      'size_asc':        { sortBy: 'size',        sortOrder: 'asc'  },
    };
    document.getElementById('sort-select').addEventListener('change', async (e) => {
      const parsed = SORT_MAP[e.target.value];
      if (parsed) {
        this.state.sortBy    = parsed.sortBy;
        this.state.sortOrder = parsed.sortOrder;
        await this.refresh();
      }
    });

    // View toggle
    document.getElementById('grid-view-btn').addEventListener('click', () => this._setViewMode('grid'));
    document.getElementById('list-view-btn').addEventListener('click', () => this._setViewMode('list'));

    // New folder button
    document.getElementById('new-folder-btn').addEventListener('click', () => {
      Folders.showCreateModal();
    });

    // Hamburger menu (mobile)
    const hamburger = document.getElementById('hamburger-btn');
    const hamburgerNotes = document.getElementById('hamburger-btn-notes');
    const hamburgerTasks = document.getElementById('hamburger-btn-tasks');
    const backdrop = document.getElementById('sidebar-backdrop');
    [hamburger, hamburgerNotes, hamburgerTasks].forEach((btn) => {
      if (btn) btn.addEventListener('click', () => this.toggleSidebar());
    });
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeSidebar());
    }

    // FAB menu toggle (mobile)
    const fabBtn = document.getElementById('fab-btn');
    const fabMenu = document.getElementById('fab-menu');
    if (fabBtn && fabMenu) {
      fabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fabMenu.classList.toggle('open');
        fabBtn.classList.toggle('active');
      });

      document.getElementById('fab-upload-file').addEventListener('click', () => {
        fabMenu.classList.remove('open');
        fabBtn.classList.remove('active');
        this.navigateToView('files');
        document.getElementById('file-input').click();
      });

      document.getElementById('fab-new-note').addEventListener('click', () => {
        fabMenu.classList.remove('open');
        fabBtn.classList.remove('active');
        this.navigateToView('notes');
        Notes.createNote();
      });

      document.getElementById('fab-new-task').addEventListener('click', () => {
        fabMenu.classList.remove('open');
        fabBtn.classList.remove('active');
        this.navigateToView('tasks');
        setTimeout(() => {
          const input = document.getElementById('task-input');
          if (input) input.focus();
        }, 100);
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!fabMenu.contains(e.target) && !fabBtn.contains(e.target)) {
          fabMenu.classList.remove('open');
          fabBtn.classList.remove('active');
        }
      });
    }

    // Escape key closes sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSidebar();
    });

    // App nav (files / notes / tasks)
    document.querySelectorAll('#app-nav .nav-item').forEach((btn) => {
      btn.addEventListener('click', () => this.navigateToView(btn.dataset.view));
    });

    // New note button
    const newNoteBtn = document.getElementById('new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => Notes.createNote());
    }
  },

  _setViewMode(mode) {
    this.state.viewMode = mode;
    document.getElementById('grid-view-btn').classList.toggle('active', mode === 'grid');
    document.getElementById('list-view-btn').classList.toggle('active', mode === 'list');
    Gallery.render(this.state.files, mode);
  },

  /* ------------------------------------------------------------------ */
  /*  Data loading                                                        */
  /* ------------------------------------------------------------------ */

  async refresh() {
    this._setLoading(true);
    try {
      await Promise.all([this._loadFiles(), this._loadFolders()]);
      Gallery.render(this.state.files, this.state.viewMode);
      Folders.render(this.state.folders, this.state.currentFolder);
      Folders.renderBreadcrumb(this.state.currentFolder);
      await this._updateStorageInfo();
    } catch (err) {
      console.error(err);
      Toast.show('Failed to load data. Check your Supabase credentials.', 'error');
    } finally {
      this._setLoading(false);
    }
  },

  async _loadFiles() {
    const { searchQuery, currentFolder, sortBy, sortOrder } = this.state;
    // When searching, look across all folders
    const folderFilter = searchQuery.trim() ? '__all__' : currentFolder;
    this.state.files = await DB.getFiles({
      folder:    folderFilter,
      search:    searchQuery,
      sortBy,
      sortOrder,
    });
  },

  async _loadFolders() {
    this.state.folders = await DB.getFolders();
  },

  _setLoading(val) {
    document.getElementById('loading-state').classList.toggle('hidden', !val);
    if (val) {
      document.getElementById('files-container').innerHTML = '';
      document.getElementById('empty-state').classList.add('hidden');
    }
  },

  async _updateStorageInfo() {
    try {
      const totalBytes = await DB.getTotalSize();
      const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
      const maxMB  = 1000; // 1 GB soft cap for display
      const pct    = Math.min((totalBytes / (maxMB * 1024 * 1024)) * 100, 100).toFixed(1);

      document.getElementById('storage-bar').style.width  = `${pct}%`;
      document.getElementById('storage-text').textContent = `${usedMB} MB / 1 GB`;
    } catch (_) {
      document.getElementById('storage-text').textContent = 'Unavailable';
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Navigation                                                          */
  /* ------------------------------------------------------------------ */

  navigateTo(folder) {
    this.state.currentFolder = folder;
    this.state.searchQuery   = '';
    document.getElementById('search-input').value = '';
    this.closeSidebar();
    this.refresh();
  },

  navigateToView(view) {
    if (view === this.state.currentView) return;
    this.state.currentView = view;

    // Update sidebar active state
    document.querySelectorAll('#app-nav .nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    const isFiles = view === 'files';
    const isTasks = view === 'tasks';

    // Toggle main view containers
    document.getElementById('files-view-wrapper').classList.toggle('hidden', !isFiles);
    document.getElementById('notes-view').classList.toggle('hidden', view !== 'notes');
    document.getElementById('tasks-view').classList.toggle('hidden', view !== 'tasks');

    // Toggle context panels in sidebar
    document.getElementById('ctx-files').classList.toggle('hidden', !isFiles);
    document.getElementById('ctx-tasks').classList.toggle('hidden', !isTasks);

    this.closeSidebar();

    // Load data for the view
    if (view === 'notes') Notes.load();
    if (view === 'tasks') Tasks.load();
  },

  /* ------------------------------------------------------------------ */
  /*  Sidebar toggle (mobile)                                             */
  /* ------------------------------------------------------------------ */

  toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
  },

  closeSidebar() {
    document.body.classList.remove('sidebar-open');
  },

  /* ------------------------------------------------------------------ */
  /*  File actions                                                        */
  /* ------------------------------------------------------------------ */

  async deleteFile(file) {
    if (!confirm(`Delete "${file.filename}"? This cannot be undone.`)) return;
    try {
      await Promise.all([
        Storage.deleteFile(file.storage_path),
        DB.deleteFile(file.id),
      ]);
      Toast.show(`"${file.filename}" deleted.`, 'success');
      await this.refresh();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to delete "${file.filename}": ${err.message}`, 'error');
    }
  },

  openMoveModal(file) {
    Folders.showMoveModal(file, this.state.folders);
  },

  async moveFile(file, newFolder) {
    try {
      await DB.moveFile(file.id, newFolder);
      Toast.show(`"${file.filename}" moved to ${newFolder === 'root' ? 'All Files' : newFolder}.`, 'success');
      await this.refresh();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to move file: ${err.message}`, 'error');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Folder actions                                                      */
  /* ------------------------------------------------------------------ */

  async createFolder(name) {
    // Sanitize name
    const clean = name.trim().replace(/[^\w\s-]/g, '').trim();
    if (!clean) { Toast.show('Invalid folder name.', 'error'); return; }

    // Check for duplicate
    if (this.state.folders.some(f => f.name.toLowerCase() === clean.toLowerCase())) {
      Toast.show(`Folder "${clean}" already exists.`, 'warning');
      return;
    }

    try {
      await DB.createFolder(clean);
      Toast.show(`Folder "${clean}" created.`, 'success');
      await this.refresh();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to create folder: ${err.message}`, 'error');
    }
  },

  async deleteFolder(name) {
    if (!confirm(`Delete folder "${name}"? Files inside will be moved to All Files.`)) return;
    try {
      await DB.deleteFolder(name);
      if (this.state.currentFolder === name) this.state.currentFolder = 'root';
      Toast.show(`Folder "${name}" deleted.`, 'success');
      await this.refresh();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to delete folder: ${err.message}`, 'error');
    }
  },
};

/* ------------------------------------------------------------------ */
/*  Boot                                                                */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => App.init());
