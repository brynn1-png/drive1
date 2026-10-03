const Confirm = {
  _pendingPromise: null,
  _previousFocus: null,
  _hideTimers: new Map(),
  _confirmHideTimer: null,

  _icons: {
    danger: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    warning: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    success: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    info: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    exit: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  },

  hideModal(id) {
    const modal = document.getElementById(id);
    if (!modal || modal.classList.contains('hidden')) return;
    clearTimeout(this._hideTimers.get(id));
    modal.classList.add('modal-closing');
    const timer = setTimeout(() => {
      modal.classList.remove('modal-closing');
      modal.classList.add('hidden');
      this._hideTimers.delete(id);
    }, 150);
    this._hideTimers.set(id, timer);
  },

  showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    clearTimeout(this._hideTimers.get(id));
    this._hideTimers.delete(id);
    modal.classList.remove('hidden', 'modal-closing');
  },

  show({ title, description, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', icon = null }) {
    if (this._pendingPromise) return Promise.resolve(false);
    this._pendingPromise = new Promise((resolve) => {
      this._previousFocus = document.activeElement;

      const modal = document.getElementById('confirm-modal');
      const iconEl = document.getElementById('confirm-icon');
      const titleEl = document.getElementById('confirm-title');
      const descEl = document.getElementById('confirm-desc');
      const okBtn = document.getElementById('confirm-ok');
      const cancelBtn = document.getElementById('confirm-cancel');

      iconEl.className = `confirm-icon confirm-${type}`;
      iconEl.innerHTML = icon || this._icons[type];
      titleEl.textContent = title;
      descEl.textContent = description;
      okBtn.textContent = confirmText;
      cancelBtn.textContent = cancelText;

      okBtn.className = type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';

      const cleanup = () => {
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
        modal.removeEventListener('keydown', onKeydown);
        modal.classList.add('modal-closing');
        this._confirmHideTimer = setTimeout(() => {
          modal.classList.remove('modal-closing');
          modal.classList.add('hidden');
          this._confirmHideTimer = null;
        }, 150);
        this._pendingPromise = null;
        if (this._previousFocus?.isConnected) this._previousFocus.focus();
        this._previousFocus = null;
      };

      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const onBackdrop = (e) => { if (e.target === modal) { cleanup(); resolve(false); } };
      const onKeydown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup();
          resolve(false);
        } else if (e.key === 'Tab') {
          const buttons = [cancelBtn, okBtn];
          const index = buttons.indexOf(document.activeElement);
          if (e.shiftKey && index <= 0) {
            e.preventDefault();
            okBtn.focus();
          } else if (!e.shiftKey && index >= buttons.length - 1) {
            e.preventDefault();
            cancelBtn.focus();
          }
        }
      };

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);
      modal.addEventListener('keydown', onKeydown);

      clearTimeout(this._confirmHideTimer);
      this._confirmHideTimer = null;
      modal.classList.remove('hidden', 'modal-closing');
      cancelBtn.focus();
    });
    return this._pendingPromise;
  },
};
