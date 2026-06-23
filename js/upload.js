/**
 * js/upload.js
 * -------------
 * Handles file input clicks, drag-and-drop, progress UI, and
 * the full upload pipeline: Storage → DB → refresh.
 */

const Upload = {
  /** Queue of files waiting to be uploaded (used for sequential upload) */
  _queue: [],
  _isUploading: false,

  /* ------------------------------------------------------------------ */
  /*  Initialization                                                      */
  /* ------------------------------------------------------------------ */

  init() {
    // File input (button click)
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._enqueue(Array.from(e.target.files));
        fileInput.value = ''; // reset so same file can be re-uploaded
      }
    });

    // Drag & drop — overlay the entire main area
    const main = document.querySelector('.main-content');
    const overlay = document.getElementById('drop-zone-overlay');

    let dragCounter = 0;

    main.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      overlay.classList.remove('hidden');
    });

    main.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        overlay.classList.add('hidden');
      }
    });

    main.addEventListener('dragover', (e) => { e.preventDefault(); });

    main.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      overlay.classList.add('hidden');

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) this._enqueue(files);
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Queue management                                                    */
  /* ------------------------------------------------------------------ */

  _enqueue(files) {
    this._queue.push(...files);
    if (!this._isUploading) this._processQueue();
  },

  async _processQueue() {
    if (this._queue.length === 0) {
      this._isUploading = false;
      return;
    }

    this._isUploading = true;
    const file = this._queue.shift();
    await this._uploadOne(file);
    this._processQueue(); // process next
  },

  /* ------------------------------------------------------------------ */
  /*  Single file upload                                                  */
  /* ------------------------------------------------------------------ */

  async _uploadOne(file) {
    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      Toast.show(`"${file.name}" exceeds the 50 MB limit.`, 'error');
      return;
    }

    const folder = App.state.currentFolder;
    const storagePath = Storage.buildStoragePath(folder, file.name);

    // Show progress overlay
    this._showProgress(file.name, 0);

    try {
      // 1. Upload to Supabase Storage
      await Storage.uploadFile(storagePath, file, (percent) => {
        this._showProgress(file.name, percent);
      });

      // 2. Save metadata to database
      await DB.insertFile({
        filename:     file.name,
        storage_path: storagePath,
        size:         file.size,
        file_type:    file.type || 'application/octet-stream',
        folder:       folder,
      });

      Toast.show(`"${file.name}" uploaded successfully.`, 'success');

      // 3. Refresh the file list
      await App.refresh();

    } catch (err) {
      console.error(err);
      Toast.show(`Failed to upload "${file.name}": ${err.message}`, 'error');
    } finally {
      this._hideProgress();
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Progress overlay                                                    */
  /* ------------------------------------------------------------------ */

  _showProgress(filename, percent) {
    const overlay    = document.getElementById('upload-overlay');
    const nameEl     = document.getElementById('upload-filename');
    const percentEl  = document.getElementById('upload-percent');
    const bar        = document.getElementById('progress-bar');

    nameEl.textContent = filename.length > 40
      ? filename.slice(0, 37) + '...'
      : filename;
    percentEl.textContent = `${percent}%`;
    bar.style.width = `${percent}%`;
    overlay.classList.remove('hidden');
  },

  _hideProgress() {
    // Brief delay so user sees 100%
    setTimeout(() => {
      document.getElementById('upload-overlay').classList.add('hidden');
      document.getElementById('progress-bar').style.width = '0%';
    }, 500);
  },
};
