/**
 * CSAI Events Calendar Rendering Script
 * 
 * Features:
 * - Loads events from window.CSAI_EVENTS or data/events.json
 * - Renders a semantic, responsive 7-column month grid
 * - Generates direct Google Calendar add links on event pill click
 * - Preserves visual theme with smooth hover states and stable layout
 */

(function () {
  'use strict';

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper to zero-pad numbers
  function pad(num) {
    return String(num).padStart(2, '0');
  }

  // Parse 12-hour or 24-hour time string (e.g. "12:00 PM", "11:30 AM", "13:30")
  function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3] ? match[3].toUpperCase() : null;

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  // Format a Date object to Google Calendar UTC string (YYYYMMDDTHHMMSSZ)
  function formatIsoForGCal(date) {
    return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  }

  // Format a date string (YYYY-MM-DD) to Google Calendar Date string (YYYYMMDD)
  function formatDateOnlyForGCal(dateStr) {
    return dateStr.replace(/-/g, '');
  }

  // Normalize an event object into standard calendar format
  function normalizeEvent(raw) {
    if (!raw || !raw.date || !raw.title) return null;

    const dateParts = raw.date.split('-').map(n => parseInt(n, 10));
    if (dateParts.length !== 3 || isNaN(dateParts[0]) || isNaN(dateParts[1]) || isNaN(dateParts[2])) {
      return null;
    }

    const [year, month, day] = dateParts;
    const startTimeParsed = parseTime(raw.startTime);

    let isAllDay = !startTimeParsed;
    let gStart = '';
    let gEnd = '';
    let displayTime = '';

    if (isAllDay) {
      // All day event format: YYYYMMDD/YYYYMMDD (next day exclusive for Google Calendar)
      const startGCal = formatDateOnlyForGCal(raw.date);
      const nextDay = new Date(year, month - 1, day + 1);
      const nextDayStr = `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`;
      const endGCal = formatDateOnlyForGCal(nextDayStr);

      gStart = startGCal;
      gEnd = endGCal;
      displayTime = 'All Day';
    } else {
      const startDate = new Date(year, month - 1, day, startTimeParsed.hours, startTimeParsed.minutes, 0);
      let endDate;

      const endTimeParsed = parseTime(raw.endTime);
      if (endTimeParsed) {
        endDate = new Date(year, month - 1, day, endTimeParsed.hours, endTimeParsed.minutes, 0);
        if (endDate <= startDate) {
          // If ends past midnight, add 1 day
          endDate = new Date(year, month - 1, day + 1, endTimeParsed.hours, endTimeParsed.minutes, 0);
        }
      } else {
        // Default duration: 1 hour
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }

      gStart = formatIsoForGCal(startDate);
      gEnd = formatIsoForGCal(endDate);
      displayTime = raw.startTime;
      if (raw.endTime) {
        displayTime = `${raw.startTime} – ${raw.endTime}`;
      }
    }

    // Build Google Calendar template link
    const gCalUrl = new URL('https://calendar.google.com/calendar/render');
    gCalUrl.searchParams.set('action', 'TEMPLATE');
    gCalUrl.searchParams.set('text', raw.title);
    gCalUrl.searchParams.set('dates', `${gStart}/${gEnd}`);
    if (raw.description) {
      gCalUrl.searchParams.set('details', raw.description);
    }
    if (raw.location) {
      gCalUrl.searchParams.set('location', raw.location);
    }

    return {
      title: raw.title,
      date: raw.date,
      startTime: raw.startTime || '',
      endTime: raw.endTime || '',
      location: raw.location || '',
      description: raw.description || '',
      displayTime,
      isAllDay,
      gCalUrl: gCalUrl.toString()
    };
  }

  // Load events from window.CSAI_EVENTS or fetch data/events.json
  async function loadEventsData() {
    if (Array.isArray(window.CSAI_EVENTS) && window.CSAI_EVENTS.length > 0) {
      return window.CSAI_EVENTS;
    }
    try {
      const response = await fetch('data/events.json', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Could not fetch data/events.json, checking global fallback', e);
    }
    return window.CSAI_EVENTS || [];
  }

  // Initialize calendar when DOM is ready
  async function initCalendar() {
    const calEl = document.getElementById('calendar');
    if (!calEl) return;

    const headerTitle = calEl.querySelector('.cal-title');
    const grid = calEl.querySelector('.cal-grid');
    const prevBtn = calEl.querySelector('[data-cal-prev]');
    const nextBtn = calEl.querySelector('[data-cal-next]');

    const rawEvents = await loadEventsData();
    const normalizedEvents = rawEvents
      .map(normalizeEvent)
      .filter(Boolean);

    // Group events by "YYYY-MM-DD"
    const eventsByDate = {};
    normalizedEvents.forEach(ev => {
      if (!eventsByDate[ev.date]) {
        eventsByDate[ev.date] = [];
      }
      eventsByDate[ev.date].push(ev);
    });

    // Calendar state: start at current month
    let viewDate = new Date();
    viewDate.setDate(1);

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function render() {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();

      // Update header title (e.g. "September 2026")
      if (headerTitle) {
        headerTitle.textContent = viewDate.toLocaleString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      }

      // Calculate grid constraints
      const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

      // Clear grid
      grid.innerHTML = '';

      // 1. Render Weekday Header Row (Black header row)
      weekdayNames.forEach(name => {
        const headerCell = document.createElement('div');
        headerCell.className = 'cal-cell cal-weekday-header';
        headerCell.setAttribute('role', 'columnheader');
        headerCell.innerHTML = `<span>${name}</span>`;
        grid.appendChild(headerCell);
      });

      // 2. Render Blank Leading Cells before the 1st
      for (let i = 0; i < firstDayWeekday; i++) {
        const blankCell = document.createElement('div');
        blankCell.className = 'cal-cell cal-cell-blank';
        blankCell.setAttribute('aria-hidden', 'true');
        grid.appendChild(blankCell);
      }

      // 3. Render Month Day Cells
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'cal-cell cal-day-cell';
        dayCell.setAttribute('role', 'gridcell');

        const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
        const daysEvents = eventsByDate[dateKey] || [];

        // Day number
        const dayNumberEl = document.createElement('div');
        dayNumberEl.className = 'cal-day';
        dayNumberEl.textContent = day;
        dayCell.appendChild(dayNumberEl);

        // Events list container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'cal-events';

        daysEvents.forEach(ev => {
          const pill = document.createElement('a');
          pill.className = 'cal-pill';
          pill.href = ev.gCalUrl;
          pill.target = '_blank';
          pill.rel = 'noopener noreferrer';
          pill.title = `${ev.title} (${ev.displayTime}) — Click to add to Google Calendar`;

          pill.innerHTML = `
            <span class="cal-pill-title">${escapeHtml(ev.title)}</span>
            <strong class="cal-pill-time">${escapeHtml(ev.displayTime)}</strong>
          `;

          eventsContainer.appendChild(pill);
        });

        dayCell.appendChild(eventsContainer);
        grid.appendChild(dayCell);
      }
    }

    // Navigation event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        render();
      });
    }

    // Initial render
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
  } else {
    initCalendar();
  }
})();
