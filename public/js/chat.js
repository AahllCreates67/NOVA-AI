/**
 * NOVA AI — Streaming AI Chat Workspace
 */
window.NovaChat = {
  conversations: [],
  activeId: null,
  isStreaming: false,
  abortController: null,
  attachedText: '',
  STORAGE_KEY: 'nova_ai_conversations_v1',

  init(serverHealth) {
    const modelEl = document.getElementById('aiModelIndicator');
    const noticeEl = document.getElementById('chatSetupNotice');

    if (serverHealth?.capabilities?.aiConfigured) {
      modelEl.textContent = `Model: ${serverHealth.capabilities.aiModel}`;
    } else {
      modelEl.textContent = 'AI Key Required';
      noticeEl.innerHTML = `
        <div class="notice-banner notice-warning" style="margin:12px 24px 0;">
          <span><strong>Setup Notice:</strong> GEMINI_API_KEY is not configured on the server. Add your key to <code>.env</code> to enable live AI replies.</span>
        </div>`;
    }

    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');

    input?.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim() || this.isStreaming;
    });

    input?.addEventListener('keydown', (e) => {
      const enterToSend = window.NovaSettings?.get().enterToSend !== false;
      if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
        e.preventDefault();
        if (!sendBtn.disabled) {
          document.getElementById('chatForm').requestSubmit();
        }
      }
    });

    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || this.isStreaming) return;
      input.value = '';
      sendBtn.disabled = true;
      this.sendMessage(text);
    });

    document.getElementById('stopGenerationBtn')?.addEventListener('click', () => {
      this.abortController?.abort();
    });

    document.getElementById('newChatBtn')?.addEventListener('click', () => this.createNewChat());
    document.getElementById('clearChatBtn')?.addEventListener('click', () => this.clearCurrentChat());
    document.getElementById('saveChatToWorkspaceBtn')?.addEventListener('click', () => this.saveCurrentChatToWorkspace());

    document.getElementById('chatSearchInput')?.addEventListener('input', (e) => {
      this.renderSidebar(e.target.value.trim().toLowerCase());
    });

    document.getElementById('toggleChatSidebarBtn')?.addEventListener('click', () => {
      document.getElementById('chatSidebar').classList.toggle('open');
    });

    document.getElementById('chatFileAttach')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.attachedText = `

[Attached File: ${file.name}]
${String(reader.result).slice(0, 8000)}`;
        document.getElementById('chatStatusText').textContent = `Attached: ${file.name}`;
        window.NovaUI.toast(`Attached ${file.name}`, 'info');
      };
      reader.readAsText(file);
    });

    document.querySelectorAll('[data-sample-prompt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.sendMessage(btn.getAttribute('data-sample-prompt'));
      });
    });

    this.loadConversations();
  },

  onActivate(params) {
    const initialPrompt = params.get('prompt');
    if (initialPrompt) {
      window.history.replaceState(null, '', '#/chat');
      this.createNewChat();
      this.sendMessage(initialPrompt);
    }
  },

  async loadConversations() {
    const badge = document.getElementById('chatPersistenceBadge');

    if (window.NovaAuth?.user) {
      badge.textContent = 'Cloud Synced';
      try {
        const res = await fetch('/api/conversations', {
          headers: window.NovaAuth.getAuthHeaders()
        });
        const json = await res.json();
        if (json.success) {
          this.conversations = json.data.map((c) => ({ ...c, messages: c.messages || [] }));
        }
      } catch (err) {
        console.error('Failed to load cloud conversations', err);
      }
    } else {
      badge.textContent = 'Browser Storage (Guest)';
      try {
        this.conversations = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      } catch {
        this.conversations = [];
      }
    }

    if (this.conversations.length === 0) {
      this.createNewChat(false);
    } else if (!this.activeId || !this.conversations.some((c) => c.id === this.activeId)) {
      await this.selectConversation(this.conversations[0].id);
    } else {
      this.renderSidebar();
      this.renderMessages();
    }
  },

  saveLocal() {
    if (!window.NovaAuth?.user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conversations));
    }
  },

  async createNewChat(switchTo = true) {
    const newConv = {
      id: 'local_' + Date.now(),
      title: 'New Conversation',
      messages: [],
      updated_at: new Date().toISOString()
    };

    if (window.NovaAuth?.user) {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...window.NovaAuth.getAuthHeaders()
          },
          body: JSON.stringify({ title: 'New Conversation' })
        });
        const json = await res.json();
        if (json.success) {
          newConv.id = json.data.id;
        }
      } catch (e) {
        // Fallback to local id
      }
    }

    this.conversations.unshift(newConv);
    this.saveLocal();
    if (switchTo) {
      this.activeId = newConv.id;
      this.renderSidebar();
      this.renderMessages();
      document.getElementById('chatSidebar')?.classList.remove('open');
    }
  },

  async selectConversation(id) {
    this.activeId = id;
    const conv = this.conversations.find((c) => c.id === id);
    if (conv && window.NovaAuth?.user && !String(id).startsWith('local_') && conv.messages.length === 0) {
      try {
        const res = await fetch(`/api/conversations/${id}`, {
          headers: window.NovaAuth.getAuthHeaders()
        });
        const json = await res.json();
        if (json.success) {
          conv.messages = json.data.messages || [];
        }
      } catch (e) {
        // Ignore
      }
    }
    this.renderSidebar();
    this.renderMessages();
    document.getElementById('chatSidebar')?.classList.remove('open');
  },

  getActiveConversation() {
    return this.conversations.find((c) => c.id === this.activeId);
  },

  renderSidebar(filter = '') {
    const list = document.getElementById('chatHistoryList');
    if (!list) return;

    const filtered = this.conversations.filter((c) =>
      c.title.toLowerCase().includes(filter)
    );

    if (filtered.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:16px;">No conversations found.</p>`;
      return;
    }

    list.innerHTML = filtered
      .map(
        (c) => `
      <div class="chat-history-item ${c.id === this.activeId ? 'active' : ''}" data-conv-id="${c.id}">
        <span class="chat-history-title">${window.NovaUI.escapeHtml(c.title)}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-rename-conv="${c.id}" title="Rename" style="padding:2px 6px;">✎</button>
        <button type="button" class="btn btn-ghost btn-sm" data-delete-conv="${c.id}" title="Delete" style="padding:2px 6px; color:var(--status-error);">✕</button>
      </div>`
      )
      .join('');

    list.querySelectorAll('[data-conv-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-delete-conv]') || e.target.closest('[data-rename-conv]')) return;
        this.selectConversation(el.getAttribute('data-conv-id'));
      });
    });

    list.querySelectorAll('[data-rename-conv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-rename-conv');
        const conv = this.conversations.find((c) => c.id === id);
        if (!conv) return;
        window.NovaUI.openModal(
          'Rename Conversation',
          `<form id="renameConvForm">
            <div class="form-group">
              <label class="form-label">Conversation Title</label>
              <input type="text" id="newConvTitleInput" class="input-field" value="${window.NovaUI.escapeHtml(conv.title)}" required maxlength="100" />
            </div>
            <button type="submit" class="btn btn-primary">Save Title</button>
          </form>`
        );
        document.getElementById('renameConvForm')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const newTitle = document.getElementById('newConvTitleInput').value.trim();
          if (!newTitle) return;
          conv.title = newTitle;
          this.saveLocal();
          if (window.NovaAuth?.user && !String(id).startsWith('local_')) {
            await fetch(`/api/conversations/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...window.NovaAuth.getAuthHeaders() },
              body: JSON.stringify({ title: newTitle })
            });
          }
          window.NovaUI.closeModal();
          this.renderSidebar();
          this.renderMessages();
        });
      });
    });

    list.querySelectorAll('[data-delete-conv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-conv');
        window.NovaUI.openModal(
          'Delete Conversation?',
          `<p style="color:var(--text-secondary); margin-bottom:18px;">This action permanently deletes this conversation and its messages.</p>
           <div style="display:flex; gap:10px; justify-content:flex-end;">
             <button type="button" class="btn btn-secondary" onclick="window.NovaUI.closeModal()">Cancel</button>
             <button type="button" class="btn btn-danger" id="confirmDeleteConvBtn">Delete</button>
           </div>`
        );
        document.getElementById('confirmDeleteConvBtn')?.addEventListener('click', async () => {
          this.conversations = this.conversations.filter((c) => c.id !== id);
          this.saveLocal();
          if (window.NovaAuth?.user && !String(id).startsWith('local_')) {
            await fetch(`/api/conversations/${id}`, {
              method: 'DELETE',
              headers: window.NovaAuth.getAuthHeaders()
            });
          }
          window.NovaUI.closeModal();
          if (this.conversations.length === 0) {
            await this.createNewChat();
          } else if (this.activeId === id) {
            await this.selectConversation(this.conversations[0].id);
          } else {
            this.renderSidebar();
          }
          window.NovaUI.toast('Conversation deleted.', 'info');
        });
      });
    });
  },

  renderMessages() {
    const container = document.getElementById('chatMessagesContainer');
    const emptyState = document.getElementById('chatEmptyState');
    const titleEl = document.getElementById('activeChatTitle');
    const conv = this.getActiveConversation();

    if (!conv) return;
    titleEl.textContent = conv.title;

    if (conv.messages.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
        container.appendChild(emptyState);
      }
      return;
    }

    container.innerHTML = conv.messages
      .map((m, idx) => {
        const isUser = m.role === 'user';
        const formatted = isUser
          ? window.NovaUI.escapeHtml(m.content).replace(/
/g, '<br>')
          : window.NovaUI.renderMarkdown(m.content || '...');

        return `
        <div class="message-row ${m.role}" data-msg-idx="${idx}">
          <div class="message-avatar ${isUser ? 'user' : 'ai'}">${isUser ? 'U' : 'N'}</div>
          <div style="flex:1; max-width:85%;">
            <div class="message-bubble ${m.isError ? 'notice-error' : ''}">${formatted}</div>
            ${!isUser && m.content ? `
              <div class="message-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-copy-msg="${idx}">Copy</button>
                ${idx === conv.messages.length - 1 ? `<button type="button" class="btn btn-ghost btn-sm" id="regenerateLastBtn">Regenerate</button>` : ''}
              </div>` : ''}
          </div>
        </div>`;
      })
      .join('');

    container.querySelectorAll('[data-copy-msg]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-copy-msg'), 10);
        navigator.clipboard.writeText(conv.messages[idx].content);
        window.NovaUI.toast('Copied response to clipboard.', 'success');
      });
    });

    document.getElementById('regenerateLastBtn')?.addEventListener('click', () => {
      if (this.isStreaming || conv.messages.length < 2) return;
      conv.messages.pop(); // remove last assistant reply
      const lastUserMsg = conv.messages[conv.messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        this.streamReply(conv, lastUserMsg.content, true);
      }
    });

    container.scrollTop = container.scrollHeight;
  },

  async sendMessage(rawText) {
    let conv = this.getActiveConversation();
    if (!conv) {
      await this.createNewChat();
      conv = this.getActiveConversation();
    }

    const fullUserText = this.attachedText ? `${rawText}${this.attachedText}` : rawText;
    this.attachedText = '';

    if (conv.messages.length === 0) {
      conv.title = rawText.slice(0, 46) + (rawText.length > 46 ? '...' : '');
    }

    conv.messages.push({ role: 'user', content: fullUserText });
    this.renderSidebar();
    this.renderMessages();

    await this.streamReply(conv, fullUserText, false);
  },

  async streamReply(conv, userPrompt, isRegen) {
    this.isStreaming = true;
    window.novaOrbInstance?.setGenerating(true);

    const stopBtn = document.getElementById('stopGenerationBtn');
    const sendBtn = document.getElementById('sendChatBtn');
    const statusText = document.getElementById('chatStatusText');

    stopBtn.style.display = 'inline-flex';
    sendBtn.disabled = true;
    statusText.textContent = 'NOVA is thinking...';

    const historyForApi = conv.messages.slice(0, -1);
    const assistantMsg = { role: 'assistant', content: '' };
    conv.messages.push(assistantMsg);
    this.renderMessages();

    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          history: historyForApi
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('

');
        buffer = events.pop() || '';

        for (const ev of events) {
          if (!ev.startsWith('data: ')) continue;
          const payload = JSON.parse(ev.slice(6));
          if (payload.type === 'chunk') {
            assistantMsg.content += payload.content;
            this.renderMessages();
          } else if (payload.type === 'error') {
            throw new Error(payload.message);
          }
        }
      }

      if (!assistantMsg.content) {
        assistantMsg.content = 'No response returned from AI provider.';
      }

      this.saveLocal();
      if (window.NovaAuth?.user && !String(conv.id).startsWith('local_')) {
        const msgsToSync = isRegen
          ? [{ role: 'assistant', content: assistantMsg.content }]
          : [
              { role: 'user', content: userPrompt },
              { role: 'assistant', content: assistantMsg.content }
            ];
        await fetch(`/api/conversations/${conv.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...window.NovaAuth.getAuthHeaders() },
          body: JSON.stringify({ title: conv.title, messages: msgsToSync })
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        assistantMsg.content += '

*[Generation stopped by user]*';
      } else {
        assistantMsg.content = `Error: ${err.message}`;
        assistantMsg.isError = true;
      }
      this.saveLocal();
      this.renderMessages();
    } finally {
      this.isStreaming = false;
      window.novaOrbInstance?.setGenerating(false);
      stopBtn.style.display = 'none';
      statusText.textContent = 'Ready';
      const inp = document.getElementById('chatInput');
      sendBtn.disabled = !inp?.value.trim();
    }
  },

  clearCurrentChat() {
    const conv = this.getActiveConversation();
    if (!conv || conv.messages.length === 0) return;
    conv.messages = [];
    this.saveLocal();
    this.renderMessages();
    window.NovaUI.toast('Conversation cleared.', 'info');
  },

  saveCurrentChatToWorkspace() {
    const conv = this.getActiveConversation();
    if (!conv || conv.messages.length === 0) {
      window.NovaUI.toast('Nothing to save in an empty conversation.', 'error');
      return;
    }
    const transcript = conv.messages
      .map((m) => `${m.role === 'user' ? 'User' : 'NOVA AI'}: ${m.content}`)
      .join('

---

');

    window.NovaWorkspace?.saveItem({
      type: 'conversation',
      title: conv.title,
      content: transcript
    });
  }
};
