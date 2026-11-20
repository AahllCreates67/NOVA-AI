/**
 * NOVA AI — Image Studio
 */
window.NovaImageStudio = {
  selectedRatio: '1:1',
  gallery: [],

  init(serverHealth) {
    const noticeEl = document.getElementById('imageProviderNotice');
    if (!serverHealth?.capabilities?.imageConfigured) {
      noticeEl.innerHTML = `
        <div class="notice-banner notice-warning">
          <span><strong>Image Provider Setup Required:</strong> No image generation API key is currently configured on the server. Add <code>IMAGE_API_KEY</code> (or a Gemini API key with Imagen 3 access) in <code>.env</code> to generate images.</span>
        </div>`;
    }

    document.getElementById('aspectRatioPills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ratio]');
      if (!btn) return;
      document.querySelectorAll('#aspectRatioPills .aspect-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.selectedRatio = btn.getAttribute('data-ratio');
    });

    document.getElementById('imageStudioForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const prompt = document.getElementById('imagePromptInput').value.trim();
      if (!prompt) return;

      const style = document.getElementById('imageStyleSelect').value;
      const enhance = document.getElementById('imageEnhanceCheck').checked;
      await this.generate({ prompt, style, aspectRatio: this.selectedRatio, enhance });
    });

    document.getElementById('clearImagesBtn')?.addEventListener('click', () => {
      this.gallery = [];
      this.renderGallery();
    });
  },

  async generate(params) {
    const btn = document.getElementById('generateImageBtn');
    const status = document.getElementById('imageGenerationStatus');
    btn.disabled = true;
    status.textContent = 'Synthesizing image...';

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Image generation failed.');
      }

      this.gallery.unshift(json.data);
      this.renderGallery();
      status.textContent = 'Image generated successfully.';
    } catch (err) {
      status.textContent = '';
      window.NovaUI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },

  renderGallery() {
    const grid = document.getElementById('imageGallery');
    const empty = document.getElementById('imageEmptyState');

    if (this.gallery.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = this.gallery
      .map(
        (item, idx) => `
      <div class="glass-card generated-image-card">
        <img src="${item.imageUrl}" alt="${window.NovaUI.escapeHtml(item.prompt)}" loading="lazy" />
        <div style="padding:16px; display:flex; flex-direction:column; gap:10px;">
          <p style="font-size:0.86rem; color:var(--text-secondary);">${window.NovaUI.escapeHtml(item.prompt)}</p>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <a href="${item.imageUrl}" download="nova-ai-${Date.now()}.png" class="btn btn-primary btn-sm">Download</a>
            <button type="button" class="btn btn-secondary btn-sm" data-regen-img="${idx}">Regenerate</button>
            <button type="button" class="btn btn-secondary btn-sm" data-copy-img-prompt="${idx}">Copy Prompt</button>
            <button type="button" class="btn btn-secondary btn-sm" data-save-img="${idx}">Save</button>
          </div>
        </div>
      </div>`
      )
      .join('');

    grid.querySelectorAll('[data-regen-img]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = this.gallery[parseInt(btn.getAttribute('data-regen-img'), 10)];
        if (item) {
          this.generate({
            prompt: item.prompt,
            style: item.style,
            aspectRatio: item.aspectRatio,
            enhance: false
          });
        }
      });
    });

    grid.querySelectorAll('[data-copy-img-prompt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = this.gallery[parseInt(btn.getAttribute('data-copy-img-prompt'), 10)];
        if (item) {
          navigator.clipboard.writeText(item.enhancedPrompt || item.prompt);
          window.NovaUI.toast('Prompt copied.', 'success');
        }
      });
    });

    grid.querySelectorAll('[data-save-img]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = this.gallery[parseInt(btn.getAttribute('data-save-img'), 10)];
        if (item) {
          window.NovaWorkspace?.saveItem({
            type: 'note',
            title: `Image Prompt: ${item.prompt.slice(0, 40)}`,
            content: `Prompt: ${item.prompt}
Enhanced: ${item.enhancedPrompt}
Style: ${item.style} (${item.aspectRatio})`
          });
        }
      });
    });
  }
};
