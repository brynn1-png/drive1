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

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;

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
          <div class="config-warning-icon">⚙️</div>
          <h2>Setup Required</h2>
          <p>Open <strong>js/config.js</strong> and fill in your Supabase URL and Anon Key to get started.</p>
        </div>
      `;
      return;
    }

    this._initControls();
    Upload.init();

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
      document.getElementById('storage-text').textContent = `${usedMB} MB used`;
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
    this.refresh();
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
