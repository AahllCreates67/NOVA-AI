/**
 * NOVA AI — Client-Side Hash/Path SPA Router
 */
window.NovaRouter = {
  routes: {
    '/': 'view-home',
    '/chat': 'view-chat',
    '/discover': 'view-discover',
    '/image-studio': 'view-image-studio',
    '/study-room': 'view-study-room',
    '/workspace': 'view-workspace',
    '/profile': 'view-profile',
    '/settings': 'view-settings'
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  navigate(path) {
    window.location.hash = `#${path}`;
  },

  resolve() {
    const rawHash = window.location.hash.replace(/^#/, '') || '/';
    const [path, queryString] = rawHash.split('?');
    const viewId = this.routes[path] || 'view-home';

    document.querySelectorAll('.app-view').forEach((v) => v.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    document.querySelectorAll('.nav-link').forEach((link) => {
      const linkRoute = link.getAttribute('data-route');
      link.classList.toggle('active', linkRoute === path);
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    const params = new URLSearchParams(queryString || '');
    if (path === '/chat' && window.NovaChat) {
      window.NovaChat.onActivate(params);
    } else if (path === '/discover' && window.NovaTools) {
      window.NovaTools.onActivate(params);
    } else if (path === '/workspace' && window.NovaWorkspace) {
      window.NovaWorkspace.render();
    } else if (path === '/profile' && window.NovaAuth) {
      window.NovaAuth.renderProfile();
    }
  }
};
