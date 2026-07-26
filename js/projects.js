/**
 * js/projects.js
 * ---------------
 * Projects — create/rename/delete. Browsing and grouping tasks by project
 * happens on the Tasks page itself (see tasks.js); this module just owns
 * the project records and their CRUD modals.
 */

const Projects = {
  _projects: [],

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    this._projects = await DB.getProjects();
  },

  /* ------------------------------------------------------------------ */
  /*  Create modal                                                        */
  /* ------------------------------------------------------------------ */

  showCreateModal() {
    const modal = document.getElementById('project-modal');
    const input = document.getElementById('project-name-input');
    const title = document.getElementById('project-modal-title');
    const confirm = document.getElementById('project-modal-confirm');

    title.textContent = 'Create New Project';
    confirm.textContent = 'Create Project';
    input.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);

    const cleanup = () => {
      Confirm.hideModal('project-modal');
      confirm.onclick = null;
      document.getElementById('project-modal-cancel').onclick = null;
      modal.onclick = null;
    };

    confirm.onclick = async () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      cleanup();
      await this._createProject(name);
    };

    document.getElementById('project-modal-cancel').onclick = cleanup;
    modal.onclick = (e) => { if (e.target === modal) cleanup(); };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') confirm.click();
      if (e.key === 'Escape') cleanup();
    };
  },

  /* ------------------------------------------------------------------ */
  /*  Rename modal                                                        */
  /* ------------------------------------------------------------------ */

  showRenameModal(id, currentName) {
    const modal = document.getElementById('project-modal');
    const input = document.getElementById('project-name-input');
    const title = document.getElementById('project-modal-title');
    const confirm = document.getElementById('project-modal-confirm');

    title.textContent = 'Rename Project';
    confirm.textContent = 'Rename';
    input.value = currentName;
    modal.classList.remove('hidden');
    setTimeout(() => { input.focus(); input.select(); }, 50);

    const cleanup = () => {
      Confirm.hideModal('project-modal');
      confirm.onclick = null;
      document.getElementById('project-modal-cancel').onclick = null;
      modal.onclick = null;
    };

    confirm.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) { input.focus(); return; }
      if (newName === currentName) { cleanup(); return; }
      cleanup();
      await this._renameProject(id, newName);
    };

    document.getElementById('project-modal-cancel').onclick = cleanup;
    modal.onclick = (e) => { if (e.target === modal) cleanup(); };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') confirm.click();
      if (e.key === 'Escape') cleanup();
    };
  },

  /* ------------------------------------------------------------------ */
  /*  Delete project                                                      */
  /* ------------------------------------------------------------------ */

  async deleteProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (!project) return;

    const confirmed = await Confirm.show({
      title: 'Delete Project?',
      description: `Delete project "${project.name}"? Tasks in this project will become uncategorized.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await DB.deleteProject(id);
      Toast.show(`Project "${project.name}" deleted.`, 'success');
      await this.load();
      await Tasks.load();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to delete project: ${friendlyError(err)}`, 'error');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                    */
  /* ------------------------------------------------------------------ */

  async _createProject(name) {
    // Sanitize
    const clean = name.trim().replace(/[^\w\s-]/g, '').trim();
    if (!clean) { Toast.show('Invalid project name.', 'error'); return; }

    // Check duplicate
    if (this._projects.some(p => p.name.toLowerCase() === clean.toLowerCase())) {
      Toast.show(`Project "${clean}" already exists.`, 'warning');
      return;
    }

    try {
      await DB.createProject(clean);
      Toast.show(`Project "${clean}" created.`, 'success');
      await this.load();
      if (typeof Tasks !== 'undefined' && Tasks.render) Tasks.render();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to create project: ${friendlyError(err)}`, 'error');
    }
  },

  async _renameProject(id, newName) {
    const clean = newName.trim().replace(/[^\w\s-]/g, '').trim();
    if (!clean) { Toast.show('Invalid project name.', 'error'); return; }

    if (this._projects.some(p => p.id !== id && p.name.toLowerCase() === clean.toLowerCase())) {
      Toast.show(`Project "${clean}" already exists.`, 'warning');
      return;
    }

    try {
      await DB.renameProject(id, clean);
      Toast.show(`Project renamed to "${clean}".`, 'success');
      await this.load();
      if (typeof Tasks !== 'undefined' && Tasks.render) Tasks.render();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to rename project: ${friendlyError(err)}`, 'error');
    }
  },

  _esc(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};
