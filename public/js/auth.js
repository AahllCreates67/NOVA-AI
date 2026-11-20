/**
 * NOVA AI — Authentication & User Session Manager (Supabase + Local Mode)
 */
window.NovaAuth = {
  supabase: null,
  user: null,
  session: null,
  isConfigured: false,

  async init(serverHealth) {
    this.isConfigured = Boolean(serverHealth?.capabilities?.authConfigured && serverHealth?.publicConfig);

    if (this.isConfigured && window.supabase) {
      const { supabaseUrl, supabaseAnonKey } = serverHealth.publicConfig;
      this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

      const { data } = await this.supabase.auth.getSession();
      this.session = data?.session || null;
      this.user = this.session?.user || null;

      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session;
        this.user = session?.user || null;
        this.updateNavUI();
        window.NovaChat?.loadConversations();
        window.NovaWorkspace?.render();
      });
    }

    this.updateNavUI();
    document.getElementById('navSignInBtn')?.addEventListener('click', () => this.openAuthModal('signin'));
    document.getElementById('mobileSignInBtn')?.addEventListener('click', () => this.openAuthModal('signin'));
  },

  getAuthHeaders() {
    if (this.session?.access_token) {
      return { Authorization: `Bearer ${this.session.access_token}` };
    }
    return {};
  },

  updateNavUI() {
    const desktopArea = document.getElementById('navAuthArea');
    const mobileArea = document.getElementById('mobileAuthArea');

    if (this.user) {
      const name = this.user.user_metadata?.display_name || this.user.email.split('@')[0];
      const safeName = window.NovaUI.escapeHtml(name);
      desktopArea.innerHTML = `
        <button type="button" class="btn btn-ghost btn-sm" data-route="/workspace">Workspace</button>
        <button type="button" class="btn btn-secondary btn-sm" data-route="/profile">${safeName}</button>
      `;
      mobileArea.innerHTML = `
        <button type="button" class="btn btn-secondary" style="flex:1" data-route="/profile">${safeName}</button>
        <button type="button" class="btn btn-danger" style="flex:1" id="mobileSignOutBtn">Sign Out</button>
      `;
      document.getElementById('mobileSignOutBtn')?.addEventListener('click', () => this.signOut());
    }
  },

  openAuthModal(mode = 'signin') {
    if (!this.isConfigured) {
      window.NovaUI.openModal(
        'Cloud Authentication Setup',
        `<div class="notice-banner notice-warning">
          <span>Supabase authentication is not configured on this server yet.</span>
        </div>
        <p style="color:var(--text-secondary); margin-bottom:14px;">
          NOVA AI is currently running in <strong>Local Development Mode</strong>. Your chats, study tasks, and workspace notes are saved in your browser's local storage.
        </p>
        <p style="color:var(--text-secondary); font-size:0.9rem;">
          To enable cloud accounts, add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to your server <code>.env</code> file and run <code>config/database.sql</code>.
        </p>`
      );
      return;
    }

    const isSignUp = mode === 'signup';
    const isReset = mode === 'reset';

    window.NovaUI.openModal(
      isReset ? 'Reset Password' : isSignUp ? 'Create NOVA Account' : 'Sign In to NOVA AI',
      `<form id="authModalForm">
        ${isSignUp ? `
          <div class="form-group">
            <label class="form-label" for="authDisplayName">Display Name</label>
            <input type="text" id="authDisplayName" class="input-field" required placeholder="Aahil Shams" />
          </div>` : ''}
        <div class="form-group">
          <label class="form-label" for="authEmail">Email Address</label>
          <input type="email" id="authEmail" class="input-field" required placeholder="you@example.com" />
        </div>
        ${!isReset ? `
          <div class="form-group">
            <label class="form-label" for="authPassword">Password</label>
            <div style="display:flex; gap:8px;">
              <input type="password" id="authPassword" class="input-field" required minlength="6" placeholder="Minimum 6 characters" />
              <button type="button" class="btn btn-secondary btn-sm" id="togglePwdVisBtn">Show</button>
            </div>
          </div>` : ''}
        <div id="authFormError" style="color:var(--status-error); font-size:0.86rem; margin-bottom:12px;"></div>
        <button type="submit" class="btn btn-primary" style="width:100%;" id="authSubmitBtn">
          ${isReset ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <div style="margin-top:16px; display:flex; justify-content:space-between; font-size:0.86rem; color:var(--text-secondary);">
        ${!isSignUp ? `<button type="button" id="switchToSignUp">Need an account? Sign Up</button>` : `<button type="button" id="switchToSignIn">Already have an account? Sign In</button>`}
        ${!isReset ? `<button type="button" id="switchToReset">Forgot password?</button>` : ''}
      </div>`
    );

    document.getElementById('togglePwdVisBtn')?.addEventListener('click', (e) => {
      const inp = document.getElementById('authPassword');
      const isPwd = inp.type === 'password';
      inp.type = isPwd ? 'text' : 'password';
      e.target.textContent = isPwd ? 'Hide' : 'Show';
    });

    document.getElementById('switchToSignUp')?.addEventListener('click', () => this.openAuthModal('signup'));
    document.getElementById('switchToSignIn')?.addEventListener('click', () => this.openAuthModal('signin'));
    document.getElementById('switchToReset')?.addEventListener('click', () => this.openAuthModal('reset'));

    document.getElementById('authModalForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword')?.value;
      const displayName = document.getElementById('authDisplayName')?.value.trim();
      const errEl = document.getElementById('authFormError');
      const submitBtn = document.getElementById('authSubmitBtn');

      errEl.textContent = '';
      submitBtn.disabled = true;

      try {
        if (isReset) {
          const { error } = await this.supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          window.NovaUI.closeModal();
          window.NovaUI.toast('Password reset link sent to your email.', 'success');
        } else if (isSignUp) {
          const { error } = await this.supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } }
          });
          if (error) throw error;
          window.NovaUI.closeModal();
          window.NovaUI.toast('Account created! Check your email if verification is required.', 'success');
        } else {
          const { error } = await this.supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          window.NovaUI.closeModal();
          window.NovaUI.toast('Signed in to NOVA AI.', 'success');
        }
      } catch (err) {
        errEl.textContent = err.message || 'Authentication failed.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  },

  async signOut() {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.user = null;
    this.session = null;
    window.NovaUI.toast('Signed out.', 'info');
    window.NovaRouter.navigate('/');
    window.location.reload();
  },

  renderProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;

    if (!this.user) {
      container.innerHTML = `
        <div class="glass-card studio-panel">
          <h3>Guest Session (Local Mode)</h3>
          <p style="color:var(--text-secondary);">
            ${this.isConfigured
              ? 'Sign in to sync your conversations, saved items, and study planner across devices.'
              : 'Supabase cloud authentication is not configured on this server. Your data is currently stored locally in your browser.'}
          </p>
          <div style="display:flex; gap:12px;">
            <button type="button" class="btn btn-primary" id="profileSignInTrigger">
              ${this.isConfigured ? 'Sign In / Create Account' : 'View Setup Instructions'}
            </button>
            <button type="button" class="btn btn-secondary" data-route="/settings">Open Settings</button>
          </div>
        </div>`;
      document.getElementById('profileSignInTrigger')?.addEventListener('click', () => this.openAuthModal('signin'));
      return;
    }

    const name = this.user.user_metadata?.display_name || this.user.email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="glass-card studio-panel">
        <div style="display:flex; align-items:center; gap:18px;">
          <div class="message-avatar ai" style="width:60px; height:60px; font-size:1.3rem;">${window.NovaUI.escapeHtml(initials)}</div>
          <div>
            <h2>${window.NovaUI.escapeHtml(name)}</h2>
            <p style="color:var(--text-secondary);">${window.NovaUI.escapeHtml(this.user.email)}</p>
          </div>
        </div>
        <div style="border-top:1px solid var(--border-subtle); padding-top:16px; display:flex; gap:12px;">
          <button type="button" class="btn btn-secondary" data-route="/workspace">My Workspace</button>
          <button type="button" class="btn btn-secondary" data-route="/settings">Settings</button>
          <button type="button" class="btn btn-danger" id="profileSignOutBtn">Sign Out</button>
        </div>
      </div>`;
    document.getElementById('profileSignOutBtn')?.addEventListener('click', () => this.signOut());
  }
};
