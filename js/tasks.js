/**
 * js/tasks.js
 * -----------
 * Task manager — add, toggle, delete, filter tasks.
 */

const Tasks = {
  _tasks: [],
  _filter: 'all', // 'all' | 'active' | 'completed'

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async load() {
    this._tasks = await DB.getTasks();
    this.render();
    this._updateCount();
  },

  render() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    const filtered = this._getFiltered();
    const completed = this._tasks.filter((t) => t.completed).length;
    const total = this._tasks.length;

    container.innerHTML = '';

    // Input bar
    const inputBar = document.createElement('div');
    inputBar.className = 'task-input-bar';
    inputBar.innerHTML = `
      <input type="text" id="task-input" placeholder="Add a new task..." maxlength="200" autocomplete="off" />
      <button class="btn btn-primary task-add-btn" id="task-add-btn">Add</button>`;
    container.appendChild(inputBar);

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
          this.render();
        });
        if (btn.dataset.filter === this._filter) btn.classList.add('active');
      });
    }

    // Task list
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-empty';
      empty.textContent = total === 0 ? 'No tasks yet — add one above' : 'No tasks match this filter';
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
        del.innerHTML = '&times;';
        del.setAttribute('aria-label', 'Delete task');

        row.appendChild(checkbox);
        row.appendChild(label);
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

    // Wire input events
    const input = document.getElementById('task-input');
    const addBtn = document.getElementById('task-add-btn');

    if (addBtn) addBtn.addEventListener('click', () => this._addFromInput());
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._addFromInput();
      });
      input.focus();
    }
  },

  async toggleTask(id) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const updated = await DB.updateTask(id, { completed: !task.completed });
      const idx = this._tasks.findIndex((t) => t.id === id);
      if (idx !== -1) this._tasks[idx] = updated;
      this.render();
      this._updateCount();
    } catch (err) {
      console.error(err);
      Toast.show('Failed to update task.', 'error');
    }
  },

  async deleteTask(id) {
    try {
      await DB.deleteTask(id);
      this._tasks = this._tasks.filter((t) => t.id !== id);
      this.render();
      this._updateCount();
      Toast.show('Task deleted.', 'success');
    } catch (err) {
      console.error(err);
      Toast.show('Failed to delete task.', 'error');
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  async _addFromInput() {
    const input = document.getElementById('task-input');
    if (!input) return;
    const title = input.value.trim();
    if (!title) return;

    try {
      const task = await DB.insertTask(title);
      this._tasks.unshift(task);
      input.value = '';
      this.render();
      this._updateCount();
    } catch (err) {
      console.error(err);
      Toast.show('Failed to add task.', 'error');
    }
  },

  _getFiltered() {
    if (this._filter === 'active') return this._tasks.filter((t) => !t.completed);
    if (this._filter === 'completed') return this._tasks.filter((t) => t.completed);
    return [...this._tasks];
  },

  _updateCount() {
    const badge = document.getElementById('tasks-count');
    if (badge) {
      const active = this._tasks.filter((t) => !t.completed).length;
      badge.textContent = active || '';
    }
  },
};
