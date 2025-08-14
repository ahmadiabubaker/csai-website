
(async function(){
  const res = await fetch('data/events.json');
  const events = await res.json();

  const calEl = document.getElementById('calendar');
  if(!calEl) return;

  const headerTitle = calEl.querySelector('.cal-title');
  const grid = calEl.querySelector('.cal-grid');
  const prevBtn = calEl.querySelector('[data-cal-prev]');
  const nextBtn = calEl.querySelector('[data-cal-next]');
  const legend = calEl.querySelector('.cal-legend');

  let view = new Date();
  view.setDate(1);

  function key(d){ return d.toISOString().slice(0,10); }
  const byDay = events.reduce((acc, ev) => {
    const start = new Date(ev.startISO);
    const day = key(start);
    (acc[day] = acc[day] || []).push(ev);
    return acc;
  }, {});

  function render(){
    const month = view.getMonth();
    const year = view.getFullYear();
    headerTitle.textContent = view.toLocaleString(undefined,{month:'long', year:'numeric'});

    grid.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay()+6)%7; // make Monday=0
    const daysInMonth = new Date(year, month+1, 0).getDate();

    // Weekday headers
    const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    names.forEach(n => {
      const head = document.createElement('div');
      head.className = 'cal-cell';
      head.style.minHeight='auto';
      head.innerHTML = `<strong>${n}</strong>`;
      grid.appendChild(head);
    });

    // Leading blanks
    for(let i=0;i<startWeekday;i++){
      const blank = document.createElement('div'); blank.className = 'cal-cell'; grid.appendChild(blank);
    }
    // Days
    for(let d=1; d<=daysInMonth; d++){
      const cell = document.createElement('div'); cell.className='cal-cell';
      const dateObj = new Date(year, month, d);
      const dayKey = key(dateObj);
      cell.innerHTML = `<div class="cal-day">${d}</div><div class="cal-events"></div>`;
      const wrap = cell.querySelector('.cal-events');
      (byDay[dayKey]||[]).forEach(ev => {
        const a = document.createElement('a');
        a.className = 'cal-pill';
        a.title = ev.title;
        a.textContent = ev.title;
        a.href = CSAI.googleCalendarUrl(ev);
        a.target = '_blank';
        wrap.appendChild(a);
      });
      grid.appendChild(cell);
    }
  }

  prevBtn.addEventListener('click', ()=> { view.setMonth(view.getMonth()-1); render(); });
  nextBtn.addEventListener('click', ()=> { view.setMonth(view.getMonth()+1); render(); });

  render();

  // Legend
  legend.innerHTML = `<span class="legend-dot"></span> Upcoming CSAI events`;
})();
