/**
 * ui.js — NEBULA visual layer
 * Exports: initCanvas(), initParallax()
 */

/* ══════════════════════════════════════════
   CANVAS — starfield + shooting stars
══════════════════════════════════════════ */
export function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], nebulae = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 8; i++) {
    nebulae.push({
      x   : Math.random() * 1.3 - 0.15,
      y   : Math.random() * 1.3 - 0.15,
      r   : Math.random() * 0.45 + 0.18,
      hue : Math.random() < 0.33 ? 210 : Math.random() < 0.5 ? 270 : 190,
      sat : 65 + Math.random() * 25,
      a   : Math.random() * 0.06 + 0.018,
      dx  : (Math.random() - 0.5) * 0.00010,
      dy  : (Math.random() - 0.5) * 0.00010,
      pulse     : Math.random() * Math.PI * 2,
      pulseSpeed: 0.0004 + Math.random() * 0.0003,
    });
  }

  for (let i = 0; i < 200; i++) {
    particles.push({
      x           : Math.random(),
      y           : Math.random(),
      r           : Math.random() * 1.6 + 0.15,
      a           : Math.random() * 0.65 + 0.1,
      twinkleSpeed: Math.random() * 0.022 + 0.004,
      twinklePhase: Math.random() * Math.PI * 2,
      dx          : (Math.random() - 0.5) * 0.00007,
      dy          : (Math.random() - 0.5) * 0.00007,
      color       : Math.random() < 0.12
                    ? `hsl(${195 + Math.random() * 70},85%,88%)`
                    : Math.random() < 0.06 ? `hsl(${300 + Math.random() * 40},70%,82%)` : '#fff',
    });
  }

  let shooters = [];
  function spawnShooter() {
    shooters.push({
      x    : Math.random() * 0.7,
      y    : Math.random() * 0.35,
      len  : Math.random() * 130 + 55,
      speed: Math.random() * 0.018 + 0.009,
      a    : 1,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.35,
      hue  : 180 + Math.random() * 60,
    });
  }
  setInterval(() => { if (Math.random() < 0.4) spawnShooter(); }, 2000);

  /* Dust clouds — large soft wisps */
  const dustClouds = Array.from({ length: 4 }, () => ({
    x     : Math.random(),
    y     : Math.random(),
    r     : 0.55 + Math.random() * 0.35,
    hue   : [220, 260, 190, 300][Math.floor(Math.random() * 4)],
    a     : 0.012 + Math.random() * 0.018,
    dx    : (Math.random() - 0.5) * 0.00006,
    dy    : (Math.random() - 0.5) * 0.00006,
  }));

  function draw() {
    requestAnimationFrame(draw);
    if (window._canvasPaused) return;
    ctx.clearRect(0, 0, W, H);

    /* Dust clouds */
    dustClouds.forEach(d => {
      d.x += d.dx; d.y += d.dy;
      if (d.x < -0.6 || d.x > 1.6) d.dx *= -1;
      if (d.y < -0.6 || d.y > 1.6) d.dy *= -1;
      const g = ctx.createRadialGradient(d.x * W, d.y * H, 0, d.x * W, d.y * H, d.r * Math.min(W, H));
      g.addColorStop(0, `hsla(${d.hue},60%,45%,${d.a})`);
      g.addColorStop(0.5, `hsla(${d.hue},50%,35%,${d.a * 0.4})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x * W, d.y * H, d.r * Math.min(W, H), 0, Math.PI * 2);
      ctx.fill();
    });

    /* Nebula blobs */
    nebulae.forEach(n => {
      n.x += n.dx; n.y += n.dy; n.pulse += n.pulseSpeed;
      if (n.x < -0.55 || n.x > 1.55) n.dx *= -1;
      if (n.y < -0.55 || n.y > 1.55) n.dy *= -1;
      const pulse = 1 + 0.06 * Math.sin(n.pulse);
      const g = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * Math.min(W, H) * pulse);
      g.addColorStop(0,   `hsla(${n.hue},${n.sat}%,55%,${n.a * pulse})`);
      g.addColorStop(0.4, `hsla(${n.hue},${n.sat - 10}%,40%,${n.a * 0.5})`);
      g.addColorStop(1,   'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x * W, n.y * H, n.r * Math.min(W, H) * pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    /* Stars */
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
      p.twinklePhase += p.twinkleSpeed;
      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.twinklePhase));
      ctx.globalAlpha = alpha;
      /* subtle glow on bright stars */
      if (p.r > 1.2) {
        const sg = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, p.r * 3);
        sg.addColorStop(0, p.color); sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2); ctx.fill();
    });

    /* Shooting stars */
    shooters = shooters.filter(s => {
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.a -= 0.016;
      if (s.a <= 0) return false;
      const tx = s.x * W, ty = s.y * H;
      const tail = ctx.createLinearGradient(tx, ty, tx - Math.cos(s.angle) * s.len, ty - Math.sin(s.angle) * s.len);
      tail.addColorStop(0, `hsla(${s.hue},90%,90%,${s.a})`);
      tail.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1; ctx.strokeStyle = tail; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - Math.cos(s.angle) * s.len, ty - Math.sin(s.angle) * s.len); ctx.stroke();
      /* head glow */
      ctx.globalAlpha = s.a * 0.8;
      const hg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 3);
      hg.addColorStop(0, `hsla(${s.hue},90%,95%,1)`); hg.addColorStop(1, 'transparent');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
      return true;
    });

    ctx.globalAlpha = 1;
  }
  draw();
}

/* ══════════════════════════════════════════
   PARALLAX NEBULA
══════════════════════════════════════════ */
let parallaxActive = false;
export function setParallaxActive(v) { parallaxActive = v; }

export function initParallax() {
  const layerDefs = [
  { id:'neb-1', speedX:0.022, speedY:0.015 },
  { id:'neb-2', speedX:0.036, speedY:0.026 },
  { id:'neb-3', speedX:0.014, speedY:0.020 },
  { id:'neb-4', speedX:0.028, speedY:0.018 },
  ];
  const layers = layerDefs.map(def => ({ ...def, el: document.getElementById(def.id) })).filter(l => l.el);
  if (!layers.length) return;

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  const IDLE_AMP_X = 0.20, IDLE_AMP_Y = 0.14;
  const IDLE_FREQ_X = 0.00016, IDLE_FREQ_Y = 0.00011;
  let idleActive = true, idleTimeout = null, startTime = performance.now();

  function idleOffset(now) {
    if (!idleActive) return { x: 0, y: 0 };
    const t = now - startTime;
    return { x: Math.sin(t * IDLE_FREQ_X) * IDLE_AMP_X, y: Math.cos(t * IDLE_FREQ_Y + 1.2) * IDLE_AMP_Y };
  }
  function suppressIdle() {
    idleActive = false; clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => { idleActive = true; }, 4500);
  }

  window.addEventListener('mousemove', e => {
    if (!parallaxActive) return;
    suppressIdle();
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let gyroAttached = false;
  function attachGyro() {
    if (gyroAttached) return; gyroAttached = true;
    window.addEventListener('deviceorientation', e => {
      if (e.gamma === null || e.beta === null) return;
      suppressIdle();
      targetX = Math.max(-1, Math.min(1,  e.gamma       / 30));
      targetY = Math.max(-1, Math.min(1, (e.beta - 45)  / 30));
    }, { passive: true });
  }
  function requestGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') attachGyro(); }).catch(() => {});
    } else { attachGyro(); }
  }
  window.addEventListener('touchstart', requestGyro, { once: true, passive: true });
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') attachGyro();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    layers.forEach(({ el }) => { el.style.transform = 'translate(0px,0px)'; }); return;
  }

  const LERP = 0.055;
  function animate(now) {
    requestAnimationFrame(animate);
    if (window._canvasPaused) return;
    if (!parallaxActive) {
      targetX += (0 - targetX) * 0.05;
      targetY += (0 - targetY) * 0.05;
    }
    const idle = idleOffset(now);
    const fx = targetX + idle.x, fy = targetY + idle.y;
    currentX += (fx - currentX) * LERP; currentY += (fy - currentY) * LERP;
    layers.forEach(({ el, speedX, speedY }) => {
      const tx = currentX * speedX * window.innerWidth;
      const ty = currentY * speedY * window.innerHeight;
      el.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px)`;
    });
  }
  requestAnimationFrame(animate);
}