/**
 * js/gallery.js
 * --------------
 * Renders files in grid or list view.
 * Handles image lightbox, download, delete, and move actions.
 */

const Gallery = {
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
      const searching = Boolean(App.state.searchQuery.trim());
      document.getElementById('files-empty-title').textContent = searching ? 'No matching files' : 'No files here yet';
      document.getElementById('files-empty-subtitle').textContent = searching
        ? 'Try another name or clear your search.'
        : 'Upload files or drag & drop to get started';
      document.getElementById('files-empty-upload').classList.toggle('hidden', searching);
      document.getElementById('files-empty-clear-search').classList.toggle('hidden', !searching);
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
    const isPdf = file.file_type === 'application/pdf';
    const publicUrl = Storage.getPublicUrl(file.storage_path);

    const card = document.createElement('div');
    card.className = 'file-card' + (file._isShared ? ' shared' : '');
    card.dataset.id = file.id;

    const preview = document.createElement(isImage || isPdf ? 'button' : 'div');
    preview.className = 'file-card-preview';
    if (preview.tagName === 'BUTTON') {
      preview.type = 'button';
      preview.setAttribute('aria-label', `${isImage ? 'Preview image' : 'Open PDF'}: ${file.filename}`);
    }

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
    } else if (isPdf) {
      preview.innerHTML = `<span class="file-icon">${this._getIcon(file.file_type)}</span>`;
      // Click preview to open the PDF in a new tab
      preview.addEventListener('click', () => this._openFile(file.storage_path, file.filename));
      preview.style.cursor = 'pointer';
    } else {
      preview.innerHTML = `<span class="file-icon">${this._getIcon(file.file_type)}</span>`;
    }

    const info = document.createElement('div');
    info.className = 'file-card-info';
    info.innerHTML = `
      ${file._isShared ? `<div class="file-card-badge shared-badge">Shared by ${this._esc((file._sharedBy || 'someone').split('@')[0])}</div>` : ''}
      <div class="file-card-name" title="${this._esc(file.filename)}">${this._esc(file.filename)}</div>
      <div class="file-card-meta">
        <span>${this._formatSize(file.size)}</span>
        <span>${this._formatDate(file.created_at)}</span>
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'file-card-actions';
    if (file._isShared) {
      // Shared files: recipients can preview/open/download; owners of the
      // share can't move or delete the original.
      actions.innerHTML = `
        <button class="action-btn" title="Download" data-action="download" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
      `;
    } else {
      actions.innerHTML = `
      ${isPdf ? `<button class="action-btn" title="Open" data-action="open" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>` : ''}
      <button class="action-btn" title="Download" data-action="download" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
      <button class="action-btn" title="Move to folder" data-action="move" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg></button>
      <button class="action-btn danger" title="Delete" data-action="delete" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
    `;
    }

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
    const isPdf = file.file_type === 'application/pdf';
    const publicUrl = Storage.getPublicUrl(file.storage_path);

    const row = document.createElement('div');
    row.className = 'list-row' + (file._isShared ? ' shared' : '');
    row.dataset.id = file.id;

    row.innerHTML = `
      <div class="list-col col-icon">
        <span class="file-icon-sm">${this._getIcon(file.file_type)}</span>
      </div>
      <div class="list-col col-name">
        <span class="list-filename" title="${this._esc(file.filename)}">${this._esc(file.filename)}</span>
        ${file._isShared ? `<span class="list-shared-badge shared-badge">Shared by ${this._esc((file._sharedBy || 'someone').split('@')[0])}</span>` : ''}
      </div>
      <div class="list-col col-size">${this._formatSize(file.size)}</div>
      <div class="list-col col-type">${this._getTypeLabel(file.file_type)}</div>
      <div class="list-col col-date">${this._formatDate(file.created_at)}</div>
      <div class="list-col col-actions">
        <button class="action-btn" title="Download" data-action="download" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
        ${isImage ? `<button class="action-btn" title="Preview" data-action="preview" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>` : ''}
        ${isPdf ? `<button class="action-btn" title="Open" data-action="open" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>` : ''}
        ${file._isShared ? '' : `
        <button class="action-btn" title="Move to folder" data-action="move" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg></button>
        <button class="action-btn danger" title="Delete" data-action="delete" data-id="${file.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`}
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
        if (action === 'open')     this._openFile(file.storage_path, file.filename);
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
    const previousFocus = document.activeElement;

    img.src = url;
    img.alt = alt;
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    close.focus();

    const closeFn = () => {
      lb.classList.add('hidden');
      img.removeAttribute('src');
      document.body.style.overflow = '';
      lb.removeEventListener('click', bgClose);
      close.removeEventListener('click', closeFn);
      document.removeEventListener('keydown', escHandler);
      if (previousFocus?.isConnected) previousFocus.focus();
    };

    const bgClose = (e) => { if (e.target === lb) closeFn(); };

    close.addEventListener('click', closeFn);
    lb.addEventListener('click', bgClose);

    // ESC key closes lightbox
    const escHandler = (e) => { if (e.key === 'Escape') closeFn(); };
    document.addEventListener('keydown', escHandler);
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
      Toast.show(`Failed to download "${filename}": ${friendlyError(err)}`, 'error');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Open in new tab (PDFs and other browser-viewable files)             */
  /* ------------------------------------------------------------------ */

  async _openFile(storagePath, filename) {
    // Open the tab synchronously (still inside the click's user gesture) so
    // browsers don't treat the later navigation as a blocked popup, then
    // point it at the file once the blob is ready.
    const tab = window.open('', '_blank');

    try {
      const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .download(storagePath);

      if (error) throw error;

      const blobUrl = URL.createObjectURL(data);
      if (tab) {
        tab.location.href = blobUrl;
      } else {
        // Popup blocked — fall back to a same-tab navigation.
        window.location.href = blobUrl;
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      if (tab) tab.close();
      console.error('Open failed:', err);
      Toast.show(`Failed to open "${filename}": ${friendlyError(err)}`, 'error');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  _getIcon(mimeType = '') {
    if (!mimeType) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    if (mimeType.startsWith('image/')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    if (mimeType.startsWith('video/')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
    if (mimeType.startsWith('audio/')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    if (mimeType === 'application/pdf') return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz') || mimeType.includes('rar')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V3h13l5 5z"/><path d="M12 3v6h6"/></svg>';
    if (mimeType.startsWith('text/')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>';
    return '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
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
