// Updated fetch and event linking for Google Calendar popup
(async function() {
  const calendarId = "c4769cf5e094f410896fe0672353e6cfcbc5caa1c173a4aca481c41463da0e7d@group.calendar.google.com";
  const apiKey = "AIzaSyCz4WpkbLSLDxRJV8XoUIayrmbAtEC6wnI";

  async function fetchEvents() {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&singleEvents=true&orderBy=startTime&timeMin=${new Date().toISOString()}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log(data); // Check what is returned

    if (!data.items) return [];

    return data.items.map(ev => {
      const isAllDay = !!ev.start.date; // Detect all-day events
      return {
        id: ev.id,
        htmlLink: ev.htmlLink,
        title: ev.summary || '',
        description: ev.description || '',
        location: ev.location || '',
        startISO: isAllDay ? ev.start.date : ev.start.dateTime,
        endISO: isAllDay ? ev.end.date : ev.end.dateTime,
        isAllDay
      };
    });
  }

  // Function to format date/time for Google Calendar link
  function formatForGoogleCalendar(isoString, isAllDay) {
    if (isAllDay) {
      // All-day event: YYYYMMDD
      return isoString.replace(/-/g, '');
    } else {
      // Timed event: YYYYMMDDTHHMMSSZ
      return new Date(isoString).toISOString().replace(/[-:]|\.\d{3}/g, '');
    }
  }

  const events = await fetchEvents();

  const calEl = document.getElementById('calendar');
  if (!calEl) return;

  const headerTitle = calEl.querySelector('.cal-title');
  const grid = calEl.querySelector('.cal-grid');
  const prevBtn = calEl.querySelector('[data-cal-prev]');
  const nextBtn = calEl.querySelector('[data-cal-next]');

  let view = new Date();
  view.setDate(1);

  function pad(n){ return String(n).padStart(2,'0'); }
  function localDateKeyFromDate(d){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function localDateKeyFromISO(iso, isAllDay){
    // if Google returned a date-only string for all-day events, use it directly
    if (isAllDay && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    return localDateKeyFromDate(new Date(iso));
  }

  const byDay = events.reduce((acc, ev) => {
    const day = localDateKeyFromISO(ev.startISO, ev.isAllDay);
    (acc[day] = acc[day] || []).push(ev);
    return acc;
  }, {});

  function render() {
    const month = view.getMonth();
    const year = view.getFullYear();
    headerTitle.textContent = view.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    names.forEach(n => {
      const head = document.createElement('div');
      head.className = 'cal-cell';
      head.style.minHeight = 'auto';
      head.innerHTML = `<strong>${n}</strong>`;
      grid.appendChild(head);
    });

    for (let i = 0; i < startWeekday; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-cell';
      grid.appendChild(blank);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      const dateObj = new Date(year, month, d);
      const dayKey = localDateKeyFromDate(dateObj);

      cell.innerHTML = `<div class="cal-day">${d}</div><div class="cal-events"></div>`;
      const wrap = cell.querySelector('.cal-events');

      (byDay[dayKey] || []).forEach(ev => {
        const a = document.createElement('a');
        a.className = 'cal-pill';
        a.title = ev.title;

        const displayTime = ev.isAllDay
          ? 'All Day'
          : new Date(ev.startISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        a.textContent = `${ev.title} (${displayTime})`;

        // Use formatted start/end for Google Calendar
        const gStart = formatForGoogleCalendar(ev.startISO, ev.isAllDay);
        const gEnd = formatForGoogleCalendar(ev.endISO, ev.isAllDay);
        const gTitle = encodeURIComponent(ev.title);
        const gDesc = encodeURIComponent(ev.description);
        const gLoc = encodeURIComponent(ev.location);

        a.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&details=${gDesc}&location=${gLoc}&dates=${gStart}/${gEnd}`;
        a.target = '_blank';
        wrap.appendChild(a);
      });

      grid.appendChild(cell);
    }
  }

  prevBtn.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); render(); });
  nextBtn.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); render(); });

  render();
})();
