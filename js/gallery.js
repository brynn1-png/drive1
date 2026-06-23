/**
 * js/gallery.js
 * --------------
 * Renders files in grid or list view.
 * Handles image lightbox, download, delete, and move actions.
 */

const Gallery = {
  /** Currently active lightbox URL */
  _lightboxUrl: null,

  /* ------------------------------------------------------------------ */
  /*  Main render                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Render all files into #files-container.
   * @param {Array}  files    - Array of file rows from DB
   * @param {string} viewMode - 'grid' | 'list'
   */
  render(files, viewMode) {
    const container = document.getElementById('files-container');
    const emptyState = document.getElementById('empty-state');
    const fileCount  = document.getElementById('file-count');

    container.innerHTML = '';
    container.className = `files-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`;

    if (!files || files.length === 0) {
      emptyState.classList.remove('hidden');
      fileCount.textContent = '';
      return;
    }

    emptyState.classList.add('hidden');
    fileCount.textContent = `${files.length} ${files.length === 1 ? 'file' : 'files'}`;

    if (viewMode === 'list') {
      container.appendChild(this._buildListHeader());
    }

    files.forEach(file => {
      const el = viewMode === 'list'
        ? this._buildListRow(file)
        : this._buildGridCard(file);
      container.appendChild(el);
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Grid card                                                           */
  /* ------------------------------------------------------------------ */

  _buildGridCard(file) {
    const isImage = IMAGE_TYPES.includes(file.file_type);
    const publicUrl = Storage.getPublicUrl(file.storage_path);

    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = file.id;

    const preview = document.createElement('div');
    preview.className = 'file-card-preview';

    if (isImage) {
      const img = document.createElement('img');
      img.src = publicUrl;
      img.alt = file.filename;
      img.loading = 'lazy';
      img.onerror = () => { preview.innerHTML = `<span class="file-icon">${this._getIcon(file.file_type)}</span>`; };
      preview.appendChild(img);
      // Click preview to open lightbox
      preview.addEventListener('click', () => this._openLightbox(publicUrl, file.filename));
      preview.style.cursor = 'zoom-in';
    } else {
      preview.innerHTML = `<span class="file-icon">${this._getIcon(file.file_type)}</span>`;
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

    const actions = document.createElement('div');
    actions.className = 'file-card-actions';
    actions.innerHTML = `
      <button class="action-btn" title="Download" data-action="download" data-id="${file.id}">↓</button>
      <button class="action-btn" title="Move to folder" data-action="move" data-id="${file.id}">⤷</button>
      <button class="action-btn danger" title="Delete" data-action="delete" data-id="${file.id}">✕</button>
    `;

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(actions);

    this._attachCardActions(card, file, publicUrl);
    return card;
  },

  /* ------------------------------------------------------------------ */
  /*  List row                                                            */
  /* ------------------------------------------------------------------ */

  _buildListHeader() {
    const header = document.createElement('div');
    header.className = 'list-header';
    header.innerHTML = `
      <div class="list-col col-icon"></div>
      <div class="list-col col-name">Name</div>
      <div class="list-col col-size">Size</div>
      <div class="list-col col-type">Type</div>
      <div class="list-col col-date">Date</div>
      <div class="list-col col-actions">Actions</div>
    `;
    return header;
  },

  _buildListRow(file) {
    const isImage = IMAGE_TYPES.includes(file.file_type);
    const publicUrl = Storage.getPublicUrl(file.storage_path);

    const row = document.createElement('div');
    row.className = 'list-row';
    row.dataset.id = file.id;

    row.innerHTML = `
      <div class="list-col col-icon">
        <span class="file-icon-sm">${this._getIcon(file.file_type)}</span>
      </div>
      <div class="list-col col-name">
        <span class="list-filename" title="${this._esc(file.filename)}">${this._esc(file.filename)}</span>
      </div>
      <div class="list-col col-size">${this._formatSize(file.size)}</div>
      <div class="list-col col-type">${this._getTypeLabel(file.file_type)}</div>
      <div class="list-col col-date">${this._formatDate(file.created_at)}</div>
      <div class="list-col col-actions">
        <button class="action-btn" title="Download" data-action="download" data-id="${file.id}">↓</button>
        ${isImage ? `<button class="action-btn" title="Preview" data-action="preview" data-id="${file.id}">👁</button>` : ''}
        <button class="action-btn" title="Move to folder" data-action="move" data-id="${file.id}">⤷</button>
        <button class="action-btn danger" title="Delete" data-action="delete" data-id="${file.id}">✕</button>
      </div>
    `;

    this._attachCardActions(row, file, publicUrl);
    return row;
  },

  /* ------------------------------------------------------------------ */
  /*  Action wiring                                                       */
  /* ------------------------------------------------------------------ */

  _attachCardActions(el, file, publicUrl) {
    el.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;

        if (action === 'download') this._downloadFile(file.storage_path, file.filename);
        if (action === 'preview')  this._openLightbox(publicUrl, file.filename);
        if (action === 'delete')   App.deleteFile(file);
        if (action === 'move')     App.openMoveModal(file);
      });
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Lightbox                                                            */
  /* ------------------------------------------------------------------ */

  _openLightbox(url, alt) {
    const lb    = document.getElementById('lightbox');
    const img   = document.getElementById('lightbox-img');
    const close = document.getElementById('lightbox-close');

    img.src = url;
    img.alt = alt;
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const closeFn = () => {
      lb.classList.add('hidden');
      img.src = '';
      document.body.style.overflow = '';
      lb.removeEventListener('click', bgClose);
      close.removeEventListener('click', closeFn);
    };

    const bgClose = (e) => { if (e.target === lb) closeFn(); };

    close.addEventListener('click', closeFn);
    lb.addEventListener('click', bgClose);

    // ESC key closes lightbox
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeFn(); document.removeEventListener('keydown', escHandler); }
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Download                                                            */
  /* ------------------------------------------------------------------ */

  async _downloadFile(storagePath, filename) {
    try {
      // Use Supabase's blob download so the browser gets a same-origin blob URL.
      // A plain <a download> on a cross-origin URL is ignored by browsers,
      // which would open the file in a tab instead of saving it.
      const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .download(storagePath);

      if (error) throw error;

      const blobUrl = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Release the blob URL from memory after the download is triggered
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch (err) {
      console.error('Download failed:', err);
      Toast.show(`Failed to download "${filename}": ${err.message}`, 'error');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  _getIcon(mimeType = '') {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/'))       return '🖼';
    if (mimeType.startsWith('video/'))       return '🎬';
    if (mimeType.startsWith('audio/'))       return '🎵';
    if (mimeType === 'application/pdf')      return '📑';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz') || mimeType.includes('rar')) return '📦';
    if (mimeType.startsWith('text/'))        return '📝';
    if (mimeType.includes('json'))           return '🔧';
    if (mimeType.includes('javascript') || mimeType.includes('typescript')) return '💻';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))    return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽';
    if (mimeType.includes('word') || mimeType.includes('document'))        return '📃';
    return '📄';
  },

  _getTypeLabel(mimeType = '') {
    if (!mimeType) return 'File';
    const map = {
      'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/gif': 'GIF',
      'image/webp': 'WebP', 'image/svg+xml': 'SVG',
      'video/mp4': 'MP4', 'video/webm': 'WebM', 'audio/mpeg': 'MP3',
      'application/pdf': 'PDF', 'application/zip': 'ZIP',
      'text/plain': 'Text', 'text/html': 'HTML', 'text/css': 'CSS',
      'application/json': 'JSON', 'application/javascript': 'JS',
    };
    if (map[mimeType]) return map[mimeType];
    const parts = mimeType.split('/');
    return parts[1] ? parts[1].toUpperCase() : 'File';
  },

  _formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
  },

  _formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  _esc(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};
