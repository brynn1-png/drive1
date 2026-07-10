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

    // Sign-up success modal
    const signupOk = document.getElementById('signup-success-ok');
    if (signupOk) signupOk.addEventListener('click', () => {
      this._hideModal('signup-success-modal');
      this._mode = 'signin';
      this._toggleMode();
    });
  },

  _toggleMode() {
    this._mode = this._mode === 'signin' ? 'signup' : 'signin';
    const submitBtn = document.getElementById('auth-submit');
    const toggleText = document.getElementById('auth-toggle-label');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const title = document.getElementById('auth-title');
    const errorEl = document.getElementById('auth-error');

    if (errorEl) errorEl.classList.add('hidden');

    if (this._mode === 'signin') {
      if (submitBtn) submitBtn.textContent = 'Sign In';
      if (toggleText) toggleText.textContent = "Don't have an account?";
      if (toggleBtn) toggleBtn.textContent = 'Sign Up';
      if (title) title.textContent = 'Welcome back';
    } else {
      if (submitBtn) submitBtn.textContent = 'Create Account';
      if (toggleText) toggleText.textContent = 'Already have an account?';
      if (toggleBtn) toggleBtn.textContent = 'Sign In';
      if (title) title.textContent = 'Create your account';
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
      this._showError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = this._mode === 'signin' ? 'Sign In' : 'Create Account';
    }
  },

  _showError(msg, type = 'error') {
    const errorEl = document.getElementById('auth-error');
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.className = `auth-error ${type}`;
    errorEl.classList.remove('hidden');
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
