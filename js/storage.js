/**
 * js/storage.js
 * --------------
 * All Supabase Storage operations.
 * Works with the "drive" bucket (must be set to Public in the dashboard).
 */

const Storage = {
  /**
   * Upload a file to Supabase Storage with progress callback.
   *
   * @param {string}   storagePath  - Full path inside bucket, e.g. "Photos/1234567890-photo.jpg"
   * @param {File}     file         - The File object to upload
   * @param {Function} [onProgress] - Called with (percentComplete: number)
   * @returns {Promise<string>}     - The storagePath on success
   */
  async uploadFile(storagePath, file, onProgress) {
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        },
      });

    if (error) throw new Error(`Storage.uploadFile: ${error.message}`);
    return data.path;
  },

  /**
   * Get a permanent public URL for a stored file.
   * Requires the "drive" bucket to be set as Public.
   *
   * @param {string} storagePath
   * @returns {string} Public URL
   */
  getPublicUrl(storagePath) {
    const { data } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  },

  /**
   * Delete a file from Supabase Storage.
   *
   * @param {string} storagePath
   */
  async deleteFile(storagePath) {
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) throw new Error(`Storage.deleteFile: ${error.message}`);
  },

  /**
   * Build a unique storage path for a file.
   * Format: "{folder}/{timestamp}-{sanitized-filename}"
   *
   * @param {string} folder   - Folder name (e.g. 'Photos', 'root')
   * @param {string} filename - Original filename
   * @returns {string}
   */
  buildStoragePath(folder, filename) {
    const timestamp = Date.now();
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // replace unsafe chars
      .replace(/_+/g, '_');               // collapse multiple underscores
    return `${folder}/${timestamp}-${sanitized}`;
  },
};
