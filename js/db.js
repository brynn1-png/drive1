/**
 * js/db.js
 * ---------
 * All Supabase Database (PostgreSQL) operations.
 * Provides a clean abstraction over raw supabase-js calls.
 */

const DB = {
  /* ------------------------------------------------------------------ */
  /*  FILES                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Insert a new file record into the `files` table.
   * @param {{ filename, storage_path, size, file_type, folder }} meta
   * @returns {Promise<Object>} The inserted row.
   */
  async insertFile({ filename, storage_path, size, file_type, folder }) {
    const { data, error } = await supabaseClient
      .from('files')
      .insert([{ filename, storage_path, size, file_type, folder }])
      .select()
      .single();

    if (error) throw new Error(`DB.insertFile: ${error.message}`);
    return data;
  },

  /**
   * Query files with optional folder filter, search, and sort.
   * @param {Object} opts
   * @param {string}  opts.folder     - e.g. 'root' | 'Photos'
   * @param {string}  [opts.search]   - substring match on filename
   * @param {string}  [opts.sortBy]   - column name: 'filename' | 'size' | 'created_at'
   * @param {string}  [opts.sortOrder]- 'asc' | 'desc'
   * @returns {Promise<Array>}
   */
  async getFiles({ folder = 'root', search = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    let query = supabaseClient.from('files').select('*');

    // Folder filter — empty string means "all files" (used during search)
    if (folder && folder !== '__all__') {
      query = query.eq('folder', folder);
    }

    // Search filter
    if (search.trim()) {
      query = query.ilike('filename', `%${search.trim()}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw new Error(`DB.getFiles: ${error.message}`);
    return data || [];
  },

  /**
   * Delete a file record by ID.
   * @param {string} id - uuid
   */
  async deleteFile(id) {
    const { error } = await supabaseClient
      .from('files')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`DB.deleteFile: ${error.message}`);
  },

  /**
   * Move a file to a different folder (updates the `folder` field only).
   * The storage path remains unchanged.
   * @param {string} id
   * @param {string} newFolder
   */
  async moveFile(id, newFolder) {
    const { error } = await supabaseClient
      .from('files')
      .update({ folder: newFolder })
      .eq('id', id);

    if (error) throw new Error(`DB.moveFile: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  FOLDERS                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Get all user-created folders, sorted by name.
   * @returns {Promise<Array>}
   */
  async getFolders() {
    const { data, error } = await supabaseClient
      .from('folders')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`DB.getFolders: ${error.message}`);
    return data || [];
  },

  /**
   * Create a new folder.
   * @param {string} name
   * @returns {Promise<Object>} The inserted folder row.
   */
  async createFolder(name) {
    const { data, error } = await supabaseClient
      .from('folders')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw new Error(`DB.createFolder: ${error.message}`);
    return data;
  },

  /**
   * Delete a folder by name. Files inside are moved to 'root'.
   * @param {string} name
   */
  async deleteFolder(name) {
    // Move all files in this folder to root first
    await supabaseClient
      .from('files')
      .update({ folder: 'root' })
      .eq('folder', name);

    const { error } = await supabaseClient
      .from('folders')
      .delete()
      .eq('name', name);

    if (error) throw new Error(`DB.deleteFolder: ${error.message}`);
  },

  /**
   * Count files in a folder (used for storage stats sidebar).
   * @param {string} [folder]
   * @returns {Promise<number>}
   */
  async countFiles(folder) {
    let query = supabaseClient.from('files').select('id', { count: 'exact', head: true });
    if (folder) query = query.eq('folder', folder);
    const { count, error } = await query;
    if (error) throw new Error(`DB.countFiles: ${error.message}`);
    return count || 0;
  },

  /**
   * Get total used storage (sum of all file sizes).
   * @returns {Promise<number>} Total bytes
   */
  async getTotalSize() {
    const { data, error } = await supabaseClient
      .from('files')
      .select('size');

    if (error) throw new Error(`DB.getTotalSize: ${error.message}`);
    return (data || []).reduce((sum, row) => sum + (row.size || 0), 0);
  },
};
