const Auth = {
  _user: null,
  _session: null,
  _resolveInit: null,
  _mode: 'signin',

  async init() {
    return new Promise(async (resolve) => {
      this._resolveInit = resolve;
      this._wireEvents();

      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) console.error('Auth.init:', error.message);

      if (session) {
        this._session = session;
        this._user = session.user;
        this._updateSidebarUser();
        this.hideLoginScreen();
        resolve();
      } else {
        this.showLoginScreen();
      }

      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this._session = session;
          this._user = session.user;
          this._updateSidebarUser();
          this.hideLoginScreen();
          if (this._resolveInit) {
            this._resolveInit();
            this._resolveInit = null;
          }
        }
        if (event === 'SIGNED_OUT') {
          this._user = null;
          this._session = null;
          window.location.reload();
        }
        if (event === 'PASSWORD_RECOVERY' && session) {
          this._session = session;
          this._user = session.user;
          this._showResetConfirmScreen();
        }
      });
    });
  },

  getUser() {
    return this._user;
  },

  getUserId() {
    return this._user?.id || null;
  },

  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  async sendResetEmail(email) {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  showLoginScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
  },

  hideLoginScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
  },

  _updateSidebarUser() {
    const emailEl = document.getElementById('user-email');
    if (emailEl && this._user) {
      emailEl.textContent = this._user.email;
    }
  },

  _wireEvents() {
    const submitBtn = document.getElementById('auth-submit');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const passwordInput = document.getElementById('auth-password');
    const logoutBtn = document.getElementById('logout-btn');
    const forgotLink = document.getElementById('auth-forgot-link');
    const resetBackLink = document.getElementById('auth-reset-back-link');
    const resetSubmitBtn = document.getElementById('auth-reset-submit');
    const resetEmailInput = document.getElementById('auth-reset-email');
    const resetConfirmSubmitBtn = document.getElementById('auth-reset-confirm-submit');
    const newPasswordInput = document.getElementById('auth-new-password');
    const newPasswordConfirmInput = document.getElementById('auth-new-password-confirm');
    const settingsChangePasswordBtn = document.getElementById('settings-change-password-submit');
    const settingsNewPasswordInput = document.getElementById('settings-new-password');
    const settingsNewPasswordConfirmInput = document.getElementById('settings-new-password-confirm');

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._handleSubmit());
    }

    if (passwordInput) {
      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._handleSubmit();
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this._toggleMode());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this._showSignOutModal());
    }

    const settingsLogoutBtn = document.getElementById('settings-logout-btn');
    if (settingsLogoutBtn) {
      settingsLogoutBtn.addEventListener('click', () => this._showSignOutModal());
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', () => this.showResetRequest());
    }

    if (resetBackLink) {
      resetBackLink.addEventListener('click', () => this.showSignInFromReset());
    }

    if (resetSubmitBtn) {
      resetSubmitBtn.addEventListener('click', () => this._handleResetRequestSubmit());
    }

    if (resetEmailInput) {
      resetEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._handleResetRequestSubmit();
      });
    }

    if (resetConfirmSubmitBtn) {
      resetConfirmSubmitBtn.addEventListener('click', () => this._handleResetConfirmSubmit());
    }

    [newPasswordInput, newPasswordConfirmInput].forEach((input) => {
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this._handleResetConfirmSubmit();
        });
      }
    });

    if (settingsChangePasswordBtn) {
      settingsChangePasswordBtn.addEventListener('click', () => this._handleChangePasswordSubmit());
    }

    [settingsNewPasswordInput, settingsNewPasswordConfirmInput].forEach((input) => {
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this._handleChangePasswordSubmit();
        });
      }
    });

    this._wirePasswordToggle('auth-password-toggle', 'auth-password');
    this._wirePasswordToggle('auth-new-password-toggle', 'auth-new-password');
    this._wirePasswordToggle('auth-new-password-confirm-toggle', 'auth-new-password-confirm');
    this._wirePasswordToggle('settings-new-password-toggle', 'settings-new-password');
    this._wirePasswordToggle('settings-new-password-confirm-toggle', 'settings-new-password-confirm');

    // Sign-up success modal
    const signupOk = document.getElementById('signup-success-ok');
    if (signupOk) signupOk.addEventListener('click', () => {
      this._hideModal('signup-success-modal');
      this._mode = 'signin';
      this._toggleMode();
    });
  },

  _wirePasswordToggle(toggleBtnId, inputId) {
    const btn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.classList.toggle('is-visible', !showing);
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  },

  _toggleMode() {
    this._mode = this._mode === 'signin' ? 'signup' : 'signin';
    const submitBtn = document.getElementById('auth-submit');
    const toggleText = document.getElementById('auth-toggle-label');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const errorEl = document.getElementById('auth-error');
    const forgotLink = document.getElementById('auth-forgot-link');
    const passwordHint = document.getElementById('auth-password-hint');

    if (errorEl) errorEl.classList.add('hidden');

    if (this._mode === 'signin') {
      if (submitBtn) submitBtn.textContent = 'Sign In';
      if (toggleText) toggleText.textContent = "Don't have an account?";
      if (toggleBtn) toggleBtn.textContent = 'Sign Up';
      if (title) title.textContent = 'Welcome back';
      if (desc) desc.textContent = 'Sign in to access your personal drive';
      if (forgotLink) forgotLink.classList.remove('hidden');
      if (passwordHint) passwordHint.classList.add('hidden');
    } else {
      if (submitBtn) submitBtn.textContent = 'Create Account';
      if (toggleText) toggleText.textContent = 'Already have an account?';
      if (toggleBtn) toggleBtn.textContent = 'Sign In';
      if (title) title.textContent = 'Create your account';
      if (desc) desc.textContent = 'Sign up to get your own personal drive';
      if (forgotLink) forgotLink.classList.add('hidden');
      if (passwordHint) passwordHint.classList.remove('hidden');
    }
  },

  async _handleSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit');

    errorEl.classList.add('hidden');

    if (!email || !password) {
      this._showError('Please enter email and password.');
      return;
    }

    if (password.length < 6) {
      this._showError('Password must be at least 6 characters.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = this._mode === 'signin' ? 'Signing in...' : 'Creating account...';

    try {
      if (this._mode === 'signin') {
        await this.signIn(email, password);
      } else {
        const result = await this.signUp(email, password);
        if (!result.session) {
          this._showModal('signup-success-modal');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
          return;
        }
      }
    } catch (err) {
      this._showError(friendlyError(err));
      submitBtn.disabled = false;
      submitBtn.textContent = this._mode === 'signin' ? 'Sign In' : 'Create Account';
    }
  },

  _showError(msg, type = 'error', elId = 'auth-error') {
    const errorEl = document.getElementById(elId);
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.className = `auth-error ${type}`;
    errorEl.classList.remove('hidden');
  },

  showResetRequest() {
    document.querySelector('.auth-card:not(.hidden)')?.classList.add('hidden');
    document.getElementById('auth-reset-request-card').classList.remove('hidden');
    document.getElementById('auth-reset-error').classList.add('hidden');
    document.getElementById('auth-reset-email').value = '';
  },

  showSignInFromReset() {
    document.getElementById('auth-reset-request-card').classList.add('hidden');
    document.querySelector('#auth-screen .auth-card').classList.remove('hidden');
  },

  _showResetConfirmScreen() {
    document.querySelectorAll('#auth-screen .auth-card').forEach((card) => {
      if (card.id !== 'auth-reset-confirm-card') card.classList.add('hidden');
    });
    document.getElementById('auth-reset-confirm-card').classList.remove('hidden');
    this.showLoginScreen();
  },

  async _handleResetRequestSubmit() {
    const email = document.getElementById('auth-reset-email').value.trim();
    const submitBtn = document.getElementById('auth-reset-submit');

    document.getElementById('auth-reset-error').classList.add('hidden');

    if (!email) {
      this._showError('Please enter your email.', 'error', 'auth-reset-error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      await this.sendResetEmail(email);
      this._showError('Check your email for a reset link.', 'success', 'auth-reset-error');
    } catch (err) {
      this._showError(friendlyError(err), 'error', 'auth-reset-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  },

  async _handleResetConfirmSubmit() {
    const password = document.getElementById('auth-new-password').value;
    const confirmPassword = document.getElementById('auth-new-password-confirm').value;
    const submitBtn = document.getElementById('auth-reset-confirm-submit');

    document.getElementById('auth-reset-confirm-error').classList.add('hidden');

    if (!password || !confirmPassword) {
      this._showError('Please fill in both fields.', 'error', 'auth-reset-confirm-error');
      return;
    }

    if (password.length < 6) {
      this._showError('Password must be at least 6 characters.', 'error', 'auth-reset-confirm-error');
      return;
    }

    if (password !== confirmPassword) {
      this._showError('Passwords do not match.', 'error', 'auth-reset-confirm-error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
      await this.updatePassword(password);
      this._showError('Password updated. Redirecting...', 'success', 'auth-reset-confirm-error');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      this._showError(friendlyError(err), 'error', 'auth-reset-confirm-error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Password';
    }
  },

  async _handleChangePasswordSubmit() {
    const password = document.getElementById('settings-new-password').value;
    const confirmPassword = document.getElementById('settings-new-password-confirm').value;
    const submitBtn = document.getElementById('settings-change-password-submit');

    document.getElementById('settings-password-error').classList.add('hidden');

    if (!password || !confirmPassword) {
      this._showError('Please fill in both fields.', 'error', 'settings-password-error');
      return;
    }

    if (password.length < 6) {
      this._showError('Password must be at least 6 characters.', 'error', 'settings-password-error');
      return;
    }

    if (password !== confirmPassword) {
      this._showError('Passwords do not match.', 'error', 'settings-password-error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
      await this.updatePassword(password);
      this._showError('Password updated.', 'success', 'settings-password-error');
      document.getElementById('settings-new-password').value = '';
      document.getElementById('settings-new-password-confirm').value = '';
    } catch (err) {
      this._showError(friendlyError(err), 'error', 'settings-password-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Password';
    }
  },

  _showModal(id) {
    Confirm.showModal(id);
  },

  _hideModal(id) {
    Confirm.hideModal(id);
  },

  _showSignOutModal() {
    Confirm.show({
      title: 'Sign Out?',
      description: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      type: 'danger',
      icon: Confirm._icons.exit,
    }).then((confirmed) => {
      if (confirmed) this.signOut();
    });
  },
};
