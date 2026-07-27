/**
 * js/admin.js
 * -----------
 * Admin-only "registered users" list on the Settings page.
 * Visibility and data access are enforced server-side by RLS
 * (see supabase/migrations/006_add_admin.sql) — this module just
 * renders whatever the DB is willing to return.
 */

const Admin = {
  _checked: false,
  _isAdmin: false,

  async load() {
    const section = document.getElementById('admin-settings-section');
    if (!section) return;

    if (!this._checked) {
      try {
        this._isAdmin = await DB.isAdmin();
      } catch (err) {
        console.error('Admin.load: failed to check admin status', err);
        this._isAdmin = false;
      }
      this._checked = true;
    }

    section.classList.toggle('hidden', !this._isAdmin);
    if (!this._isAdmin) return;

    const list = document.getElementById('admin-users-list');
    if (!list) return;

    list.innerHTML = '<div class="loading-state" style="padding:10px 0;font-size:12px;"><div class="spinner" aria-hidden="true" style="width:14px;height:14px;border-width:2px"></div><div>Loading users...</div></div>';

    try {
      const profiles = await DB.getAllProfiles();
      list.innerHTML = '';

      if (profiles.length === 0) {
        list.innerHTML = '<div class="settings-row-desc">No registered users found.</div>';
        return;
      }

      for (const profile of profiles) {
        const row = document.createElement('div');
        row.className = 'admin-user-row';
        row.innerHTML = `
          <span class="admin-user-email">${this._esc(profile.email)}</span>
          <span class="admin-user-date">${this._formatDate(profile.created_at)}</span>`;
        list.appendChild(row);
      }
    } catch (err) {
      console.error('Admin.load: failed to load profiles', err);
      list.innerHTML = '<div class="settings-row-desc">Failed to load registered users.</div>';
    }
  },

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  _formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },
};
