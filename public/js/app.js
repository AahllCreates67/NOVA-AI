/**
 * NOVA AI — Main Frontend Bootstrap
 * Designed & Developed by Aahil Shams
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Dynamic copyright year
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Initialize Cosmic 3D Orb
  window.novaOrbInstance = new window.NovaOrb('novaOrbCanvas', 'novaOrbStage');

  // Initialize UI & Settings
  window.NovaSettings.init();
  window.NovaUI.initNavigation();

  // Fetch server runtime capabilities (never exposes secrets)
  let serverHealth = null;
  try {
    const res = await fetch('/api/health');
    serverHealth = await res.json();
  } catch (err) {
    window.NovaUI.toast('Unable to reach NOVA AI backend server.', 'error');
  }

  // Initialize Modules
  await window.NovaAuth.init(serverHealth);
  window.NovaChat.init(serverHealth);
  window.NovaTools.init();
  window.NovaImageStudio.init(serverHealth);
  window.NovaStudyRoom.init();
  window.NovaWorkspace.init();

  // Hero Prompt Composer Behavior
  const heroInput = document.getElementById('heroPromptInput');
  const heroSubmit = document.getElementById('heroPromptSubmit');
  let heroAttachedText = '';

  heroInput?.addEventListener('input', () => {
    heroSubmit.disabled = !heroInput.value.trim();
  });

  heroInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!heroSubmit.disabled) {
        document.getElementById('heroPromptForm').requestSubmit();
      }
    }
  });

  document.getElementById('heroFileAttach')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      heroAttachedText = `

[Attached File: ${file.name}]
${String(reader.result).slice(0, 8000)}`;
      document.getElementById('heroAttachLabel').textContent = `Attached: ${file.name}`;
    };
    reader.readAsText(file);
  });

  document.getElementById('heroPromptForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = heroInput.value.trim();
    if (!prompt) return;
    const fullPrompt = heroAttachedText ? `${prompt}${heroAttachedText}` : prompt;
    heroInput.value = '';
    heroAttachedText = '';
    heroSubmit.disabled = true;
    window.NovaRouter.navigate(`/chat?prompt=${encodeURIComponent(fullPrompt)}`);
  });

  // Homepage Quick Action Cards
  document.querySelectorAll('[data-quick-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-quick-action');
      if (action === 'chat') {
        window.NovaRouter.navigate('/chat');
      } else if (action === 'image') {
        window.NovaRouter.navigate('/image-studio');
      } else if (action.startsWith('tool:')) {
        const toolId = action.split(':')[1];
        window.NovaRouter.navigate(`/discover?tool=${encodeURIComponent(toolId)}`);
      }
    });
  });

  // Start Client Router
  window.NovaRouter.init();
});
