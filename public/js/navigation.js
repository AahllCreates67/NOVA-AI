/**
 * NOVA AI — Navigation Bar, Mobile Drawer, Modal & Toast Helpers
 */
window.NovaUI = {
  initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileBtn = document.getElementById('mobileMenuToggle');
    const drawer = document.getElementById('mobileNavDrawer');

    window.addEventListener('scroll', () => {
      if (window.scrollY > 18) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    mobileBtn?.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
      drawer.setAttribute('aria-hidden', String(!isOpen));
    });

    // Delegate route clicks
    document.addEventListener('click', (e) => {
      const routeTrigger = e.target.closest('[data-route]');
      if (routeTrigger) {
        e.preventDefault();
        const path = routeTrigger.getAttribute('data-route');
        drawer.classList.remove('open');
        mobileBtn?.setAttribute('aria-expanded', 'false');
        window.NovaRouter.navigate(path);
      }

      const infoTrigger = e.target.closest('[data-info-modal]');
      if (infoTrigger) {
        this.openInfoModal(infoTrigger.getAttribute('data-info-modal'));
      }
    });

    // Modal closing
    const modal = document.getElementById('globalModal');
    document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeModal());
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('open')) {
        this.closeModal();
      }
    });
  },

  openModal(title, htmlContent) {
    const modal = document.getElementById('globalModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = htmlContent;
    modal.classList.add('open');
  },

  closeModal() {
    document.getElementById('globalModal').classList.remove('open');
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 3400);
  },

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  renderMarkdown(text) {
    // Safe HTML escaping first, then lightweight Markdown formatting
    let safe = this.escapeHtml(text);

    // Code blocks ```lang ... ```
    safe = safe.replace(/```([a-zA-Z0-9_-]*)
([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    safe = safe.replace(/`([^`
]+)`/g, '<code>$1</code>');

    // Headings
    safe = safe.replace(/^### (.+)$/gm, '<h4 style="margin:12px 0 6px;">$1</h4>');
    safe = safe.replace(/^## (.+)$/gm, '<h3 style="margin:14px 0 6px;">$1</h3>');

    // Bold & Italic
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Bullet lists
    safe = safe.replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin-left:18px;">$1</li>');

    // Paragraphs / line breaks
    safe = safe.replace(/

/g, '<br><br>').replace(/
/g, '<br>');
    return safe;
  },

  openInfoModal(topic) {
    const contentMap = {
      about: {
        title: 'About NOVA AI',
        body: `<p style="color:var(--text-secondary); margin-bottom:12px;"><strong>NOVA AI — Intelligence Beyond Imagination</strong> is a full-stack AI platform designed and developed by <strong>Aahil Shams</strong>.</p>
               <p style="color:var(--text-secondary);">It unifies real-time conversational AI, specialized productivity tools, visual generation, and active study workflows into one cohesive cosmic environment.</p>`
      },
      privacy: {
        title: 'Privacy Policy',
        body: `<p style="color:var(--text-secondary); margin-bottom:12px;">NOVA AI processes your prompts on our backend server and transmits them securely to configured AI providers (such as Google Gemini) strictly to fulfill your requests.</p>
               <p style="color:var(--text-secondary);">Unauthenticated sessions store history locally in your browser. Authenticated accounts store conversations and workspace items in Supabase protected by Row Level Security.</p>`
      },
      terms: {
        title: 'Terms of Service',
        body: `<p style="color:var(--text-secondary); margin-bottom:12px;">By using NOVA AI, you agree to use AI-generated outputs responsibly and verify important information independently.</p>
               <p style="color:var(--text-secondary);">© ${new Date().getFullYear()} Aahil Shams. All Rights Reserved. Third-party fonts, libraries, and AI APIs remain the property of their respective owners.</p>`
      },
      contact: {
        title: 'Contact & Support',
        body: `<p style="color:var(--text-secondary); margin-bottom:14px;">Have feedback or inquiries regarding NOVA AI? Send a note below.</p>
               <form id="contactModalForm">
                 <div class="form-group">
                   <label class="form-label">Your Name</label>
                   <input type="text" class="input-field" required placeholder="Alex Rivera" />
                 </div>
                 <div class="form-group">
                   <label class="form-label">Message</label>
                   <textarea class="textarea-field" rows="3" required placeholder="How can we help?"></textarea>
                 </div>
                 <button type="submit" class="btn btn-primary">Send Message</button>
               </form>`
      }
    };

    const item = contentMap[topic] || contentMap.about;
    this.openModal(item.title, item.body);

    const contactForm = document.getElementById('contactModalForm');
    contactForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.closeModal();
      this.toast('Thank you! Your message has been recorded.', 'success');
    });
  }
};
