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
/*  Friendly error messages                                             */
/*  Maps common raw Supabase/network error text to plain-English copy,  */
/*  falling back to the original message for anything unrecognized.     */
/* ------------------------------------------------------------------ */
function friendlyError(err) {
  const raw = (err && err.message) || String(err || '');
  const msg = raw.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('already registered') || msg.includes('duplicate key value') || msg.includes('already exists')) {
    return 'That name or email is already in use.';
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    return 'Network error — check your connection and try again.';
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return "You don't have permission to do that.";
  }
  if (msg.includes('jwt') || msg.includes('session') || msg.includes('not authenticated')) {
    return 'Your session expired — please sign in again.';
  }

  return raw;
}

/* ------------------------------------------------------------------ */
/*  Application state + coordinator                                     */
/* ------------------------------------------------------------------ */
const App = {
  state: {
    currentFolder: 'root',
    currentView:   'files', // 'files' | 'notes' | 'tasks' | 'settings'
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

    // Wait for authentication before mounting the app
    await Auth.init();

    // Sidebar: open by default on desktop, closed on mobile
    if (window.innerWidth > 768) {
      document.body.classList.add('sidebar-open');
    }

    // Default: expand both sections on first visit, so their "New X"
    // buttons are visible without needing to discover the chevron toggle.
    if (localStorage.getItem('sidebar-folders-collapsed') === null) {
      localStorage.setItem('sidebar-folders-collapsed', 'false');
    }
    if (localStorage.getItem('sidebar-projects-collapsed') === null) {
      localStorage.setItem('sidebar-projects-collapsed', 'false');
    }

    this._initControls();
    Upload.init();
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

    // New project button
    document.getElementById('new-project-btn').addEventListener('click', () => {
      Projects.showCreateModal();
    });

    // Sidebar collapse toggle
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const expandTab = document.getElementById('sidebar-expand-tab');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (collapseBtn) collapseBtn.addEventListener('click', () => this.toggleSidebar());
    if (expandTab) expandTab.addEventListener('click', () => this.toggleSidebar());
    if (backdrop) backdrop.addEventListener('click', () => this.closeSidebar());

    // Collapsible sidebar sections
    document.querySelectorAll('.sidebar-section-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.sidebar-section-group');
        const section = btn.dataset.section;
        group.classList.toggle('collapsed');
        btn.setAttribute('aria-expanded', !group.classList.contains('collapsed'));
        localStorage.setItem(`sidebar-${section}-collapsed`, group.classList.contains('collapsed'));
      });
    });

    // Restore section collapse state from localStorage
    ['folders', 'projects'].forEach((section) => {
      const collapsed = localStorage.getItem(`sidebar-${section}-collapsed`) === 'true';
      const group = document.getElementById(`${section}-section`);
      if (group && collapsed) {
        group.classList.add('collapsed');
        const toggle = group.querySelector('.sidebar-section-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // 3D theme toggle
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
      themeToggle.checked = document.documentElement.classList.contains('theme-3d');
      themeToggle.addEventListener('change', () => {
        const enabled = themeToggle.checked;
        document.documentElement.classList.toggle('theme-3d', enabled);
        localStorage.setItem('ui-theme', enabled ? '3d' : 'classic');
      });
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

      document.getElementById('fab-new-folder').addEventListener('click', () => {
        fabMenu.classList.remove('open');
        fabBtn.classList.remove('active');
        this.navigateToView('files');
        Folders.showCreateModal();
      });

      document.getElementById('fab-new-project').addEventListener('click', () => {
        fabMenu.classList.remove('open');
        fabBtn.classList.remove('active');
        this.navigateToView('tasks');
        Projects.showCreateModal();
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
        setTimeout(() => Tasks.showCreateModal(), 100);
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

    // User info in the sidebar footer doubles as the entry point into Settings
    const userInfoBtn = document.getElementById('user-info');
    if (userInfoBtn) {
      userInfoBtn.addEventListener('click', () => this.navigateToView('settings'));
    }

    // New note button
    const newNoteBtn = document.getElementById('new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => Notes.createNote());
    }

    // New task button
    const newTaskBtn = document.getElementById('new-task-btn');
    if (newTaskBtn) {
      newTaskBtn.addEventListener('click', () => Tasks.showCreateModal());
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

      const miniBar = document.getElementById('storage-mini-bar');
      const mini = document.getElementById('storage-mini');
      if (miniBar) miniBar.style.width = `${pct}%`;
      if (mini) mini.title = `${usedMB} MB / 1 GB used`;
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
    const userInfoBtn = document.getElementById('user-info');
    if (userInfoBtn) userInfoBtn.classList.toggle('active', view === 'settings');

    const isFiles = view === 'files';

    // Toggle main view containers
    document.getElementById('files-view-wrapper').classList.toggle('hidden', !isFiles);
    document.getElementById('notes-view').classList.toggle('hidden', view !== 'notes');
    document.getElementById('tasks-view').classList.toggle('hidden', view !== 'tasks');
    document.getElementById('settings-view').classList.toggle('hidden', view !== 'settings');

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
    if (window.innerWidth <= 768) {
      document.body.classList.remove('sidebar-open');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  File actions                                                        */
  /* ------------------------------------------------------------------ */

  async deleteFile(file) {
    const confirmed = await Confirm.show({
      title: 'Delete File?',
      description: `Delete "${file.filename}"? This cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await Promise.all([
        Storage.deleteFile(file.storage_path),
        DB.deleteFile(file.id),
      ]);
      Toast.show(`"${file.filename}" deleted.`, 'success');
      await this.refresh();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to delete "${file.filename}": ${friendlyError(err)}`, 'error');
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
      Toast.show(`Failed to move file: ${friendlyError(err)}`, 'error');
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
      Toast.show(`Failed to create folder: ${friendlyError(err)}`, 'error');
    }
  },

  async deleteFolder(name) {
    const confirmed = await Confirm.show({
      title: 'Delete Folder?',
      description: `Delete folder "${name}"? Files inside will be moved to All Files.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await DB.deleteFolder(name);
      if (this.state.currentFolder === name) this.state.currentFolder = 'root';
      Toast.show(`Folder "${name}" deleted.`, 'success');
      await this.refresh();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to delete folder: ${friendlyError(err)}`, 'error');
    }
  },
};

/* ------------------------------------------------------------------ */
/*  Boot                                                                */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => App.init());
