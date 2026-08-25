/**
 * CSAI — AI4BTP Faculty Consultation & Scheduler Logic
 * Handles interactive topic selection, calendar date & slot generation,
 * form submission, local booking persistence, and calendar export.
 */

document.addEventListener("DOMContentLoaded", function () {
  // State
  const state = {
    selectedTopic: "Curriculum & Course AI Integration",
    selectedMode: "In-Person (CSAI Lab)",
    selectedDate: null, // { dateString, displayDate, dayName }
    selectedTime: null,
  };

  // DOM Elements
  const topicChips = document.querySelectorAll(".topic-chip");
  const modalityBtns = document.querySelectorAll(".modality-btn");
  const dateChipsContainer = document.getElementById("date-chips-scroll");
  const timeSlotsContainer = document.getElementById("time-slots-grid");
  const selectedSlotText = document.getElementById("selected-slot-text");
  const bookingForm = document.getElementById("faculty-booking-form");
  const schedulerFormCard = document.getElementById("scheduler-form-card");
  const bookingConfirmedCard = document.getElementById("booking-confirmed-card");
  const resetBookingBtn = document.getElementById("reset-booking-btn");
  const addToCalBtn = document.getElementById("add-to-cal-btn");
  const addToGCalBtn = document.getElementById("add-to-gcal-btn");

  // 1. Generate Next 10 Business Days for Scheduler
  function generateAvailableDates() {
    const dates = [];
    const today = new Date();
    let current = new Date(today);
    // Start from tomorrow
    current.setDate(current.getDate() + 1);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    while (dates.length < 10) {
      const dayOfWeek = current.getDay();
      // Only Monday - Friday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");
        const dateString = `${yyyy}-${mm}-${dd}`;
        const displayDate = `${dayNames[dayOfWeek]}, ${monthNames[current.getMonth()]} ${current.getDate()}`;

        dates.push({
          dateString: dateString,
          displayDate: displayDate,
          dayName: dayNames[dayOfWeek],
          dayNum: current.getDate(),
          month: monthNames[current.getMonth()],
          monthIndex: current.getMonth(),
          year: yyyy,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Available Time Slots per day
  const defaultTimeSlots = [
    "10:00 AM - 10:45 AM",
    "11:30 AM - 12:15 PM",
    "1:00 PM - 1:45 PM",
    "2:30 PM - 3:15 PM",
    "4:00 PM - 4:45 PM",
  ];

  // Render Date Chips
  function renderDateChips() {
    if (!dateChipsContainer) return;
    dateChipsContainer.innerHTML = "";
    const dates = generateAvailableDates();

    dates.forEach((d, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `date-chip ${index === 0 ? "selected" : ""}`;
      chip.innerHTML = `
        <span class="date-day-name">${d.dayName}</span>
        <span class="date-day-num">${d.dayNum}</span>
        <span class="date-month">${d.month}</span>
      `;

      chip.addEventListener("click", () => {
        document
          .querySelectorAll(".date-chip")
          .forEach((c) => c.classList.remove("selected"));
        chip.classList.add("selected");
        state.selectedDate = d;
        renderTimeSlots(d);
        updateSummaryPill();
      });

      dateChipsContainer.appendChild(chip);

      // Auto-select the first date
      if (index === 0) {
        state.selectedDate = d;
      }
    });

    if (dates.length > 0) {
      renderTimeSlots(dates[0]);
    }
  }

  // Render Time Slots
  function renderTimeSlots(dateObj) {
    if (!timeSlotsContainer) return;
    timeSlotsContainer.innerHTML = "";

    defaultTimeSlots.forEach((slot, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `time-slot-btn ${index === 0 ? "selected" : ""}`;
      btn.textContent = slot;

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".time-slot-btn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.selectedTime = slot;
        updateSummaryPill();
      });

      timeSlotsContainer.appendChild(btn);

      // Auto-select first slot
      if (index === 0) {
        state.selectedTime = slot;
      }
    });

    updateSummaryPill();
  }

  // Topic Selection
  topicChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      topicChips.forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      state.selectedTopic = chip.dataset.topic || chip.textContent.trim();
      updateSummaryPill();
    });
  });

  // Modality Selection
  modalityBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modalityBtns.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.selectedMode = btn.dataset.mode || btn.textContent.trim();
      updateSummaryPill();
    });
  });

  // Update Summary Pill
  function updateSummaryPill() {
    if (!selectedSlotText) return;
    if (state.selectedDate && state.selectedTime) {
      selectedSlotText.innerHTML = `<strong>${state.selectedDate.displayDate}</strong> at <strong>${state.selectedTime}</strong> (${state.selectedMode}) — <em>${state.selectedTopic}</em>`;
    }
  }

  // Initialize Date and Slots
  renderDateChips();

  // Booking Form Submission
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const facultyName = document.getElementById("faculty-name")?.value.trim() || "Faculty Member";
      const facultyEmail = document.getElementById("faculty-email")?.value.trim() || "";
      const department = document.getElementById("faculty-dept")?.value.trim() || "Department";
      const courseOrProject = document.getElementById("faculty-course")?.value.trim() || "General Inquiry";
      const goals = document.getElementById("faculty-goals")?.value.trim() || "";

      // Generate Reference Code
      const refId = "AI4BTP-" + Math.floor(1000 + Math.random() * 9000);

      // Populate confirmation card
      const confRef = document.getElementById("conf-ref-id");
      const confTopic = document.getElementById("conf-topic");
      const confDate = document.getElementById("conf-date-time");
      const confMode = document.getElementById("conf-mode");
      const confFaculty = document.getElementById("conf-faculty-info");

      if (confRef) confRef.textContent = refId;
      if (confTopic) confTopic.textContent = state.selectedTopic;
      if (confDate && state.selectedDate && state.selectedTime) {
        confDate.textContent = `${state.selectedDate.displayDate} (${state.selectedTime})`;
      }
      if (confMode) {
        confMode.textContent = state.selectedMode.includes("Virtual")
          ? "Virtual Meeting (Google Meet link will be emailed to " + facultyEmail + ")"
          : "In-Person — Mercer Campus CSAI Lab (ET Bldg)";
      }
      if (confFaculty) {
        confFaculty.textContent = `${facultyName} (${department}) • ${facultyEmail}`;
      }

      // Store in localStorage
      try {
        const bookings = JSON.parse(localStorage.getItem("csai_ai4btp_bookings") || "[]");
        bookings.push({
          refId,
          facultyName,
          facultyEmail,
          department,
          courseOrProject,
          goals,
          topic: state.selectedTopic,
          mode: state.selectedMode,
          date: state.selectedDate?.dateString,
          displayDate: state.selectedDate?.displayDate,
          time: state.selectedTime,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("csai_ai4btp_bookings", JSON.stringify(bookings));
      } catch (err) {
        console.warn("Could not save to localStorage", err);
      }

      // Configure Calendar Links
      setupCalendarExports({
        title: `CSAI AI4BTP Consultation: ${state.selectedTopic}`,
        description: `Faculty AI Consultation with CSAI Club Students.\nTopic: ${state.selectedTopic}\nFaculty: ${facultyName} (${department})\nCourse/Project: ${courseOrProject}\nGoals: ${goals}\nReference: ${refId}`,
        location: state.selectedMode.includes("Virtual") ? "Google Meet" : "CSAI Lab, Mercer Campus",
        dateObj: state.selectedDate,
        timeSlot: state.selectedTime,
      });

      // Switch view
      if (schedulerFormCard && bookingConfirmedCard) {
        schedulerFormCard.style.display = "none";
        bookingConfirmedCard.classList.add("active");
        bookingConfirmedCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // Reset / Book Another Session
  if (resetBookingBtn) {
    resetBookingBtn.addEventListener("click", function () {
      if (bookingForm) bookingForm.reset();
      if (bookingConfirmedCard && schedulerFormCard) {
        bookingConfirmedCard.classList.remove("active");
        schedulerFormCard.style.display = "block";
        schedulerFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // Calendar Export Setup (.ics download and Google Calendar URL)
  function setupCalendarExports(eventData) {
    if (!eventData.dateObj || !eventData.timeSlot) return;

    // Parse start time
    const [startHourStr, endHourStr] = eventData.timeSlot.split(" - ");
    const startTimeParsed = parseTimeString(startHourStr, eventData.dateObj);
    const endTimeParsed = parseTimeString(endHourStr, eventData.dateObj);

    // Google Calendar URL
    if (addToGCalBtn) {
      const gcalStart = toGCalDate(startTimeParsed);
      const gcalEnd = toGCalDate(endTimeParsed);
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        eventData.title
      )}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(
        eventData.description
      )}&location=${encodeURIComponent(eventData.location)}`;

      addToGCalBtn.href = gcalUrl;
      addToGCalBtn.target = "_blank";
    }

    // ICS File Download
    if (addToCalBtn) {
      addToCalBtn.onclick = function (e) {
        e.preventDefault();
        const icsContent = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//CSAI Club//AI4BTP Scheduler//EN",
          "BEGIN:VEVENT",
          `UID:${Date.now()}@csai.club`,
          `DTSTAMP:${toGCalDate(new Date())}`,
          `DTSTART:${toGCalDate(startTimeParsed)}`,
          `DTEND:${toGCalDate(endTimeParsed)}`,
          `SUMMARY:${eventData.title}`,
          `DESCRIPTION:${eventData.description.replace(/\n/g, "\\n")}`,
          `LOCATION:${eventData.location}`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", "CSAI-AI4BTP-Session.ics");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }
  }

  function parseTimeString(timeStr, dateObj) {
    // e.g. "10:00 AM", "1:45 PM"
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const d = new Date(dateObj.year, dateObj.monthIndex || getMonthIndex(dateObj.month), dateObj.dayNum);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
    }
    return d;
  }

  function getMonthIndex(mon) {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return m.indexOf(mon) >= 0 ? m.indexOf(mon) : 0;
  }

  function toGCalDate(d) {
    return (
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      "T" +
      String(d.getHours()).padStart(2, "0") +
      String(d.getMinutes()).padStart(2, "0") +
      "00"
    );
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const qBtn = item.querySelector(".faq-question");
    if (qBtn) {
      qBtn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        faqItems.forEach((f) => f.classList.remove("open"));
        if (!isOpen) {
          item.classList.add("open");
        }
      });
    }
  });
});
