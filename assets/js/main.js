// ===== Scroll rail + active section =====
(function(){
  const rail = document.querySelector('.side-rail');
  if(!rail) return;

  const items = [...rail.querySelectorAll('.rail-item')];
  const targets = items.map(i => document.querySelector(i.getAttribute('href'))).filter(Boolean);
  const progress = rail.querySelector('.rail-progress');

  // Smooth click
  items.forEach(i => {
    i.addEventListener('click', e => {
      e.preventDefault();
      const el = document.querySelector(i.getAttribute('href'));
      el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Active section by viewport center
  function setActive() {
    const mid = window.innerHeight * 0.5;
    let bestIdx = 0, bestDist = Infinity;
    targets.forEach((t, idx) => {
      const r = t.getBoundingClientRect();
      const center = r.top + r.height/2;
      const d = Math.abs(center - mid);
      if(d < bestDist){ bestDist = d; bestIdx = idx; }
    });
    items.forEach(i => i.classList.remove('active'));
    items[bestIdx]?.classList.add('active');
  }

  // Rail progress (overall page scroll)
  function setProgress() {
    const doc = document.documentElement;
    const h = doc.scrollHeight - window.innerHeight;
    const y = window.scrollY || doc.scrollTop || 0;
    const pct = Math.max(0, Math.min(1, h ? y / h : 0));
    if(progress) progress.style.height = (pct * 100) + '%';
  }

  const onScroll = () => { setActive(); setProgress(); };
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

// ===== Reveal on view =====
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
})();

// ===== Google Calendar URL =====
function googleCalendarUrl(ev){
  function fmt(d){ return d.replace(/[-:]/g,'').split('.')[0] + 'Z'; }
  const params = new URLSearchParams({
    action:'TEMPLATE',
    text: ev.title || 'CSAI Event',
    dates: `${fmt(ev.startISO)}/${fmt(ev.endISO)}`,
    details: ev.description || '',
    location: ev.location || ''
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
window.CSAI = { googleCalendarUrl };

// ===== Footer injection (common footer across pages) =====
(function(){
  const footer = document.querySelector('footer.footer');
  if(!footer) return;

  const html = `
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-col footer-brand">
          <div class="footer-brand-row">
            <img class="footer-logo" src="data/photos/logo.png" alt="CSAI logo" />
            <div>
              <div class="footer-title">CSAI — Computer Science + AI Club</div>
              <div class="footer-tag">Projects • Workshops • Community</div>
            </div>
          </div>
        </div>
        <div class="footer-col">
          <h4>Pages</h4>
          <ul class="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="about.html">About</a></li>
            <li><a href="projects.html">Projects</a></li>
            <li><a href="learning.html">Learning</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="internships.html">Internships</a></li>
            <li><a href="blog.html">Blog</a></li>
            <li><a href="join.html">Join</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul class="footer-links">
                    <li>Email: <a href="mailto:admin@csai.club">admin@csai.club</a></li>
                    <li>Location: Mercer County Community College, NJ</li>
            <li><a href="unsubscribe.html">Unsubscribe</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Follow</h4>
          <div class="social-links">
            <a href="https://github.com/your-org" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.2 3.4 9.5 8 11 .6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1 1.7-.7 2-1.1-.9-.1-1.8-.5-2.3-1.3-.5-.8-.6-1.8-.3-2.6 0 0 .7-.2 2.4.9.7-.2 1.5-.3 2.3-.3s1.6.1 2.3.3c1.7-1.1 2.4-.9 2.4-.9.3.8.2 1.8-.3 2.6-.6.8-1.4 1.2-2.3 1.3.5.5.9 1.3.9 2.1v3.1c0 .3.2.7.8.6 4.6-1.5 8-5.8 8-11A11.5 11.5 0 0 0 12 .5z"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/your-org" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.6c0-1.34 0-3.06-1.87-3.06s-2.15 1.46-2.15 2.96v5.7H9.3V9h3.42v1.56h.05c.48-.91 1.66-1.87 3.42-1.87 3.66 0 4.34 2.41 4.34 5.54v6.22zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.5 0H1.5C.67 0 0 .67 0 1.5v21c0 .83.67 1.5 1.5 1.5h21c.83 0 1.5-.67 1.5-1.5v-21C24 .67 23.33 0 22.5 0z"/></svg>
            </a>
            <a href="https://x.com/your-org" target="_blank" rel="noopener" aria-label="X" title="X">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M13.9 10.5 21.6 2h-1.8l-6.6 7.4L8 2H2l8.2 12-7.7 8h1.8l6.9-7.7 5.6 7.7H22l-8.1-11.5Zm-2.4 2.6-.8-1.2L4.2 3.4H7l4 5.6.8 1.2 6.9 9.7h-2.8l-4.4-6.8Z"/></svg>
            </a>
            <a href="https://instagram.com/your-org" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M12 2.2c3 0 3.4 0 4.7.1 1.3.1 2 .3 2.5.6.6.3 1 .7 1.5 1.2.5.5.9.9 1.2 1.5.3.5.5 1.2.6 2.5.1 1.3.1 1.7.1 4.7s0 3.4-.1 4.7c-.1 1.3-.3 2-.6 2.5-.3.6-.7 1-1.2 1.5-.5.5-.9.9-1.5 1.2-.5.3-1.2.5-2.5.6-1.3.1-1.7.1-4.7.1s-3.4 0-4.7-.1c-1.3-.1-2-.3-2.5-.6-.6-.3-1-.7-1.5-1.2-.5-.5-.9-.9-1.2-1.5-.3-.5-.5-1.2-.6-2.5C2.2 15.4 2.2 15 2.2 12s0-3.4.1-4.7c.1-1.3.3-2 .6-2.5.3-.6.7-1 1.2-1.5.5-.5.9-.9 1.5-1.2.5-.3 1.2-.5 2.5-.6C8.6 2.2 9 2.2 12 2.2Zm0 1.8c-2.9 0-3.3 0-4.5.1-1.1.1-1.7.2-2 .4-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.2.3-.3.9-.4 2-.1 1.2-.1 1.6-.1 4.5s0 3.3.1 4.5c.1 1.1.2 1.7.4 2 .2.5.4.8.8 1.2.4.4.7.6 1.2.8.3.2.9.3 2 .4 1.2.1 1.6.1 4.5.1s3.3 0 4.5-.1c1.1-.1 1.7-.2 2-.4.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.3.3-.9.4-2 .1-1.2.1-1.6.1-4.5s0-3.3-.1-4.5c-.1-1.1-.2-1.7-.4-2-.2-.5-.4-.8-.8-1.2-.4-.4-.7-.6-1.2-.8-.3-.2-.9-.3-2-.4-1.2-.1-1.6-.1-4.5-.1Zm0 3.3A5.7 5.7 0 1 1 6.3 13 5.7 5.7 0 0 1 12 7.3Zm0 9.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Zm5.9-10.3a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0Z"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div class="legal">© 2025 CSAI — Computer Science + AI Club</div>
    </div>`;

  footer.innerHTML = html;
})();
