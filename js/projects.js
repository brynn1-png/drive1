/**
 * js/projects.js
 * ---------------
 * Projects sidebar list, create/rename/delete modals.
 * Filters tasks by project when selected.
 */

const Projects = {
  _projects: [],
  _activeProjectId: null, // null = 'All Tasks'

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    this._projects = await DB.getProjects();
    this.renderSidebar();
    this._updateCount();
  },

  /* ------------------------------------------------------------------ */
  /*  Sidebar rendering                                                   */
  /* ------------------------------------------------------------------ */

  renderSidebar() {
    const list = document.getElementById('project-list');
    if (!list) return;
    list.innerHTML = '';

    // "All Tasks" item
    list.appendChild(this._buildProjectItem({
      id: null,
      label: 'All Tasks',
      icon: '📋',
      active: this._activeProjectId === null,
    }));

    // "Uncategorized" item
    list.appendChild(this._buildProjectItem({
      id: 'uncategorized',
      label: 'Uncategorized',
      icon: '📁',
      active: this._activeProjectId === 'uncategorized',
    }));

    // User projects
    for (const project of this._projects) {
      list.appendChild(this._buildProjectItem({
        id: project.id,
        label: project.name,
        icon: '🏷️',
        active: this._activeProjectId === project.id,
      }));
    }

    // "New Project" button
    const newBtn = document.createElement('button');
    newBtn.className = 'new-folder-btn';
    newBtn.id = 'new-project-btn';
    newBtn.innerHTML = '<span aria-hidden="true">+</span><span>New Project</span>';
    newBtn.addEventListener('click', () => this.showCreateModal());
    list.appendChild(newBtn);
  },

  _buildProjectItem({ id, label, icon, active }) {
    const item = document.createElement('div');
    item.className = `folder-item project-item ${active ? 'active' : ''}`;
    item.dataset.projectId = id || '';

    item.innerHTML = `
      <span class="folder-item-icon">${icon}</span>
      <span class="folder-item-label">${this._esc(label)}</span>
      ${id && id !== 'uncategorized'
        ? `<button class="project-rename-btn" data-id="${id}" title="Rename">✎</button>
           <button class="project-delete-btn" data-id="${id}" title="Delete project">✕</button>`
        : ''}
    `;

    // Select project on click (but not on rename/delete buttons)
    item.addEventListener('click', (e) => {
      if (e.target.closest('.project-rename-btn') || e.target.closest('.project-delete-btn')) return;
      this.selectProject(id);
    });

    // Rename button
    const renameBtn = item.querySelector('.project-rename-btn');
    if (renameBtn) {
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const project = this._projects.find(p => p.id === id);
        if (project) this.showRenameModal(id, project.name);
      });
    }

    // Delete button
    const deleteBtn = item.querySelector('.project-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteProject(id);
      });
    }

    return item;
  },

  /* ------------------------------------------------------------------ */
  /*  Project selection                                                   */
  /* ------------------------------------------------------------------ */

  selectProject(id) {
    this._activeProjectId = id;
    this.renderSidebar();
    App.closeSidebar();

    // Sync the dropdown in tasks view
    const dropdown = document.getElementById('task-project-filter');
    if (dropdown) dropdown.value = id || '';

    // Trigger tasks reload with project filter
    Tasks.load();
  },

  /* ------------------------------------------------------------------ */
  /*  Badge count                                                         */
  /* ------------------------------------------------------------------ */

  _updateCount() {
    const badge = document.getElementById('projects-count');
    if (badge) badge.textContent = this._projects.length || '';
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
      modal.classList.add('hidden');
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
      modal.classList.add('hidden');
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
    if (!confirm(`Delete project "${project.name}"? Tasks in this project will become uncategorized.`)) return;

    try {
      await DB.deleteProject(id);
      if (this._activeProjectId === id) this._activeProjectId = null;
      Toast.show(`Project "${project.name}" deleted.`, 'success');
      await this.load();
      await Tasks.load();
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to delete project: ${err.message}`, 'error');
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
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to create project: ${err.message}`, 'error');
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
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to rename project: ${err.message}`, 'error');
    }
  },

  _esc(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};
