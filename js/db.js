/**
 * js/db.js
 * ---------
 * All Supabase Database (PostgreSQL) operations.
 * Provides a clean abstraction over raw supabase-js calls.
 */

const DB = {
  _uid() {
    const userId = Auth.getUserId();
    if (!userId) throw new Error('DB: not authenticated');
    return userId;
  },

  /* ------------------------------------------------------------------ */
  /*  FILES                                                               */
  /* ------------------------------------------------------------------ */

  async insertFile({ filename, storage_path, size, file_type, folder }) {
    const { data, error } = await supabaseClient
      .from('files')
      .insert([{ filename, storage_path, size, file_type, folder, user_id: this._uid() }])
      .select()
      .single();

    if (error) throw new Error(`DB.insertFile: ${error.message}`);
    return data;
  },

  async getFiles({ folder = 'root', search = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    let query = supabaseClient.from('files').select('*').eq('user_id', this._uid());

    if (folder && folder !== '__all__') {
      query = query.eq('folder', folder);
    }

    if (search.trim()) {
      query = query.ilike('filename', `%${search.trim()}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw new Error(`DB.getFiles: ${error.message}`);
    return data || [];
  },

  async getAllFiles() {
    const { data, error } = await supabaseClient
      .from('files')
      .select('*')
      .eq('user_id', this._uid())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB.getAllFiles: ${error.message}`);
    return data || [];
  },

  async deleteFile(id) {
    const { error } = await supabaseClient
      .from('files')
      .delete()
      .eq('id', id)
      .eq('user_id', this._uid());

    if (error) throw new Error(`DB.deleteFile: ${error.message}`);
  },

  async moveFile(id, newFolder) {
    const { error } = await supabaseClient
      .from('files')
      .update({ folder: newFolder })
      .eq('id', id)
      .eq('user_id', this._uid());

    if (error) throw new Error(`DB.moveFile: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  FOLDERS                                                             */
  /* ------------------------------------------------------------------ */

  async getFolders() {
    const { data, error } = await supabaseClient
      .from('folders')
      .select('*')
      .eq('user_id', this._uid())
      .order('name', { ascending: true });

    if (error) throw new Error(`DB.getFolders: ${error.message}`);
    return data || [];
  },

  async createFolder(name) {
    const { data, error } = await supabaseClient
      .from('folders')
      .insert([{ name, user_id: this._uid() }])
      .select()
      .single();

    if (error) throw new Error(`DB.createFolder: ${error.message}`);
    return data;
  },

  async deleteFolder(name) {
    const uid = this._uid();

    await supabaseClient
      .from('files')
      .update({ folder: 'root' })
      .eq('folder', name)
      .eq('user_id', uid);

    const { error } = await supabaseClient
      .from('folders')
      .delete()
      .eq('name', name)
      .eq('user_id', uid);

    if (error) throw new Error(`DB.deleteFolder: ${error.message}`);
  },

  async countFiles(folder) {
    let query = supabaseClient.from('files').select('id', { count: 'exact', head: true }).eq('user_id', this._uid());
    if (folder) query = query.eq('folder', folder);
    const { count, error } = await query;
    if (error) throw new Error(`DB.countFiles: ${error.message}`);
    return count || 0;
  },

  async getTotalSize() {
    const { data, error } = await supabaseClient
      .from('files')
      .select('size')
      .eq('user_id', this._uid());

    if (error) throw new Error(`DB.getTotalSize: ${error.message}`);
    return (data || []).reduce((sum, row) => sum + (row.size || 0), 0);
  },

  /* ------------------------------------------------------------------ */
  /*  NOTES                                                               */
  /* ------------------------------------------------------------------ */

  async getNotes() {
    const { data, error } = await supabaseClient
      .from('notes')
      .select('*')
      .eq('user_id', this._uid())
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`DB.getNotes: ${error.message}`);
    return data || [];
  },

  async insertNote({ title, content }) {
    const { data, error } = await supabaseClient
      .from('notes')
      .insert([{ title, content, user_id: this._uid() }])
      .select()
      .single();

    if (error) throw new Error(`DB.insertNote: ${error.message}`);
    return data;
  },

  async updateNote(id, updates) {
    const { data, error } = await supabaseClient
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', this._uid())
      .select()
      .single();

    if (error) throw new Error(`DB.updateNote: ${error.message}`);
    return data;
  },

  async updateSharedNote(id, updates) {
    const { data, error } = await supabaseClient
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`DB.updateSharedNote: ${error.message}`);
    return data;
  },

  async deleteNote(id) {
    const { error } = await supabaseClient
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', this._uid());

    if (error) throw new Error(`DB.deleteNote: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  PROJECTS                                                            */
  /* ------------------------------------------------------------------ */

  async getProjects() {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('user_id', this._uid())
      .order('name', { ascending: true });

    if (error) throw new Error(`DB.getProjects: ${error.message}`);
    return data || [];
  },

  async createProject(name) {
    const { data, error } = await supabaseClient
      .from('projects')
      .insert([{ name, user_id: this._uid() }])
      .select()
      .single();

    if (error) throw new Error(`DB.createProject: ${error.message}`);
    return data;
  },

  async renameProject(id, newName) {
    const { data, error } = await supabaseClient
      .from('projects')
      .update({ name: newName })
      .eq('id', id)
      .eq('user_id', this._uid())
      .select()
      .single();

    if (error) throw new Error(`DB.renameProject: ${error.message}`);
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', this._uid());

    if (error) throw new Error(`DB.deleteProject: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  TASKS                                                               */
  /* ------------------------------------------------------------------ */

  async getTasks({ projectId = null, noteId = null, filter = 'all' } = {}) {
    let query = supabaseClient.from('tasks').select('*').eq('user_id', this._uid());

    if (projectId === 'uncategorized') {
      query = query.is('project_id', null);
    } else if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (noteId) {
      query = query.eq('note_id', noteId);
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

  async insertTask(title, projectId = null, dueDate = null, noteId = null) {
    const row = { title, user_id: this._uid() };
    if (projectId) row.project_id = projectId;
    if (dueDate) row.due_date = dueDate;
    if (noteId) row.note_id = noteId;

    const { data, error } = await supabaseClient
      .from('tasks')
      .insert([row])
      .select()
      .single();

    if (error) throw new Error(`DB.insertTask: ${error.message}`);
    return data;
  },

  async updateTask(id, updates) {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', this._uid())
      .select()
      .single();

    if (error) throw new Error(`DB.updateTask: ${error.message}`);
    return data;
  },

  async deleteTask(id) {
    const { error } = await supabaseClient
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', this._uid());

    if (error) throw new Error(`DB.deleteTask: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  ADMIN                                                               */
  /* ------------------------------------------------------------------ */

  async isAdmin() {
    const { data, error } = await supabaseClient
      .from('admins')
      .select('user_id')
      .eq('user_id', this._uid())
      .maybeSingle();

    if (error) throw new Error(`DB.isAdmin: ${error.message}`);
    return !!data;
  },

  async getAllProfiles() {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB.getAllProfiles: ${error.message}`);
    return data || [];
  },

  /* ------------------------------------------------------------------ */
  /*  SHARING                                                            */
  /* ------------------------------------------------------------------ */

  async getUsers() {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .neq('id', this._uid())
      .order('email', { ascending: true });

    if (error) throw new Error(`DB.getUsers: ${error.message}`);
    return data || [];
  },

  async shareNotes(pairs) {
    const uid = this._uid();
    const unique = [];
    const seen = new Set();
    for (const pair of pairs) {
      const key = `${pair.note_id}::${pair.shared_with_user_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ ...pair, owner_user_id: uid });
      }
    }
    if (unique.length === 0) return;

    const { error } = await supabaseClient
      .from('note_shares')
      .insert(unique);

    if (error) throw new Error(`DB.shareNotes: ${error.message}`);
  },

  async getMyShares() {
    const { data, error } = await supabaseClient
      .from('note_shares')
      .select('id, note_id, shared_with_user_id, permission, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB.getMyShares: ${error.message}`);
    return data || [];
  },

  async getSharedWithMe() {
    const { data, error } = await supabaseClient
      .from('note_shares')
      .select('id, note_id, owner_user_id, permission, created_at, notes(title, content, content_delta, updated_at)')
      .eq('shared_with_user_id', this._uid())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB.getSharedWithMe: ${error.message}`);
    return data || [];
  },

  async updateSharePermission(shareId, permission) {
    const { error } = await supabaseClient
      .from('note_shares')
      .update({ permission })
      .eq('id', shareId);

    if (error) throw new Error(`DB.updateSharePermission: ${error.message}`);
  },

  async revokeShare(shareId) {
    const { error } = await supabaseClient
      .from('note_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw new Error(`DB.revokeShare: ${error.message}`);
  },

  /* ------------------------------------------------------------------ */
  /*  FILE SHARES                                                         */
  /* ------------------------------------------------------------------ */

  async shareFiles(pairs) {
    const uid = this._uid();
    const unique = [];
    const seen = new Set();
    for (const pair of pairs) {
      const key = `${pair.file_id}::${pair.shared_with_user_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ ...pair, owner_user_id: uid });
      }
    }
    if (unique.length === 0) return;

    const { error } = await supabaseClient
      .from('file_shares')
      .insert(unique);

    if (error) throw new Error(`DB.shareFiles: ${error.message}`);
  },

  async getFileShares() {
    const { data, error } = await supabaseClient
      .from('file_shares')
      .select('id, file_id, shared_with_user_id, permission, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB.getFileShares: ${error.message}`);
    return data || [];
  },

  async getSharedFilesWithMe() {
    const { data, error } = await supabaseClient
      .from('file_shares')
      .select('id, file_id, owner_user_id, permission, created_at, files(filename, storage_path, size, file_type, created_at)')
      .eq('shared_with_user_id', this._uid())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB.getSharedFilesWithMe: ${error.message}`);
    return data || [];
  },

  async updateFileSharePermission(shareId, permission) {
    const { error } = await supabaseClient
      .from('file_shares')
      .update({ permission })
      .eq('id', shareId);

    if (error) throw new Error(`DB.updateFileSharePermission: ${error.message}`);
  },

  async revokeFileShare(shareId) {
    const { error } = await supabaseClient
      .from('file_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw new Error(`DB.revokeFileShare: ${error.message}`);
  },
};
