
// Scroll-linked side navigation for index page
const sideDots = document.querySelectorAll('.side-dot');
if (sideDots.length){
  const targets = [...sideDots].map(d => document.querySelector(d.getAttribute('href')));
  let active = 0;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        const i = targets.indexOf(e.target);
        if (i >= 0){
          sideDots[active]?.classList.remove('active');
          sideDots[i].classList.add('active');
          active = i;
        }
      }
    });
  }, { threshold: .6 });
  targets.forEach(t => t && obs.observe(t));

  sideDots.forEach(d => {
    d.addEventListener('click', (ev) => {
      ev.preventDefault();
      const el = document.querySelector(d.getAttribute('href'));
      el && el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

// Parallax accents
document.querySelectorAll('[data-parallax]').forEach(el => {
  const strength = parseFloat(el.dataset.parallax) || 10;
  window.addEventListener('mousemove', (e) => {
    const { innerWidth:w, innerHeight:h } = window;
    const x = (e.clientX - w/2) / (w/2);
    const y = (e.clientY - h/2) / (h/2);
    el.style.transform = `translate(${x*strength}px, ${y*strength}px)`;
  }, { passive:true });
});

// Utility: format date for Google Calendar link
function googleCalendarUrl(ev){
  // ev: {title, description, location, startISO, endISO}
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

// Expose for events.js
window.CSAI = { googleCalendarUrl };
