const Confirm = {
  _resolve: null,

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
    modal.classList.add('modal-closing');
    setTimeout(() => {
      modal.classList.remove('modal-closing');
      modal.classList.add('hidden');
    }, 150);
  },

  showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  },

  show({ title, description, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', icon = null }) {
    return new Promise((resolve) => {
      this._resolve = resolve;

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
        modal.classList.add('modal-closing');
        setTimeout(() => {
          modal.classList.remove('modal-closing');
          modal.classList.add('hidden');
        }, 150);
      };

      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const onBackdrop = (e) => { if (e.target === modal) { cleanup(); resolve(false); } };

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);

      modal.classList.remove('hidden');
    });
  },
};
