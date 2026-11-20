/**
 * NOVA AI — Application Settings & Theme Persistence
 */
window.NovaSettings = {
  KEY: 'nova_settings_v1',

  get() {
    try {
      return Object.assign(
        { theme: 'dark', reducedMotion: false, enterToSend: true },
        JSON.parse(localStorage.getItem(this.KEY) || '{}')
      );
    } catch {
      return { theme: 'dark', reducedMotion: false, enterToSend: true };
    }
  },

  save(prefs) {
    localStorage.setItem(this.KEY, JSON.stringify(prefs));
    this.apply(prefs);
  },

  apply(prefs) {
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.body.classList.toggle('reduced-motion', Boolean(prefs.reducedMotion));
  },

  init() {
    const prefs = this.get();
    this.apply(prefs);

    const themeSel = document.getElementById('settingThemeSelect');
    const motionCb = document.getElementById('settingReducedMotion');
    const enterCb = document.getElementById('settingEnterToSend');

    if (themeSel) themeSel.value = prefs.theme;
    if (motionCb) motionCb.checked = prefs.reducedMotion;
    if (enterCb) enterCb.checked = prefs.enterToSend;

    themeSel?.addEventListener('change', () => {
      const p = this.get();
      p.theme = themeSel.value;
      this.save(p);
      window.NovaUI.toast(`Theme switched to ${p.theme}.`, 'success');
    });

    motionCb?.addEventListener('change', () => {
      const p = this.get();
      p.reducedMotion = motionCb.checked;
      this.save(p);
    });

    enterCb?.addEventListener('change', () => {
      const p = this.get();
      p.enterToSend = enterCb.checked;
      this.save(p);
    });

    document.getElementById('settingClearHistoryBtn')?.addEventListener('click', () => {
      localStorage.removeItem(window.NovaChat.STORAGE_KEY);
      window.NovaChat.conversations = [];
      window.NovaChat.createNewChat();
      window.NovaUI.toast('Local chat history cleared.', 'info');
    });
  }
};
