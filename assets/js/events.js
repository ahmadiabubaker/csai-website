// Updated fetch to load events for the currently viewed month (past and future) and event linking for Google Calendar popup
(async function() {
  const calendarId = "c4769cf5e094f410896fe0672353e6cfcbc5caa1c173a4aca481c41463da0e7d@group.calendar.google.com";
  const apiKey = "AIzaSyCz4WpkbLSLDxRJV8XoUIayrmbAtEC6wnI";

  // Function to format date/time for Google Calendar link
  function formatForGoogleCalendar(isoString, isAllDay) {
    if (isAllDay) {
      // All-day event: YYYYMMDD
      return isoString.replace(/-/g, '').slice(0, 8);
    } else {
      // Timed event: YYYYMMDDTHHMMSSZ
      return new Date(isoString).toISOString().replace(/[-:]|\.\d{3}/g, '');
    }
  }

  // Expand recurring events across a date range
  function expandRecurringEvents(rawEvents, rangeStart, rangeEnd) {
    const all = [];
    rawEvents.forEach(ev => {
      if (!ev.recurrence) {
        all.push({
          id: ev.id,
          htmlLink: ev.htmlLink,
          title: ev.title || ev.summary || '',
          description: ev.description || '',
          location: ev.location || '',
          startISO: ev.startISO || (ev.start?.dateTime || ev.start?.date),
          endISO: ev.endISO || (ev.end?.dateTime || ev.end?.date),
          isAllDay: !!(ev.isAllDay || ev.start?.date)
        });
        return;
      }

      const isAllDay = !!(ev.isAllDay || ev.start?.date);
      const start = new Date(ev.startISO || (ev.start?.dateTime || ev.start?.date));
      const end = new Date(ev.endISO || (ev.end?.dateTime || ev.end?.date || start));
      const duration = end.getTime() - start.getTime();

      if (ev.recurrence.frequency === 'weekly') {
        const interval = ev.recurrence.interval || 1;
        let curr = new Date(start.getTime());

        // Fast forward if start is far in the past
        if (curr < rangeStart) {
          const diffWeeks = Math.floor((rangeStart.getTime() - curr.getTime()) / (7 * 24 * 60 * 60 * 1000 * interval));
          if (diffWeeks > 0) {
            curr = new Date(curr.getTime() + diffWeeks * 7 * 24 * 60 * 60 * 1000 * interval);
          }
        }

        while (curr <= rangeEnd) {
          if (curr >= rangeStart) {
            const occStart = new Date(curr.getTime());
            const occEnd = new Date(curr.getTime() + duration);
            all.push({
              id: ev.id,
              htmlLink: ev.htmlLink,
              title: ev.title || ev.summary || '',
              description: ev.description || '',
              location: ev.location || '',
              startISO: occStart.toISOString(),
              endISO: occEnd.toISOString(),
              isAllDay
            });
          }
          curr = new Date(curr.getTime() + interval * 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        all.push({
          id: ev.id,
          htmlLink: ev.htmlLink,
          title: ev.title || ev.summary || '',
          description: ev.description || '',
          location: ev.location || '',
          startISO: start.toISOString(),
          endISO: end.toISOString(),
          isAllDay
        });
      }
    });
    return all;
  }

  // Load events from data/events.json or Google Calendar API
  async function fetchAllEvents() {
    // 1. Try local data/events.json first
    try {
      const res = await fetch('data/events.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const rangeStart = new Date(2024, 0, 1);
          const rangeEnd = new Date(2028, 11, 31);
          return expandRecurringEvents(data, rangeStart, rangeEnd);
        }
      }
    } catch (e) {
      console.warn('Could not load data/events.json:', e);
    }

    // 2. Fallback to Google Calendar API
    try {
      const startISO = new Date(2024, 0, 1).toISOString();
      const endISO = new Date(2028, 0, 1).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(startISO)}&timeMax=${encodeURIComponent(endISO)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items && data.items.length) {
        return data.items.map(ev => {
          const isAllDay = !!ev.start?.date;
          return {
            id: ev.id,
            htmlLink: ev.htmlLink,
            title: ev.summary || '',
            description: ev.description || '',
            location: ev.location || '',
            startISO: isAllDay ? ev.start.date : ev.start.dateTime,
            endISO: isAllDay ? ev.end?.date : ev.end?.dateTime,
            isAllDay
          };
        });
      }
    } catch (e) {
      console.warn('Could not fetch from Google Calendar API:', e);
    }

    return [];
  }

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

  const events = await fetchAllEvents();

  // Group by local day key
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
    // Use JS weekday (0 = Sunday) so calendar columns are Sun..Sat
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Header names starting with Sunday
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
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
        const gEnd = formatForGoogleCalendar(ev.endISO || ev.startISO, ev.isAllDay);
        const gTitle = encodeURIComponent(ev.title);
        const gDesc = encodeURIComponent(ev.description || '');
        const gLoc = encodeURIComponent(ev.location || '');

        a.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&details=${gDesc}&location=${gLoc}&dates=${gStart}/${gEnd}`;
        a.target = '_blank';
        wrap.appendChild(a);
      });

      grid.appendChild(cell);
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); render(); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); render(); });
  }

  render();
})();
