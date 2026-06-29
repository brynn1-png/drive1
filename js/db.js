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

  /* ------------------------------------------------------------------ */
  /*  NOTES                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Get all notes, most recently updated first.
   * @returns {Promise<Array>}
   */
  async getNotes() {
    const { data, error } = await supabaseClient
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`DB.getNotes: ${error.message}`);
    return data || [];
  },

  /**
   * Insert a new note.
   * @param {{ title, content }} note
   * @returns {Promise<Object>} The inserted row.
   */
  async insertNote({ title, content }) {
    const { data, error } = await supabaseClient
      .from('notes')
      .insert([{ title, content }])
      .select()
      .single();

    if (error) throw new Error(`DB.insertNote: ${error.message}`);
    return data;
  },

  /**
   * Update a note's title, content, or both.
   * @param {string} id
   * @param {Object} updates - { title?, content? }
   * @returns {Promise<Object>} The updated row.
   */
  async updateNote(id, updates) {
    const { data, error } = await supabaseClient
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`DB.updateNote: ${error.message}`);
    return data;
  },

  /**
   * Delete a note by ID.
   * @param {string} id
   */
  async deleteNote(id) {
    const { error } = await supabaseClient
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`DB.deleteNote: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  PROJECTS                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Get all projects, sorted by name.
   * @returns {Promise<Array>}
   */
  async getProjects() {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`DB.getProjects: ${error.message}`);
    return data || [];
  },

  /**
   * Create a new project.
   * @param {string} name
   * @returns {Promise<Object>} The inserted row.
   */
  async createProject(name) {
    const { data, error } = await supabaseClient
      .from('projects')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw new Error(`DB.createProject: ${error.message}`);
    return data;
  },

  /**
   * Rename a project.
   * @param {string} id
   * @param {string} newName
   * @returns {Promise<Object>} The updated row.
   */
  async renameProject(id, newName) {
    const { data, error } = await supabaseClient
      .from('projects')
      .update({ name: newName })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`DB.renameProject: ${error.message}`);
    return data;
  },

  /**
   * Delete a project. Tasks with this project_id become uncategorized (SET NULL via FK).
   * @param {string} id
   */
  async deleteProject(id) {
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`DB.deleteProject: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  TASKS                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Get tasks with optional project filter.
   * @param {Object} opts
   * @param {string|null} opts.projectId - UUID of project, 'uncategorized' for null project_id, or null/undefined for all
   * @param {string} [opts.filter] - 'all' | 'active' | 'completed'
   * @returns {Promise<Array>}
   */
  async getTasks({ projectId = null, filter = 'all' } = {}) {
    let query = supabaseClient.from('tasks').select('*');

    if (projectId === 'uncategorized') {
      query = query.is('project_id', null);
    } else if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (filter === 'active') {
      query = query.eq('completed', false);
    } else if (filter === 'completed') {
      query = query.eq('completed', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`DB.getTasks: ${error.message}`);
    return data || [];
  },

  /**
   * Insert a new task.
   * @param {string} title
   * @param {string|null} projectId - Optional project UUID
   * @returns {Promise<Object>} The inserted row.
   */
  async insertTask(title, projectId = null) {
    const row = { title };
    if (projectId) row.project_id = projectId;

    const { data, error } = await supabaseClient
      .from('tasks')
      .insert([row])
      .select()
      .single();

    if (error) throw new Error(`DB.insertTask: ${error.message}`);
    return data;
  },

  /**
   * Update a task (completed, title, or due_date).
   * @param {string} id
   * @param {Object} updates - { completed?, title?, due_date? }
   * @returns {Promise<Object>} The updated row.
   */
  async updateTask(id, updates) {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`DB.updateTask: ${error.message}`);
    return data;
  },

  /**
   * Delete a task by ID.
   * @param {string} id
   */
  async deleteTask(id) {
    const { error } = await supabaseClient
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`DB.deleteTask: ${error.message}`);
  },
};
