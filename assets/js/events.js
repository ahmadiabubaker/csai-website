<!-- Include rrule.js library -->
<script src="https://cdn.jsdelivr.net/npm/rrule@2.7.1/dist/es5/rrule.min.js"></script>

<script>
(async function(){
  // ---- CONFIG: Add your calendar info here ----
  const calendarId = "c4769cf5e094f410896fe0672353e6cfcbc5caa1c173a4aca481c41463da0e7d@group.calendar.google.com";
  const apiKey = "AIzaSyCz4WpkbLSLDxRJV8XoUIayrmbAtEC6wnI"; // Replace with your Google API key

  // ---- FETCH EVENTS FROM GOOGLE CALENDAR ----
  async function fetchEvents() {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&singleEvents=false&orderBy=startTime&timeMin=${new Date().toISOString()}`;
    const res = await fetch(url);
    const data = await res.json();

    const allEvents = [];

    for(const ev of data.items){
      // Single/non-recurring events
      if(!ev.recurrence){
        allEvents.push({
          title: ev.summary || "",
          description: ev.description || "",
          location: ev.location || "",
          startISO: ev.start.dateTime || ev.start.date,
          endISO: ev.end.dateTime || ev.end.date
        });
      } else {
        // Recurring events
        const rruleText = ev.recurrence[0]; // typically contains the RRULE
        const rruleOptions = RRule.parseString(rruleText.replace("RRULE:", ""));
        rruleOptions.dtstart = new Date(ev.start.dateTime || ev.start.date);
        const rule = new RRule(rruleOptions);

        // Expand occurrences until the end of the current year
        const occurrences = rule.between(new Date(), new Date(new Date().getFullYear(), 11, 31), true);

        occurrences.forEach(dt => {
          // calculate duration
          const start = new Date(dt);
          const end = new Date(start.getTime() + (new Date(ev.end.dateTime || ev.end.date) - new Date(ev.start.dateTime || ev.start.date)));
          allEvents.push({
            title: ev.summary || "",
            description: ev.description || "",
            location: ev.location || "",
            startISO: start.toISOString(),
            endISO: end.toISOString()
          });
        });
      }
    }

    return allEvents;
  }

  const events = await fetchEvents();

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
        // Optional: link to Google Calendar event
        a.href = `https://www.google.com/calendar/event?eid=${btoa(ev.title)}`;
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
</script>
