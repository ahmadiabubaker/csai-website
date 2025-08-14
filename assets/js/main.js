// Smoothly highlight the active nav link while scrolling
(function(){
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (!links.length) return;

  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  };

  // IntersectionObserver to mark active by section in view
  const io = new IntersectionObserver((entries) => {
    // Choose the entry with the largest intersection ratio near viewport center
    const mid = window.innerHeight * 0.5;
    let best = null;
    for (const e of entries) {
      const r = e.target.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { best = e; break; }
      if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
    }
    if (best && best.isIntersecting) setActive(best.target.id);
  }, { threshold: [0.15, 0.6, 0.9] });

  sections.forEach(s => io.observe(s));
})();

// Contact modal: keep ARIA in sync, close on ESC / backdrop click, and trap focus
(function(){
  const toggle = document.getElementById('contact-toggle');
  const modal  = document.getElementById('contact-modal');
  const openBtn = document.querySelector('.contact-btn');

  if (!toggle || !modal || !openBtn) return;

  const focusableSel = 'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])';

  function syncAria(){
    const open = toggle.checked;
    modal.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      // focus first field
      const first = modal.querySelector(focusableSel);
      first && first.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      openBtn.focus();
    }
  }

  // Backdrop click closes
  modal.addEventListener('click', (e) => {
    if (e.target === modal) { toggle.checked = false; syncAria(); }
  });

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.checked) {
      toggle.checked = false; syncAria();
    }
  });

  // Simple focus trap
  modal.addEventListener('keydown', (e) => {
    if (!toggle.checked || e.key !== 'Tab') return;
    const nodes = [...modal.querySelectorAll(focusableSel)].filter(el => !el.hasAttribute('disabled'));
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Keep ARIA in sync when checkbox changes (label click)
  toggle.addEventListener('change', syncAria);

  // On load
  syncAria();
})();
