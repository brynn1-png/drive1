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
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
      active: this._activeProjectId === null,
    }));

    // "Uncategorized" item
    list.appendChild(this._buildProjectItem({
      id: 'uncategorized',
      label: 'Uncategorized',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      active: this._activeProjectId === 'uncategorized',
    }));

    // User projects
    for (const project of this._projects) {
      list.appendChild(this._buildProjectItem({
        id: project.id,
        label: project.name,
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
        active: this._activeProjectId === project.id,
      }));
    }

    // "New Project" button
    const newBtn = document.createElement('button');
    newBtn.className = 'new-folder-btn';
    newBtn.id = 'new-project-btn';
    newBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>New Project</span>';
    newBtn.addEventListener('click', () => this.showCreateModal());
    list.appendChild(newBtn);
  },

  _buildProjectItem({ id, label, icon, active }) {
    const item = document.createElement('div');
    item.className = `folder-item project-item ${active ? 'active' : ''}`;
    item.dataset.projectId = id || '';

    const actionBtns = id && id !== 'uncategorized'
      ? `<button class="project-rename-btn" data-id="${id}" title="Rename"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
         <button class="project-delete-btn" data-id="${id}" title="Delete project"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
      : '';

    item.innerHTML = `
      <span class="folder-item-icon">${icon}</span>
      <span class="folder-item-label">${this._esc(label)}</span>
      ${actionBtns}
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
