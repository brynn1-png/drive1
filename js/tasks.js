/**
 * js/tasks.js
 * -----------
 * Task manager — grouped by project.
 * The Tasks page shows a card per project (+ Uncategorized); clicking one
 * opens a modal with just that project's tasks. Project cards also carry
 * rename/delete controls, since project management now lives entirely here.
 */

const PROJECT_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
const UNCATEGORIZED_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';

const Tasks = {
  _allTasks: [],
  _activeGroup: null, // project id, or 'uncategorized', while the group modal is open

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    const container = document.getElementById('tasks-container');
    if (container) {
      container.innerHTML = '<div class="loading-state"><div class="spinner" aria-hidden="true"></div><div>Loading your tasks...</div></div>';
    }
    this._allTasks = await DB.getTasks({ filter: 'all' });
    this.render();
    this._updateCount();
  },

  render() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    container.innerHTML = '';

    if (this._allTasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-empty';
      empty.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.15;margin:0 auto 12px;display:block"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div>No tasks yet</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Track what needs to get done</div>
        <button class="btn btn-primary empty-cta" id="tasks-empty-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </button>
      `;
      container.appendChild(empty);
      document.getElementById('tasks-empty-cta').addEventListener('click', () => this.showCreateModal());
      return;
    }

    const groups = this._computeGroups();

    const grid = document.createElement('div');
    grid.className = 'task-group-grid';

    for (const group of groups) {
      const completed = group.tasks.filter((t) => t.completed).length;
      const isProject = group.key !== 'uncategorized';

      const actionsHtml = isProject
        ? `<div class="task-group-card-actions">
             <button class="task-group-rename-btn" data-id="${group.key}" title="Rename project">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
             </button>
             <button class="task-group-delete-btn" data-id="${group.key}" title="Delete project">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
           </div>`
        : '';

      const card = document.createElement('div');
      card.className = `task-group-card ${isProject ? 'task-group-project' : 'task-group-uncategorized'}${group.tasks.length === 0 ? ' empty' : ''}`;
      card.innerHTML = `
        ${actionsHtml}
        <div class="task-group-icon">${group.icon}</div>
        <div class="task-group-title">${this._esc(group.label)}</div>
        <div class="task-group-count">${group.tasks.length === 0 ? 'No tasks' : `${completed} of ${group.tasks.length} done`}</div>
      `;
      card.addEventListener('click', () => this.openGroup(group.key));

      const renameBtn = card.querySelector('.task-group-rename-btn');
      if (renameBtn) {
        renameBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Projects.showRenameModal(group.key, group.label);
        });
      }

      const deleteBtn = card.querySelector('.task-group-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Projects.deleteProject(group.key);
        });
      }

      grid.appendChild(card);
    }

    container.appendChild(grid);
  },

  openGroup(key) {
    this._activeGroup = key;
    const group = this._computeGroups().find((g) => g.key === key);
    const modal = document.getElementById('task-group-modal');
    const title = document.getElementById('task-group-title');
    const backBtn = document.getElementById('task-group-back-btn');
    const addInput = document.getElementById('task-group-add-input');

    title.textContent = group ? group.label : '';
    addInput.value = '';

    backBtn.onclick = () => this.closeGroup();

    addInput.onkeydown = async (e) => {
      if (e.key !== 'Enter') return;
      const title = addInput.value.trim();
      if (!title) return;
      const projectId = key === 'uncategorized' ? null : key;
      try {
        const task = await DB.insertTask(title, projectId, null);
        this._allTasks.unshift(task);
        addInput.value = '';
        this._renderGroupList();
        this._updateGroupHeader();
        this._updateCount();
        Toast.show('Task added.', 'success');
      } catch (err) {
        console.error(err);
        Toast.show(`Failed to add task: ${friendlyError(err)}`, 'error');
      }
    };

    modal.classList.remove('hidden');
    this._renderGroupList();
    this._updateGroupHeader();
    setTimeout(() => addInput.focus(), 50);
  },

  closeGroup() {
    this._activeGroup = null;
    document.getElementById('task-group-modal').classList.add('hidden');
    this.render();
  },

  async toggleTask(id) {
    const task = this._allTasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const updated = await DB.updateTask(id, { completed: !task.completed });
      const idx = this._allTasks.findIndex((t) => t.id === id);
      if (idx !== -1) this._allTasks[idx] = updated;
      if (this._activeGroup) {
        this._renderGroupList();
        this._updateGroupHeader();
      } else {
        this.render();
      }
      this._updateCount();
    } catch (err) {
      console.error(err);
      Toast.show('Failed to update task.', 'error');
    }
  },

  async deleteTask(id) {
    const confirmed = await Confirm.show({
      title: 'Delete Task?',
      description: 'Delete this task? This cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await DB.deleteTask(id);
      this._allTasks = this._allTasks.filter((t) => t.id !== id);
      if (this._activeGroup) {
        this._renderGroupList();
        this._updateGroupHeader();
      } else {
        this.render();
      }
      this._updateCount();
      Toast.show('Task deleted.', 'success');
    } catch (err) {
      console.error(err);
      Toast.show('Failed to delete task.', 'error');
    }
  },

  showCreateModal() {
    const modal = document.getElementById('task-create-modal');
    const input = document.getElementById('task-create-input');
    const dueDateInput = document.getElementById('task-create-due-date');
    const confirmBtn = document.getElementById('task-create-confirm');
    const cancelBtn = document.getElementById('task-create-cancel');

    input.value = '';
    dueDateInput.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);

    const cleanup = () => {
      Confirm.hideModal('task-create-modal');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      modal.onclick = null;
      input.onkeydown = null;
    };

    confirmBtn.onclick = async () => {
      const title = input.value.trim();
      if (!title) { input.focus(); return; }
      const dueDate = dueDateInput.value || null;
      cleanup();
      await this._createTask(title, dueDate);
    };

    cancelBtn.onclick = cleanup;
    modal.onclick = (e) => { if (e.target === modal) cleanup(); };
    input.onkeydown = (e) => { if (e.key === 'Enter') confirmBtn.click(); };
  },

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  async _createTask(title, dueDate = null) {
    try {
      const task = await DB.insertTask(title, null, dueDate);
      this._allTasks.unshift(task);
      this.render();
      this._updateCount();
      Toast.show('Task added.', 'success');
    } catch (err) {
      console.error(err);
      Toast.show(`Failed to add task: ${friendlyError(err)}`, 'error');
    }
  },

  _computeGroups() {
    const buckets = new Map();
    buckets.set('uncategorized', { key: 'uncategorized', label: 'Uncategorized', icon: UNCATEGORIZED_ICON, tasks: [] });
    for (const project of Projects._projects) {
      buckets.set(project.id, { key: project.id, label: project.name, icon: PROJECT_ICON, tasks: [] });
    }

    for (const task of this._allTasks) {
      const key = task.project_id && buckets.has(task.project_id) ? task.project_id : 'uncategorized';
      buckets.get(key).tasks.push(task);
    }

    const ordered = [buckets.get('uncategorized')];
    for (const project of Projects._projects) ordered.push(buckets.get(project.id));

    for (const group of ordered) group.tasks = this._sortTasks(group.tasks);
    return ordered;
  },

  _sortTasks(tasks) {
    return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  },

  _updateGroupHeader() {
    const countSpan = document.getElementById('task-group-count');
    if (!countSpan || !this._activeGroup) return;
    const group = this._computeGroups().find((g) => g.key === this._activeGroup);
    const tasks = group ? group.tasks : [];
    const completed = tasks.filter((t) => t.completed).length;
    countSpan.textContent = tasks.length === 0 ? '0 tasks' : `${completed} of ${tasks.length} done`;
  },

  _renderGroupList() {
    const listContainer = document.getElementById('task-group-list');
    if (!listContainer || !this._activeGroup) return;

    const group = this._computeGroups().find((g) => g.key === this._activeGroup);
    const tasks = group ? group.tasks : [];
    listContainer.innerHTML = '';

    if (tasks.length === 0) {
      listContainer.innerHTML = '<div class="task-empty">No tasks in this project.</div>';
      return;
    }

    listContainer.appendChild(this._buildTaskListEl(tasks));
    this._attachRowHandlers(listContainer);
  },

  _buildTaskListEl(tasks) {
    const list = document.createElement('div');
    list.className = 'task-list';
    for (const task of tasks) list.appendChild(this._buildTaskRow(task));
    return list;
  },

  _buildTaskRow(task) {
    const row = document.createElement('div');
    row.className = `task-row${task.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('button');
    checkbox.className = 'task-checkbox';
    checkbox.dataset.action = 'toggle-task';
    checkbox.dataset.id = task.id;
    checkbox.setAttribute('aria-label', task.completed ? 'Mark as active' : 'Mark as completed');
    checkbox.innerHTML = task.completed
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';

    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = task.title;

    row.appendChild(checkbox);
    row.appendChild(label);

    if (task.due_date) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const overdue = !task.completed && task.due_date < todayStr;
      const dueBadge = document.createElement('span');
      dueBadge.className = `task-due-badge${overdue ? ' overdue' : ''}`;
      const dueDate = new Date(`${task.due_date}T00:00:00`);
      dueBadge.textContent = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dueBadge.title = overdue ? 'Overdue' : 'Due date';
      row.appendChild(dueBadge);
    }

    if (task.note_id) {
      const note = Notes._notes.find((n) => n.id === task.note_id);
      if (note) {
        const badge = document.createElement('span');
        badge.className = 'task-note-badge';
        badge.title = 'Linked to a note';
        badge.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
        const label2 = document.createElement('span');
        label2.textContent = note.title || 'Untitled';
        badge.appendChild(label2);
        row.appendChild(badge);
      }
    }

    const del = document.createElement('button');
    del.className = 'task-delete-btn';
    del.dataset.action = 'delete-task';
    del.dataset.id = task.id;
    del.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.setAttribute('aria-label', 'Delete task');
    row.appendChild(del);

    return row;
  },

  _attachRowHandlers(root) {
    root.querySelectorAll('[data-action="toggle-task"]').forEach((btn) => {
      btn.addEventListener('click', () => this.toggleTask(btn.dataset.id));
    });
    root.querySelectorAll('[data-action="delete-task"]').forEach((btn) => {
      btn.addEventListener('click', () => this.deleteTask(btn.dataset.id));
    });
  },

  _updateCount() {
    const badge = document.getElementById('tasks-count');
    if (badge) {
      const active = this._allTasks.filter((t) => !t.completed).length;
      badge.textContent = active || '';
    }
  },

  _esc(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};
