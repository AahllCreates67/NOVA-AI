/**
 * NOVA AI — Discover Tools Suite (8 Specialized AI Tools)
 */
window.NovaTools = {
  RECENT_KEY: 'nova_recent_tools_v1',
  catalog: [
    {
      id: 'writer',
      name: 'AI Writer',
      category: 'writing',
      icon: '✍️',
      desc: 'Generate polished articles, essays, scripts, or rewrite drafts with tailored tone.',
      placeholder: 'Describe what you want to write or paste an existing draft...',
      options: [
        { key: 'mode', label: 'Mode', values: ['Generate New', 'Improve & Polish', 'Rewrite', 'Expand'] },
        { key: 'tone', label: 'Tone', values: ['Professional', 'Creative', 'Academic', 'Persuasive', 'Conversational'] }
      ]
    },
    {
      id: 'summarizer',
      name: 'AI Summarizer',
      category: 'productivity',
      icon: '📑',
      desc: 'Distill long articles, notes, or transcripts into clear takeaways.',
      placeholder: 'Paste the text you want summarized...',
      options: [
        { key: 'length', label: 'Summary Depth', values: ['Concise Bullet Points', 'Executive Overview', 'Detailed Breakdown'] }
      ]
    },
    {
      id: 'translator',
      name: 'AI Translator',
      category: 'productivity',
      icon: '🌐',
      desc: 'Translate text accurately across languages while preserving tone and context.',
      placeholder: 'Enter text to translate...',
      options: [
        { key: 'sourceLang', label: 'From', values: ['Auto-Detect', 'English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Japanese'] },
        { key: 'targetLang', label: 'To', values: ['Spanish', 'English', 'French', 'German', 'Hindi', 'Arabic', 'Japanese', 'Korean'] }
      ]
    },
    {
      id: 'brainstorm',
      name: 'AI Brainstorm',
      category: 'creative',
      icon: '✦',
      desc: 'Generate structured, high-impact ideas and creative angles for any challenge.',
      placeholder: 'What topic, project, or problem are you brainstorming?',
      options: [
        { key: 'category', label: 'Angle', values: ['Creative & Bold', 'Product & Startup', 'Content & Marketing', 'Problem Solving'] }
      ]
    },
    {
      id: 'explainer',
      name: 'AI Explainer',
      category: 'learning',
      icon: '🧠',
      desc: 'Understand difficult concepts with step-by-step clarity and analogies.',
      placeholder: 'Enter a concept, theorem, or question to explain...',
      options: [
        { key: 'level', label: 'Complexity Level', values: ['Simple (Beginner)', 'Intermediate', 'Deep Technical'] }
      ]
    },
    {
      id: 'code-helper',
      name: 'AI Code Helper',
      category: 'learning',
      icon: '💻',
      desc: 'Explain code snippets, diagnose bugs, and refactor for clarity.',
      placeholder: 'Paste your code or describe the programming issue...',
      options: [
        { key: 'action', label: 'Action', values: ['Explain Code', 'Debug & Fix', 'Optimize & Refactor'] },
        { key: 'language', label: 'Language', values: ['Auto-Detect', 'JavaScript', 'Python', 'TypeScript', 'HTML/CSS', 'SQL', 'C++'] }
      ]
    },
    {
      id: 'email-assistant',
      name: 'AI Email Assistant',
      category: 'writing',
      icon: '✉️',
      desc: 'Draft or refine professional emails with compelling subject lines.',
      placeholder: 'Describe the purpose of the email or paste a rough draft...',
      options: [
        { key: 'action', label: 'Action', values: ['Draft New Email', 'Polish Existing Draft', 'Make Concise'] },
        { key: 'tone', label: 'Tone', values: ['Professional & Warm', 'Formal Executive', 'Friendly Follow-Up', 'Direct'] }
      ]
    },
    {
      id: 'storyteller',
      name: 'AI Storyteller',
      category: 'creative',
      icon: '🌌',
      desc: 'Craft original stories with vivid characters, pacing, and atmosphere.',
      placeholder: 'Enter a story premise, setting, or character idea...',
      options: [
        { key: 'genre', label: 'Genre', values: ['Sci-Fi / Cosmic', 'Mystery', 'Fantasy', 'Drama', 'Adventure'] },
        { key: 'tone', label: 'Atmosphere', values: ['Cinematic & Inspiring', 'Suspenseful', 'Whimsical', 'Reflective'] }
      ]
    }
  ],

  init() {
    this.activeCategory = 'all';
    this.renderGrid();
    this.renderRecent();

    document.getElementById('toolSearchInput')?.addEventListener('input', () => this.renderGrid());

    document.getElementById('toolCategoryPills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      document.querySelectorAll('#toolCategoryPills .filter-pill').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      this.activeCategory = btn.getAttribute('data-category');
      this.renderGrid();
    });
  },

  onActivate(params) {
    const toolId = params.get('tool');
    if (toolId) {
      window.history.replaceState(null, '', '#/discover');
      this.openToolModal(toolId);
    }
  },

  renderGrid() {
    const grid = document.getElementById('toolsGrid');
    const empty = document.getElementById('toolsEmptyState');
    const query = (document.getElementById('toolSearchInput')?.value || '').trim().toLowerCase();

    const matches = this.catalog.filter((t) => {
      const catMatch = this.activeCategory === 'all' || t.category === this.activeCategory;
      const textMatch = !query || t.name.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query);
      return catMatch && textMatch;
    });

    if (matches.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = matches
      .map(
        (t) => `
      <div class="glass-card interactive tool-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div class="quick-icon">${t.icon}</div>
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-cyan);">${t.category}</span>
          </div>
          <h3 style="margin-bottom:8px;">${t.name}</h3>
          <p style="color:var(--text-secondary); font-size:0.9rem;">${t.desc}</p>
        </div>
        <button type="button" class="btn btn-secondary" data-launch-tool="${t.id}" style="width:100%;">Launch ${t.name}</button>
      </div>`
      )
      .join('');

    grid.querySelectorAll('[data-launch-tool]').forEach((btn) => {
      btn.addEventListener('click', () => this.openToolModal(btn.getAttribute('data-launch-tool')));
    });
  },

  recordRecent(toolId) {
    try {
      const list = JSON.parse(localStorage.getItem(this.RECENT_KEY) || '[]').filter((id) => id !== toolId);
      list.unshift(toolId);
      localStorage.setItem(this.RECENT_KEY, JSON.stringify(list.slice(0, 4)));
      this.renderRecent();
    } catch {
      // Ignore storage errors
    }
  },

  renderRecent() {
    const section = document.getElementById('recentToolsSection');
    const container = document.getElementById('recentToolsList');
    if (!section || !container) return;

    try {
      const ids = JSON.parse(localStorage.getItem(this.RECENT_KEY) || '[]');
      const items = ids.map((id) => this.catalog.find((t) => t.id === id)).filter(Boolean);
      if (items.length === 0) {
        section.style.display = 'none';
        return;
      }
      section.style.display = 'block';
      container.innerHTML = items
        .map((t) => `<button type="button" class="btn btn-secondary btn-sm" data-recent-tool="${t.id}">${t.icon} ${t.name}</button>`)
        .join('');
      container.querySelectorAll('[data-recent-tool]').forEach((btn) => {
        btn.addEventListener('click', () => this.openToolModal(btn.getAttribute('data-recent-tool')));
      });
    } catch {
      section.style.display = 'none';
    }
  },

  openToolModal(toolId) {
    const tool = this.catalog.find((t) => t.id === toolId);
    if (!tool) return;
    this.recordRecent(tool.id);

    const optionsHtml = tool.options
      .map(
        (opt) => `
      <div class="form-group" style="flex:1; min-width:160px;">
        <label class="form-label" for="toolOpt_${opt.key}">${opt.label}</label>
        <select id="toolOpt_${opt.key}" class="select-field">
          ${opt.values.map((v) => `<option value="${v}">${v}</option>`).join('')}
        </select>
      </div>`
      )
      .join('');

    window.NovaUI.openModal(
      `${tool.icon} ${tool.name}`,
      `<p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:16px;">${tool.desc}</p>
       <form id="activeToolForm">
         <div style="display:flex; flex-wrap:wrap; gap:12px;">${optionsHtml}</div>
         <div class="form-group">
           <label class="form-label" for="toolInputTextarea">Your Input</label>
           <textarea id="toolInputTextarea" class="textarea-field" rows="4" required placeholder="${tool.placeholder}"></textarea>
         </div>
         <div style="display:flex; gap:10px; align-items:center;">
           <button type="submit" class="btn btn-primary" id="runToolSubmitBtn">Generate Result</button>
           <span id="toolRunStatus" style="font-size:0.85rem; color:var(--text-secondary);"></span>
         </div>
       </form>
       <div id="toolResultWrapper" style="display:none; margin-top:20px;">
         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
           <strong>Result</strong>
           <div style="display:flex; gap:8px;">
             <button type="button" class="btn btn-secondary btn-sm" id="copyToolResultBtn">Copy</button>
             <button type="button" class="btn btn-secondary btn-sm" id="saveToolResultBtn">Save to Workspace</button>
           </div>
         </div>
         <div id="toolResultOutput" class="output-box"></div>
       </div>`
    );

    let lastOutputText = '';

    document.getElementById('activeToolForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('toolInputTextarea').value.trim();
      if (!input) return;

      const options = {};
      tool.options.forEach((opt) => {
        options[opt.key] = document.getElementById(`toolOpt_${opt.key}`)?.value;
      });

      const btn = document.getElementById('runToolSubmitBtn');
      const status = document.getElementById('toolRunStatus');
      const wrapper = document.getElementById('toolResultWrapper');
      const outputEl = document.getElementById('toolResultOutput');

      btn.disabled = true;
      status.textContent = 'Processing with NOVA AI...';

      try {
        const res = await fetch(`/api/tools/${tool.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, options })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message || 'Tool execution failed.');
        }

        lastOutputText = json.data.output;
        outputEl.innerHTML = window.NovaUI.renderMarkdown(lastOutputText);
        wrapper.style.display = 'block';
        status.textContent = 'Completed';
      } catch (err) {
        status.textContent = '';
        window.NovaUI.toast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById('copyToolResultBtn')?.addEventListener('click', () => {
      if (!lastOutputText) return;
      navigator.clipboard.writeText(lastOutputText);
      window.NovaUI.toast('Copied to clipboard.', 'success');
    });

    document.getElementById('saveToolResultBtn')?.addEventListener('click', () => {
      if (!lastOutputText) return;
      window.NovaWorkspace?.saveItem({
        type: 'tool_output',
        title: `${tool.name} Output`,
        content: lastOutputText
      });
    });
  }
};
