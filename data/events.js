/**
 * =============================================================================
 * CSAI CLUB EVENTS DATA SOURCE
 * =============================================================================
 * 
 * Future Officers & Organizers:
 * This file is the ONLY place you need to edit to add, remove, or change events
 * on the CSAI website calendar (events.html). You do NOT need to modify any
 * HTML or rendering code.
 * 
 * -----------------------------------------------------------------------------
 * HOW TO ADD A NEW EVENT:
 * -----------------------------------------------------------------------------
 * Add a new JavaScript object inside the `window.CSAI_EVENTS` array below
 * using this format:
 * 
 * {
 *   "title": "Name of Event",        // (Required) Event title displayed on calendar
 *   "date": "2026-09-15",            // (Required) Date in YYYY-MM-DD format
 *   "startTime": "12:00 PM",         // (Optional) e.g. "12:00 PM" or "11:30 AM". Use null or omit for All Day.
 *   "endTime": "1:00 PM",            // (Optional) e.g. "1:30 PM" or "3:30 PM". Set to null if there is no set end time (defaults to 1 hr).
 *   "location": "Room 101 / Online", // (Optional) Room number or virtual link
 *   "description": ""                // (Optional) Brief description for Google Calendar details
 * }
 * 
 * Tip: Ensure dates use 2-digit months and days (e.g. "2026-09-08", not "2026-9-8").
 * =============================================================================
 */

window.CSAI_EVENTS = [
  {
    "title": "Sprinternship Informational Session",
    "date": "2026-09-08",
    "startTime": "12:00 PM",
    "endTime": null,
    "location": "",
    "description": "Learn about the Sprinternship opportunity and how to apply."
  },
  {
    "title": "Club Meeting",
    "date": "2026-09-15",
    "startTime": "12:00 PM",
    "endTime": null,
    "location": "",
    "description": "CSAI general club meeting and project updates."
  },
  {
    "title": "Club Day",
    "date": "2026-09-22",
    "startTime": "11:30 AM",
    "endTime": "3:30 PM",
    "location": "Campus Center",
    "description": "Visit the CSAI table at Club Day to learn more about our AI initiatives and upcoming events!"
  },
  {
    "title": "NY Creates Internship Info Session",
    "date": "2026-09-29",
    "startTime": "12:45 PM",
    "endTime": "1:30 PM",
    "location": "",
    "description": "Information session with NY Creates discussing internship opportunities in tech and semiconductors."
  }
];
