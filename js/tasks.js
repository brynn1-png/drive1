/**
 * js/tasks.js
 * -----------
 * Task manager — add, toggle, delete, filter tasks.
 */

const Tasks = {
  _tasks: [],
  _allTasks: [],
  _filter: 'all', // 'all' | 'active' | 'completed'

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    const projectId = Projects._activeProjectId;
    // Fetch all tasks (no status filter) so filter tabs stay visible
    this._allTasks = await DB.getTasks({ projectId, filter: 'all' });
    this._tasks = this._applyStatusFilter(this._allTasks);
    this.render();
    this._updateCount();
  },

  render() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    const filtered = this._tasks;
    const completed = this._allTasks.filter((t) => t.completed).length;
    const total = this._allTasks.length;

    container.innerHTML = '';

    // Filter tabs + stats
    if (total > 0) {
      const toolbar = document.createElement('div');
      toolbar.className = 'task-toolbar';
      toolbar.innerHTML = `
        <div class="task-filters">
          <button class="task-filter-btn active" data-filter="all">All</button>
          <button class="task-filter-btn" data-filter="active">Active</button>
          <button class="task-filter-btn" data-filter="completed">Completed</button>
        </div>
        <div class="task-stats">${completed} of ${total} done</div>`;
      container.appendChild(toolbar);

      toolbar.querySelectorAll('.task-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this._filter = btn.dataset.filter;
          this._tasks = this._applyStatusFilter(this._allTasks);
          this.render();
        });
        if (btn.dataset.filter === this._filter) btn.classList.add('active');
      });
    }

    // Task list
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-empty';
      if (total === 0) {
        empty.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.15;margin:0 auto 12px;display:block"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div>No tasks yet</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Add a task above to get started</div>
        `;
      } else {
        empty.textContent = 'No tasks match this filter';
      }
      container.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'task-list';

      for (const task of filtered) {
        const row = document.createElement('div');
        row.className = `task-row${task.completed ? ' completed' : ''}`;

        const checkbox = document.createElement('button');
        checkbox.className = 'task-checkbox';
        checkbox.dataset.action = 'toggle-task';
        checkbox.dataset.id = task.id;
        checkbox.setAttribute('aria-label', task.completed ? 'Mark as active' : 'Mark as completed');
        checkbox.innerHTML = task.completed
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';

        const label = document.createElement('span');
        label.className = 'task-label';
        label.textContent = task.title;

        const del = document.createElement('button');
        del.className = 'task-delete-btn';
        del.dataset.action = 'delete-task';
        del.dataset.id = task.id;
        del.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        del.setAttribute('aria-label', 'Delete task');

        row.appendChild(checkbox);
        row.appendChild(label);

        if (task.project_id) {
          const project = Projects._projects.find(p => p.id === task.project_id);
          if (project) {
            const badge = document.createElement('span');
            badge.className = 'task-project-badge';
            badge.textContent = project.name;
            row.appendChild(badge);
          }
        }

        row.appendChild(del);
        list.appendChild(row);
      }

      container.appendChild(list);

      list.querySelectorAll('[data-action="toggle-task"]').forEach((btn) => {
        btn.addEventListener('click', () => this.toggleTask(btn.dataset.id));
      });

      list.querySelectorAll('[data-action="delete-task"]').forEach((btn) => {
        btn.addEventListener('click', () => this.deleteTask(btn.dataset.id));
      });
    }
  },

  async toggleTask(id) {
    const task = this._allTasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const updated = await DB.updateTask(id, { completed: !task.completed });
      const idx = this._allTasks.findIndex((t) => t.id === id);
      if (idx !== -1) this._allTasks[idx] = updated;
      this._tasks = this._applyStatusFilter(this._allTasks);
      this.render();
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
      this._tasks = this._applyStatusFilter(this._allTasks);
      this.render();
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
    const confirmBtn = document.getElementById('task-create-confirm');
    const cancelBtn = document.getElementById('task-create-cancel');

    input.value = '';
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
      cleanup();
      await this._createTask(title);
    };

    cancelBtn.onclick = cleanup;
    modal.onclick = (e) => { if (e.target === modal) cleanup(); };
    input.onkeydown = (e) => { if (e.key === 'Enter') confirmBtn.click(); };
  },

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  async _createTask(title) {
    const projectId = Projects._activeProjectId === 'uncategorized' ? null : Projects._activeProjectId;

    try {
      const task = await DB.insertTask(title, projectId);
      this._allTasks.unshift(task);
      this._tasks = this._applyStatusFilter(this._allTasks);
      this.render();
      this._updateCount();
    } catch (err) {
      console.error(err);
      Toast.show('Failed to add task.', 'error');
    }
  },

  _getFiltered() {
    return this._applyStatusFilter(this._allTasks);
  },

  _applyStatusFilter(tasks) {
    if (this._filter === 'active') return tasks.filter((t) => !t.completed);
    if (this._filter === 'completed') return tasks.filter((t) => t.completed);
    return [...tasks];
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
