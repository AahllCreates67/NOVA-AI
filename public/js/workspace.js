/**
 * NOVA AI — Personal Workspace Vault
 */
window.NovaWorkspace = {
  STORAGE_KEY: 'nova_workspace_items_v1',
  items: [],
  activeFilter: 'all',

  init() {
    document.getElementById('workspaceSearchInput')?.addEventListener('input', () => this.render());

    document.getElementById('workspaceFilterPills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ws-filter]');
      if (!btn) return;
      document.querySelectorAll('#workspaceFilterPills .filter-pill').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      this.activeFilter = btn.getAttribute('data-ws-filter');
      this.render();
    });

    document.getElementById('newNoteBtn')?.addEventListener('click', () => {
      window.NovaUI.openModal(
        'Create Quick Note',
        `<form id="quickNoteForm">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" id="quickNoteTitle" class="input-field" required placeholder="Project brainstorm notes" />
          </div>
          <div class="form-group">
            <label class="form-label">Content</label>
            <textarea id="quickNoteContent" class="textarea-field" rows="5" required placeholder="Write your note..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Save Note</button>
        </form>`
      );

      document.getElementById('quickNoteForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveItem({
          type: 'note',
          title: document.getElementById('quickNoteTitle').value.trim(),
          content: document.getElementById('quickNoteContent').value.trim()
        });
        window.NovaUI.closeModal();
      });
    });

    this.loadItems();
  },

  async loadItems() {
    if (window.NovaAuth?.user) {
      try {
        const res = await fetch('/api/workspace', {
          headers: window.NovaAuth.getAuthHeaders()
        });
        const json = await res.json();
        if (json.success) {
          this.items = json.data;
          this.render();
          return;
        }
      } catch {
        // Fall back to local
      }
    }

    try {
      this.items = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      this.items = [];
    }
    this.render();
  },

  persistLocal() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
  },

  async saveItem({ type, title, content }) {
    const newItem = {
      id: 'ws_' + Date.now(),
      type,
      title,
      content,
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    if (window.NovaAuth?.user) {
      try {
        const res = await fetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...window.NovaAuth.getAuthHeaders() },
          body: JSON.stringify(newItem)
        });
        const json = await res.json();
        if (json.success) {
          this.items.unshift(json.data);
          this.render();
          window.NovaUI.toast('Saved to cloud workspace.', 'success');
          return;
        }
      } catch {
        // Fallback below
      }
    }

    this.items.unshift(newItem);
    this.persistLocal();
    this.render();
    window.NovaUI.toast('Saved to My Workspace.', 'success');
  },

  render() {
    const grid = document.getElementById('workspaceGrid');
    const empty = document.getElementById('workspaceEmptyState');
    const notice = document.getElementById('workspaceStorageNotice');
    if (!grid) return;

    if (notice) {
      notice.innerHTML = window.NovaAuth?.user
        ? ''
        : `<div class="notice-banner notice-info"><span><strong>Local Workspace Mode:</strong> Items are saved in this browser. Sign in to sync across devices.</span></div>`;
    }

    const q = (document.getElementById('workspaceSearchInput')?.value || '').trim().toLowerCase();
    const filtered = this.items.filter((item) => {
      const filterMatch =
        this.activeFilter === 'all' ||
        (this.activeFilter === 'favorites' && item.is_favorite) ||
        item.type === this.activeFilter;
      const textMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);
      return filterMatch && textMatch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = filtered
      .map(
        (item) => `
      <div class="glass-card tool-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--accent-cyan);">${item.type.replace('_', ' ')}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-fav-ws="${item.id}" title="Toggle Favorite">
              ${item.is_favorite ? '★' : '☆'}
            </button>
          </div>
          <h3 style="margin-bottom:8px;">${window.NovaUI.escapeHtml(item.title)}</h3>
          <p style="color:var(--text-secondary); font-size:0.88rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
            ${window.NovaUI.escapeHtml(item.content)}
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-secondary btn-sm" data-open-ws="${item.id}" style="flex:1;">Open</button>
          <button type="button" class="btn btn-danger btn-sm" data-del-ws="${item.id}">Delete</button>
        </div>
      </div>`
      )
      .join('');

    grid.querySelectorAll('[data-open-ws]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = this.items.find((i) => i.id === btn.getAttribute('data-open-ws'));
        if (!item) return;
        window.NovaUI.openModal(
          item.title,
          `<div class="output-box" style="margin-bottom:16px;">${window.NovaUI.renderMarkdown(item.content)}</div>
           <button type="button" class="btn btn-primary btn-sm" id="copyWsItemBtn">Copy Content</button>`
        );
        document.getElementById('copyWsItemBtn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(item.content);
          window.NovaUI.toast('Copied to clipboard.', 'success');
        });
      });
    });

    grid.querySelectorAll('[data-fav-ws]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-fav-ws');
        const item = this.items.find((i) => i.id === id);
        if (!item) return;
        item.is_favorite = !item.is_favorite;
        this.persistLocal();
        if (window.NovaAuth?.user && !String(id).startsWith('ws_')) {
          await fetch(`/api/workspace/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...window.NovaAuth.getAuthHeaders() },
            body: JSON.stringify({ is_favorite: item.is_favorite })
          });
        }
        this.render();
      });
    });

    grid.querySelectorAll('[data-del-ws]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-ws');
        this.items = this.items.filter((i) => i.id !== id);
        this.persistLocal();
        if (window.NovaAuth?.user && !String(id).startsWith('ws_')) {
          await fetch(`/api/workspace/${id}`, {
            method: 'DELETE',
            headers: window.NovaAuth.getAuthHeaders()
          });
        }
        this.render();
        window.NovaUI.toast('Removed from workspace.', 'info');
      });
    });
  }
};
