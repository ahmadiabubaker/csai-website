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
