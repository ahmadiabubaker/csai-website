// Updated fetch to load events for the currently viewed month (past and future) and event linking for Google Calendar popup
(async function() {
  const calendarId = "c4769cf5e094f410896fe0672353e6cfcbc5caa1c173a4aca481c41463da0e7d@group.calendar.google.com";
  const apiKey = "AIzaSyCz4WpkbLSLDxRJV8XoUIayrmbAtEC6wnI";

  // Fetch strategy:
  // - 'byMonth': fetch only the current view month
  // - 'window': fetch a window of months around the current view
  // - 'all': fetch entire calendar (paginated) — can be heavy on large calendars
  // Default to a wider window for convenience: 1 year past, 2 years future
  const FETCH_STRATEGY = 'window'; // change to 'byMonth' or 'all' if desired
  const WINDOW_PAST_MONTHS = 12;   // months before the view month
  const WINDOW_FUTURE_MONTHS = 24; // months after the view month

  // Simple caches
  // per-month cache so we don't re-fetch when navigating back
  const monthCache = {}; // key: YYYY-MM -> [events]
  // cache for a window range
  let windowCacheKey = null; // `${startISO}_${endISO}`
  let windowCacheEvents = null;
  // cache for all-events fetch
  let allEventsCache = null;

  // Build start (inclusive) and end (exclusive) RFC3339 timestamps for a given month in local time
  function getMonthRange(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    // Google Calendar API treats timeMax as exclusive, so use the first day of the next month at 00:00
    const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }

  function monthKeyFromDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  async function fetchEventsForRange(startISO, endISO) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(startISO)}&timeMax=${encodeURIComponent(endISO)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map(ev => {
      const isAllDay = !!ev.start?.date; // Detect all-day events
      return {
        id: ev.id,
        htmlLink: ev.htmlLink,
        title: ev.summary || '',
        description: ev.description || '',
        location: ev.location || '',
        // For all-day, Google returns date-only (YYYY-MM-DD). For timed events, dateTime.
        startISO: isAllDay ? ev.start.date : ev.start.dateTime,
        endISO: isAllDay ? ev.end?.date : ev.end?.dateTime,
        isAllDay
      };
    });
  }

  async function fetchAllEvents() {
    if (allEventsCache) return allEventsCache;
    const startISO = new Date(1970, 0, 1).toISOString();
    const endISO = new Date(2100, 0, 1).toISOString();
    const base = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&singleEvents=true&orderBy=startTime&maxResults=2500&timeMin=${encodeURIComponent(startISO)}&timeMax=${encodeURIComponent(endISO)}`;
    let pageToken = undefined;
    let all = [];
    do {
      const url = pageToken ? `${base}&pageToken=${encodeURIComponent(pageToken)}` : base;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items && data.items.length) {
        const mapped = data.items.map(ev => {
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
        all = all.concat(mapped);
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    allEventsCache = all;
    return allEventsCache;
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

  function getWindowRange(date, pastMonths, futureMonths) {
    const start = new Date(date.getFullYear(), date.getMonth() - pastMonths, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + futureMonths + 1, 1);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }

  async function getEventsForView(date) {
    if (FETCH_STRATEGY === 'all') {
      return await fetchAllEvents();
    }
    if (FETCH_STRATEGY === 'window') {
      const { startISO, endISO } = getWindowRange(date, WINDOW_PAST_MONTHS, WINDOW_FUTURE_MONTHS);
      const key = `${startISO}_${endISO}`;
      if (windowCacheKey === key && windowCacheEvents) return windowCacheEvents;
      const events = await fetchEventsForRange(startISO, endISO);
      windowCacheKey = key;
      windowCacheEvents = events;
      return events;
    }
    // default: byMonth
    const key = monthKeyFromDate(date);
    if (monthCache[key]) return monthCache[key];
    const { startISO, endISO } = getMonthRange(date);
    const events = await fetchEventsForRange(startISO, endISO);
    monthCache[key] = events;
    return events;
  }

  async function render() {
    const month = view.getMonth();
    const year = view.getFullYear();
    headerTitle.textContent = view.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    // Simple loading state
    grid.innerHTML = '<div class="cal-cell" style="grid-column: 1 / -1; min-height:auto; text-align:center; padding:12px;">Loading events…</div>';

    const firstDay = new Date(year, month, 1);
  // Use JS weekday (0 = Sunday) so calendar columns are Sun..Sat
  const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Header names starting with Sunday
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    // Fetch events for this month while we prepare DOM
  const events = await getEventsForView(view);
    // Group by local day key
    const byDay = events.reduce((acc, ev) => {
      const day = localDateKeyFromISO(ev.startISO, ev.isAllDay);
      (acc[day] = acc[day] || []).push(ev);
      return acc;
    }, {});

    grid.innerHTML = '';
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
        const gDesc = encodeURIComponent(ev.description);
        const gLoc = encodeURIComponent(ev.location);

        a.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&details=${gDesc}&location=${gLoc}&dates=${gStart}/${gEnd}`;
        a.target = '_blank';
        wrap.appendChild(a);
      });

      grid.appendChild(cell);
    }
  }

  prevBtn.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); void render(); });
  nextBtn.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); void render(); });

  void render();
})();
