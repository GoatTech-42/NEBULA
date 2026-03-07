/**
 * ui.js — NEBULA visual layer
 *
 * Exports:
 *   initCanvas()   — starfield + shooting stars on #bg-canvas
 *   initParallax() — mouse/gyro parallax on #neb-1, #neb-2, #neb-3
 */

/* ══════════════════════════════════════════
   CANVAS PARTICLES
══════════════════════════════════════════ */
export function initCanvas(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], nebulae = [];

  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for(let i = 0; i < 6; i++){
    nebulae.push({
      x  : Math.random() * 1.2 - 0.1,
      y  : Math.random() * 1.2 - 0.1,
      r  : Math.random() * 0.4 + 0.2,
      hue: Math.random() < 0.5 ? 210 : 270,
      a  : Math.random() * 0.055 + 0.02,
      dx : (Math.random() - 0.5) * 0.00012,
      dy : (Math.random() - 0.5) * 0.00012,
    });
  }

  for(let i = 0; i < 160; i++){
    particles.push({
      x           : Math.random(),
      y           : Math.random(),
      r           : Math.random() * 1.5 + 0.2,
      a           : Math.random() * 0.6  + 0.1,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      dx          : (Math.random() - 0.5) * 0.00008,
      dy          : (Math.random() - 0.5) * 0.00008,
      color       : Math.random() < 0.15
                    ? `hsl(${200 + Math.random() * 60},80%,85%)`
                    : '#fff',
    });
  }

  let shooters = [];
  function spawnShooter(){
    shooters.push({
      x    : Math.random() * 0.7,
      y    : Math.random() * 0.4,
      len  : Math.random() * 110 + 60,
      speed: Math.random() * 0.016 + 0.01,
      a    : 1,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
    });
  }
  setInterval(() => { if(Math.random() < 0.35) spawnShooter(); }, 2200);

  function draw(){
    requestAnimationFrame(draw);

    // Pause rendering when the tab is hidden — saves CPU / battery
    if(window._canvasPaused) return;

    ctx.clearRect(0, 0, W, H);

    // Slow-drifting nebula blobs
    nebulae.forEach(n => {
      n.x += n.dx; n.y += n.dy;
      if(n.x < -0.5 || n.x > 1.5) n.dx *= -1;
      if(n.y < -0.5 || n.y > 1.5) n.dy *= -1;
      const g = ctx.createRadialGradient(n.x*W, n.y*H, 0, n.x*W, n.y*H, n.r * Math.min(W, H));
      g.addColorStop(0, `hsla(${n.hue},70%,55%,${n.a})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x*W, n.y*H, n.r * Math.min(W, H), 0, Math.PI * 2);
      ctx.fill();
    });

    // Twinkling star particles
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if(p.x < 0) p.x = 1; if(p.x > 1) p.x = 0;
      if(p.y < 0) p.y = 1; if(p.y > 1) p.y = 0;
      p.twinklePhase += p.twinkleSpeed;
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.twinklePhase));
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Shooting stars
    shooters = shooters.filter(s => {
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.a -= 0.018;
      if(s.a <= 0) return false;
      const tx = s.x * W, ty = s.y * H;
      const tail = ctx.createLinearGradient(
        tx, ty,
        tx - Math.cos(s.angle) * s.len,
        ty - Math.sin(s.angle) * s.len
      );
      tail.addColorStop(0, `rgba(200,230,255,${s.a})`);
      tail.addColorStop(1, 'transparent');
      ctx.globalAlpha  = 1;
      ctx.strokeStyle  = tail;
      ctx.lineWidth    = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(s.angle) * s.len, ty - Math.sin(s.angle) * s.len);
      ctx.stroke();
      return true;
    });

    ctx.globalAlpha = 1;
  }

  draw();
}

/* ══════════════════════════════════════════
   PARALLAX NEBULA
══════════════════════════════════════════ */
export function initParallax(){
  // Parallax intentionally disabled per user request — keep nebula layers static
  const ids = ['neb-1','neb-2','neb-3','neb-stars'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el){
      el.style.transform = 'translate(0px, 0px)';
      el.style.animation = 'none';
      el.style.opacity = '1';
    }
  });
  return;
}

export function initCursor(){
  // Respect reduced motion and touch devices
  if(('ontouchstart' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dot = document.getElementById('custom-cursor');
  const ring = document.getElementById('custom-cursor-ring');
  if(!dot || !ring) return;
  // Enable custom cursor CSS scope
  document.documentElement.classList.add('use-custom-cursor');

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  }, { passive: true });

  function loop(){
    requestAnimationFrame(loop);
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx.toFixed(1) + 'px'; ring.style.top = ry.toFixed(1) + 'px';
  }
  loop();

  document.addEventListener('mousedown', () => { dot.classList.add('cursor-click'); ring.classList.add('cursor-click'); });
  document.addEventListener('mouseup', () => { dot.classList.remove('cursor-click'); ring.classList.remove('cursor-click'); });

  // Toggle text cursor when hovering inputs / contenteditable
  document.addEventListener('pointerover', e => {
    const t = e.target;
    if(!t) return;
    const isText = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
    if(isText) dot.classList.add('cursor-text'); else dot.classList.remove('cursor-text');
  }, { passive: true });

  // Add hover state for interactive elements
  const isInteractive = el => {
    if(!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    if(tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || el.hasAttribute('role') && el.getAttribute('role').includes('button')) return true;
    if(el.classList && /btn|send-btn|mention-btn|mab|titem/.test(el.className)) return true;
    return false;
  };
  document.addEventListener('pointerover', e => {
    let el = e.target;
    while(el && el !== document.documentElement){ if(isInteractive(el)){ dot.classList.add('cursor-hover'); ring.classList.add('cursor-hover'); return; } el = el.parentElement; }
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    let el = e.relatedTarget || e.target;
    // clear hover when pointer leaves the interactive element
    setTimeout(() => { dot.classList.remove('cursor-hover'); ring.classList.remove('cursor-hover'); }, 30);
  }, { passive: true });

  // Hide cursor when over the game iframe (#game-frame) so the game's native cursor appears
  const gameFrame = document.getElementById('game-frame');
  if(gameFrame){
    gameFrame.addEventListener('mouseenter', () => { document.documentElement.classList.add('game-cursor-hidden'); });
    gameFrame.addEventListener('mouseleave', () => { document.documentElement.classList.remove('game-cursor-hidden'); });
    // Also hide when entering the vault container (covers iframe area)
    const vault = document.getElementById('game-vault');
    if(vault){
      vault.addEventListener('mouseenter', () => { document.documentElement.classList.add('game-cursor-hidden'); });
      vault.addEventListener('mouseleave', () => { document.documentElement.classList.remove('game-cursor-hidden'); });
    }
  }
}