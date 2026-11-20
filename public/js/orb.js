/**
 * NOVA AI — Cosmic 3D Intelligence Sphere
 * Lightweight HTML5 Canvas renderer with depth shading, nebula currents,
 * luminous cyan core, 3D tilted orbital rings, star particles, pointer parallax,
 * click energy pulse, and AI-generating state boost.
 */
class NovaOrb {
  constructor(canvasId, stageId) {
    this.canvas = document.getElementById(canvasId);
    this.stage = document.getElementById(stageId);
    if (!this.canvas || !this.stage) return;

    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.size = 330;
    this.time = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.isHovered = false;
    this.isGenerating = false;
    this.pulseEnergy = 0;
    this.introProgress = 0;

    this.particles = Array.from({ length: 42 }, (_, i) => ({
      angle: (i / 42) * Math.PI * 2,
      radius: 95 + (i % 5) * 16,
      speed: 0.004 + (i % 4) * 0.002,
      size: 1 + (i % 3) * 0.7,
      phase: i * 0.7
    }));

    this.resize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.stage.getBoundingClientRect();
    this.size = Math.max(170, Math.round(rect.width || 330));
    this.canvas.width = this.size * this.dpr;
    this.canvas.height = this.size * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('pointermove', (e) => {
      const rect = this.stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      this.targetMouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / 360));
      this.targetMouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / 360));
    });

    this.stage.addEventListener('mouseenter', () => {
      this.isHovered = true;
    });

    this.stage.addEventListener('mouseleave', () => {
      this.isHovered = false;
    });

    const triggerPulse = () => {
      this.pulseEnergy = 1.0;
    };

    this.stage.addEventListener('click', triggerPulse);
    this.stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPulse();
      }
    });
  }

  setGenerating(active) {
    this.isGenerating = Boolean(active);
    if (active) this.pulseEnergy = 0.8;
  }

  drawOrbitalRing(cx, cy, rx, ry, tiltAngle, rotPhase, alpha, lineWidth) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tiltAngle);

    const grad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    grad.addColorStop(0, `rgba(84, 223, 255, ${alpha})`);
    grad.addColorStop(0.5, `rgba(167, 139, 250, ${alpha * 0.85})`);
    grad.addColorStop(1, `rgba(84, 223, 255, ${alpha * 0.25})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting energy node on ring
    const nodeX = Math.cos(rotPhase) * rx;
    const nodeY = Math.sin(rotPhase) * ry;
    ctx.fillStyle = '#F5F5FF';
    ctx.shadowColor = '#54DFFF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, lineWidth + 1.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  animate() {
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');

    this.introProgress = Math.min(1, this.introProgress + 0.035);
    const speedMult = this.isGenerating ? 2.4 : this.isHovered ? 1.45 : 1.0;
    if (!reduced) {
      this.time += 0.014 * speedMult;
    }

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;
    this.pulseEnergy = Math.max(0, this.pulseEnergy - 0.022);

    const ctx = this.ctx;
    const s = this.size;
    ctx.clearRect(0, 0, s, s);

    const cx = s / 2 + this.mouseX * 10;
    const cy = s / 2 + this.mouseY * 10;
    const baseR = s * 0.275 * this.introProgress;
    const pulseBoost = this.pulseEnergy * 10 + (this.isGenerating ? Math.sin(this.time * 4) * 4 : 0);
    const r = baseR + pulseBoost;

    if (r <= 2) {
      requestAnimationFrame(this.animate);
      return;
    }

    // 1. Back Orbital Rings
    const ringAlpha = (this.isHovered || this.isGenerating ? 0.72 : 0.45) * this.introProgress;
    this.drawOrbitalRing(cx, cy, r * 1.56, r * 0.46, -0.45 + this.mouseY * 0.15, this.time * 0.9, ringAlpha, 1.5);
    this.drawOrbitalRing(cx, cy, r * 1.42, r * 0.38, 0.58 - this.mouseX * 0.15, -this.time * 0.7 + 1.4, ringAlpha * 0.85, 1.2);

    // 2. Outer Atmospheric Corona
    const corona = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r * 1.45);
    corona.addColorStop(0, 'rgba(84, 223, 255, 0.28)');
    corona.addColorStop(0.55, 'rgba(167, 139, 250, 0.14)');
    corona.addColorStop(1, 'rgba(8, 11, 22, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // 3. Main 3D Cosmic Sphere Body
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Deep cosmic base shading
    const sphereGrad = ctx.createRadialGradient(
      cx - r * 0.32,
      cy - r * 0.32,
      r * 0.08,
      cx,
      cy,
      r
    );
    sphereGrad.addColorStop(0, '#54DFFF');
    sphereGrad.addColorStop(0.32, '#7C3AED');
    sphereGrad.addColorStop(0.75, '#191F45');
    sphereGrad.addColorStop(1, '#080B16');
    ctx.fillStyle = sphereGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Swirling Internal Nebula Currents
    for (let i = 0; i < 3; i++) {
      const waveAngle = this.time * (0.7 + i * 0.25) + i * 2.1;
      const wx = cx + Math.cos(waveAngle) * r * 0.28;
      const wy = cy + Math.sin(waveAngle * 1.2) * r * 0.24;
      const neb = ctx.createRadialGradient(wx, wy, 2, wx, wy, r * 0.72);
      neb.addColorStop(0, i % 2 === 0 ? 'rgba(84, 223, 255, 0.42)' : 'rgba(167, 139, 250, 0.45)');
      neb.addColorStop(1, 'rgba(8, 11, 22, 0)');
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.arc(wx, wy, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
    }

    // Luminous Cyan Intelligence Core
    const coreRadius = r * (0.34 + (this.isGenerating ? 0.09 : 0) + this.pulseEnergy * 0.12);
    const coreGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, coreRadius);
    coreGrad.addColorStop(0, 'rgba(245, 245, 255, 0.95)');
    coreGrad.addColorStop(0.35, 'rgba(84, 223, 255, 0.85)');
    coreGrad.addColorStop(1, 'rgba(84, 223, 255, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glass-like Outer Rim & Specular Reflection
    const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.78, cx, cy, r);
    rimGrad.addColorStop(0, 'rgba(84, 223, 255, 0)');
    rimGrad.addColorStop(0.88, 'rgba(167, 139, 250, 0.26)');
    rimGrad.addColorStop(1, 'rgba(84, 223, 255, 0.65)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    ctx.restore();

    // 4. Orbiting Star Particles
    this.particles.forEach((p, idx) => {
      if (!reduced) p.angle += p.speed * speedMult;
      const scale = s / 330;
      const px = cx + Math.cos(p.angle) * p.radius * scale;
      const py = cy + Math.sin(p.angle) * (p.radius * 0.48) * scale;
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(this.time * 1.5 + p.phase));
      ctx.fillStyle = idx % 2 === 0
        ? `rgba(84, 223, 255, ${twinkle * this.introProgress})`
        : `rgba(167, 139, 250, ${twinkle * this.introProgress})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Click Energy Shockwave Ring
    if (this.pulseEnergy > 0.01) {
      const shockR = r + (1 - this.pulseEnergy) * (r * 0.85);
      ctx.strokeStyle = `rgba(84, 223, 255, ${this.pulseEnergy * 0.75})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, shockR, 0, Math.PI * 2);
      ctx.stroke();
    }

    requestAnimationFrame(this.animate);
  }
}

window.NovaOrb = NovaOrb;
