// ===================================================================
// HOMEPAGE ENHANCEMENTS — Splash, Particles, Tilt, Counters, Shine
// ===================================================================

// ===== 0. Splash Screen =====
(function () {
  const splash = document.getElementById('splash');
  if (!splash) return;

  // Lock scroll during splash
  document.body.classList.add('splash-active');

  // Only show splash once per session
  if (sessionStorage.getItem('splashShown')) {
    splash.remove();
    document.body.classList.remove('splash-active');
    return;
  }

  sessionStorage.setItem('splashShown', '1');

  // Dismiss after animations complete (~2.2s)
  setTimeout(() => {
    splash.classList.add('done');
    document.body.classList.remove('splash-active');
    document.body.classList.add('splash-reveal');

    // Remove from DOM after fade-out
    setTimeout(() => splash.remove(), 700);
  }, 2200);
})();

// ===== 1. Neural-net Particle Canvas =====
(function () {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, particles, animId;
  const COUNT = 70;
  const CONNECT_DIST = 140;
  const MOUSE = { x: -9999, y: -9999 };
  const MOUSE_RADIUS = 180;

  function resize() {
    const hero = canvas.closest('.hero');
    w = canvas.width = hero.offsetWidth;
    h = canvas.height = hero.offsetHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2 + 1,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Determine colors from CSS custom properties
    const isDark = document.body.classList.contains('dark-mode');
    const dotColor = isDark ? 'rgba(168,150,255,' : 'rgba(122,92,255,';
    const lineColor = isDark ? 'rgba(0,230,255,' : 'rgba(122,92,255,';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Bounce
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // Mouse repulsion
      const dx = p.x - MOUSE.x;
      const dy = p.y - MOUSE.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        p.x += (dx / dist) * force * 2;
        p.y += (dy / dist) * force * 2;
      }

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dotColor + '0.6)';
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const ddx = p.x - q.x;
        const ddy = p.y - q.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < CONNECT_DIST) {
          const alpha = ((1 - d / CONNECT_DIST) * 0.35).toFixed(3);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = lineColor + alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  // Track mouse over hero
  canvas.closest('.hero').addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    MOUSE.x = e.clientX - rect.left;
    MOUSE.y = e.clientY - rect.top;
  });
  canvas.closest('.hero').addEventListener('mouseleave', () => {
    MOUSE.x = -9999;
    MOUSE.y = -9999;
  });

  // Reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resize();
  createParticles();
  if (!prefersReduced) draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
})();


// ===== 2. Animated Stats Counter =====
(function () {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const duration = 2000; // ms

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }

    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => io.observe(c));
})();


// ===== 3. Card Shine (mouse-following spotlight) =====
(function () {
  const cards = document.querySelectorAll('.card-shine');
  if (!cards.length) return;

  cards.forEach((shine) => {
    const card = shine.closest('.card');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });
})();


// ===== 4. 3D Tilt Effect on Cards =====
(function () {
  const tiltCards = document.querySelectorAll('.tilt-card');
  if (!tiltCards.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Don't tilt on touch devices (avoids jank)
  if ('ontouchstart' in window) return;

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6; // max 6deg
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


// ===== 5. Smooth parallax on orbs =====
(function () {
  const orbs = document.querySelectorAll('.hero-orb');
  if (!orbs.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      orbs.forEach((orb, i) => {
        const speed = 0.15 + i * 0.08;
        orb.style.transform = `translateY(${y * speed}px)`;
      });
    },
    { passive: true }
  );
})();
