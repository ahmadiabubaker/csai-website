(function () {
  // Backend can inject this array before this script runs.
  // Shape: [{ year, updatedAt, pdfUrl, pages: ["img-url-1", ...] }]
  const defaultReports = [
    {
      year: 2025,
      updatedAt: "2026-04-14",
      pdfUrl: "data/photos/2025-ImpactReport/Impact%20Report%2025-26%20(1).pdf",
      pages: [
        "data/photos/2025-ImpactReport/1.png",
        "data/photos/2025-ImpactReport/2.png",
        "data/photos/2025-ImpactReport/3.png",
        "data/photos/2025-ImpactReport/4.png",
        "data/photos/2025-ImpactReport/5.png",
        "data/photos/2025-ImpactReport/6.png",
        "data/photos/2025-ImpactReport/7.png",
        "data/photos/2025-ImpactReport/8.png",
        "data/photos/2025-ImpactReport/9.png",
        "data/photos/2025-ImpactReport/10.png",
        "data/photos/2025-ImpactReport/11.png",
      ],
    },
  ];

  const reports = Array.isArray(window.CSAI_IMPACT_REPORTS) && window.CSAI_IMPACT_REPORTS.length
    ? window.CSAI_IMPACT_REPORTS
    : defaultReports;

  const statusEl = document.getElementById("impact-status");
  const yearListEl = document.getElementById("impact-year-list");
  const selectedYearEl = document.getElementById("impact-selected-year");
  const updatedAtEl = document.getElementById("impact-updated-at");
  const openPdfEl = document.getElementById("impact-open-pdf");
  const pageCountEl = document.getElementById("impact-page-count");
  const deckToggleEl = document.getElementById("impact-deck-toggle");
  const miniImgA = document.getElementById("impact-mini-a");
  const miniImgB = document.getElementById("impact-mini-b");
  const miniImgC = document.getElementById("impact-mini-c");
  const viewerEl = document.getElementById("impact-viewer-modal");
  const viewerTitleEl = document.getElementById("impact-viewer-title");
  const closeViewerEl = document.getElementById("impact-close-viewer");
  const deckStageEl = document.getElementById("impact-deck-stage");
  const prevPageBtn = document.getElementById("impact-prev-page");
  const nextPageBtn = document.getElementById("impact-next-page");
  const pageIndicatorEl = document.getElementById("impact-page-indicator");
  const zoomOutBtn = document.getElementById("impact-zoom-out");
  const zoomInBtn = document.getElementById("impact-zoom-in");
  const zoomResetBtn = document.getElementById("impact-zoom-reset");

  const state = {
    selectedYear: null,
    pageIndex: 0,
    cards: [],
    reportMap: new Map(),
    viewerOpen: false,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragMoved: false,
    dragPointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragOriginX: 0,
    dragOriginY: 0,
    suppressCardClick: false,
  };

  function init() {
    // Move modal to body so it is never constrained by section/footer stacking contexts.
    if (viewerEl && viewerEl.parentElement !== document.body) {
      document.body.appendChild(viewerEl);
    }

    reports
      .filter((item) => Number.isInteger(Number(item.year)))
      .forEach((item) => {
        state.reportMap.set(Number(item.year), {
          year: Number(item.year),
          updatedAt: item.updatedAt || "",
          pdfUrl: item.pdfUrl || "",
          pages: Array.isArray(item.pages) ? item.pages : [],
        });
      });

    state.selectedYear = getLatestYear();
    bindEvents();
    renderYearList();
    renderSelectedReport();
  }

  function bindEvents() {
    deckToggleEl.addEventListener("click", openViewer);

    openPdfEl.addEventListener("click", (event) => {
      if (openPdfEl.classList.contains("disabled")) {
        event.preventDefault();
      }
    });

    closeViewerEl.addEventListener("click", closeViewer);
    viewerEl.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.getAttribute("data-close-viewer") === "true") {
        closeViewer();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!state.viewerOpen) return;
      if (event.key === "Escape") {
        closeViewer();
      } else if (event.key === "ArrowRight") {
        nextPage();
      } else if (event.key === "ArrowLeft") {
        prevPage();
      }
    });

    prevPageBtn.addEventListener("click", prevPage);
    nextPageBtn.addEventListener("click", nextPage);
    zoomOutBtn.addEventListener("click", () => setZoom(state.zoomLevel - 0.2));
    zoomInBtn.addEventListener("click", () => setZoom(state.zoomLevel + 0.2));
    zoomResetBtn.addEventListener("click", () => setZoom(1));
    deckStageEl.addEventListener("pointerdown", onDeckPointerDown);
    deckStageEl.addEventListener("pointermove", onDeckPointerMove);
    deckStageEl.addEventListener("pointerup", onDeckPointerUp);
    deckStageEl.addEventListener("pointercancel", onDeckPointerUp);
  }

  function setStatus(message) {
    if (!statusEl) return;
    statusEl.textContent = message;
  }

  function getLatestYear() {
    const years = Array.from(state.reportMap.keys());
    if (!years.length) return new Date().getFullYear();
    return Math.max(...years);
  }

  function sortedYears() {
    return Array.from(state.reportMap.keys()).sort((a, b) => b - a);
  }

  function renderYearList() {
    yearListEl.innerHTML = "";

    sortedYears().forEach((year) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "impact-year-btn";
      btn.textContent = String(year);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(year === state.selectedYear));

      if (year === state.selectedYear) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", () => {
        state.selectedYear = year;
        state.pageIndex = 0;
        renderYearList();
        renderSelectedReport();
      });

      yearListEl.appendChild(btn);
    });
  }

  function renderSelectedReport() {
    const report = state.reportMap.get(state.selectedYear);
    if (!report) {
      setStatus("No report package was found for this year.");
      return;
    }

    if (state.viewerOpen) {
      closeViewer();
    }

    selectedYearEl.textContent = `Impact Report ${report.year}`;
    viewerTitleEl.textContent = `Impact Report ${report.year} - Page Deck`;
    updatedAtEl.textContent = report.updatedAt ? `Updated ${formatDate(report.updatedAt)}` : "Update pending";

    const hasPdf = Boolean(report.pdfUrl);
    if (hasPdf) {
      openPdfEl.href = report.pdfUrl;
      openPdfEl.classList.remove("disabled");
      openPdfEl.removeAttribute("aria-disabled");
    } else {
      openPdfEl.href = "#";
      openPdfEl.classList.add("disabled");
      openPdfEl.setAttribute("aria-disabled", "true");
    }

    pageCountEl.textContent = `${report.pages.length} pages`;
    rebuildDeck(report.pages);
    updateDeckPositions();
    syncMiniDeck(report.pages);

    if (!report.pages.length) {
      setStatus("No preview pages are available yet for this year.");
      deckToggleEl.disabled = true;
    } else {
      setStatus("Select the tiny deck block to expand page previews.");
      deckToggleEl.disabled = false;
    }
  }

  function formatDate(raw) {
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    return dt.toLocaleDateString();
  }

  function rebuildDeck(pageUrls) {
    state.cards = [];
    deckStageEl.innerHTML = "";

    pageUrls.forEach((url, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "impact-deck-card";
      card.setAttribute("aria-label", `Go to page ${index + 1}`);

      const img = document.createElement("img");
      img.src = url;
      img.alt = `Impact report page ${index + 1}`;
      img.loading = "lazy";

      card.appendChild(img);
      card.addEventListener("click", () => {
        if (state.suppressCardClick) {
          state.suppressCardClick = false;
          return;
        }

        if (index === state.pageIndex) return;

        state.pageIndex = index;
        resetPan();
        updateDeckPositions();
      });

      deckStageEl.appendChild(card);
      state.cards.push(card);
    });
  }

  function updateDeckPositions() {
    const total = state.cards.length;
    const report = state.reportMap.get(state.selectedYear);

    if (!total) {
      pageIndicatorEl.textContent = "Page 0 / 0";
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
      if (report) syncMiniDeck(report.pages || []);
      return;
    }

    state.cards.forEach((card, idx) => {
      card.classList.remove("is-active", "is-next", "is-prev", "is-hidden");

      if (idx === state.pageIndex) {
        card.classList.add("is-active");
      } else if (idx === (state.pageIndex + 1) % total) {
        card.classList.add("is-next");
      } else if (idx === (state.pageIndex - 1 + total) % total) {
        card.classList.add("is-prev");
      } else {
        card.classList.add("is-hidden");
      }
    });

    pageIndicatorEl.textContent = `Page ${state.pageIndex + 1} / ${total}`;
    prevPageBtn.disabled = total <= 1;
    nextPageBtn.disabled = total <= 1;
    applyZoomToActiveCard();
    updateZoomButtons();
    if (report) syncMiniDeck(report.pages || []);
  }

  function setZoom(nextZoom) {
    const clamped = Math.max(1, Math.min(3, Number(nextZoom.toFixed(2))));
    state.zoomLevel = clamped;
    if (state.zoomLevel === 1) {
      resetPan();
    } else {
      setPan(state.panX, state.panY);
    }
    applyZoomToActiveCard();
    updateZoomButtons();
    updatePanInteractionMode();
  }

  function applyZoomToActiveCard() {
    state.cards.forEach((card, idx) => {
      const image = card.querySelector("img");
      if (!image) return;
      if (idx === state.pageIndex) {
        image.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`;
        card.classList.toggle("is-pannable", state.zoomLevel > 1);
      } else {
        image.style.transform = "translate(0px, 0px) scale(1)";
        card.classList.remove("is-pannable");
      }
    });
  }

  function updateZoomButtons() {
    zoomOutBtn.disabled = state.zoomLevel <= 1;
    zoomInBtn.disabled = state.zoomLevel >= 3;
    zoomResetBtn.disabled = state.zoomLevel === 1;
  }

  function updatePanInteractionMode() {
    deckStageEl.style.touchAction = state.zoomLevel > 1 ? "none" : "auto";
  }

  function resetPan() {
    state.panX = 0;
    state.panY = 0;
  }

  function clampPan(nextX, nextY) {
    const activeCard = state.cards[state.pageIndex];
    if (!activeCard || state.zoomLevel <= 1) {
      return { x: 0, y: 0 };
    }

    const maxX = (activeCard.clientWidth * (state.zoomLevel - 1)) / 2;
    const maxY = (activeCard.clientHeight * (state.zoomLevel - 1)) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  }

  function setPan(nextX, nextY) {
    const clamped = clampPan(nextX, nextY);
    state.panX = clamped.x;
    state.panY = clamped.y;
  }

  function onDeckPointerDown(event) {
    if (!state.viewerOpen || state.zoomLevel <= 1) return;

    const activeCard = state.cards[state.pageIndex];
    if (!activeCard || !activeCard.contains(event.target)) return;

    state.isDragging = true;
    state.dragMoved = false;
    state.dragPointerId = event.pointerId;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.dragOriginX = state.panX;
    state.dragOriginY = state.panY;

    deckStageEl.classList.add("is-panning");
    try {
      activeCard.setPointerCapture(event.pointerId);
    } catch {
      // Ignore capture failures on unsupported environments.
    }

    event.preventDefault();
  }

  function onDeckPointerMove(event) {
    if (!state.isDragging || event.pointerId !== state.dragPointerId) return;

    const deltaX = event.clientX - state.dragStartX;
    const deltaY = event.clientY - state.dragStartY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      state.dragMoved = true;
    }

    setPan(state.dragOriginX + deltaX, state.dragOriginY + deltaY);
    applyZoomToActiveCard();
    event.preventDefault();
  }

  function onDeckPointerUp(event) {
    if (!state.isDragging || event.pointerId !== state.dragPointerId) return;

    state.isDragging = false;
    state.dragPointerId = null;

    if (state.dragMoved) {
      state.suppressCardClick = true;
    }

    deckStageEl.classList.remove("is-panning");
  }

  function syncMiniDeck(pages) {
    if (!miniImgA || !miniImgB || !miniImgC) return;

    if (!pages.length) {
      const placeholder = createPlaceholderPageSvg(state.selectedYear || new Date().getFullYear(), 1);
      miniImgA.src = placeholder;
      miniImgB.src = placeholder;
      miniImgC.src = placeholder;
      return;
    }

    const total = pages.length;
    const base = state.pageIndex % total;

    miniImgA.src = pages[(base + 2) % total];
    miniImgB.src = pages[(base + 1) % total];
    miniImgC.src = pages[base];
  }

  function prevPage() {
    const report = state.reportMap.get(state.selectedYear);
    if (!report || !report.pages.length) return;
    state.pageIndex = (state.pageIndex - 1 + report.pages.length) % report.pages.length;
    resetPan();
    updateDeckPositions();
  }

  function nextPage() {
    const report = state.reportMap.get(state.selectedYear);
    if (!report || !report.pages.length) return;
    state.pageIndex = (state.pageIndex + 1) % report.pages.length;
    resetPan();
    updateDeckPositions();
  }

  function openViewer() {
    const report = state.reportMap.get(state.selectedYear);
    if (!report || !report.pages.length) return;

    state.viewerOpen = true;
    setZoom(1);
    viewerEl.classList.add("is-open");
    viewerEl.setAttribute("aria-hidden", "false");
    deckToggleEl.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeViewer() {
    state.isDragging = false;
    state.dragPointerId = null;
    deckStageEl.classList.remove("is-panning");
    state.viewerOpen = false;
    viewerEl.classList.remove("is-open");
    viewerEl.setAttribute("aria-hidden", "true");
    deckToggleEl.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function createPlaceholderPageSvg(year, pageNumber) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600" role="img" aria-label="Impact report demo page ${pageNumber}">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#def7ff" />
            <stop offset="55%" stop-color="#ece7ff" />
            <stop offset="100%" stop-color="#fff2f7" />
          </linearGradient>
          <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#00cfe8" />
            <stop offset="55%" stop-color="#5f7dff" />
            <stop offset="100%" stop-color="#ff6aa4" />
          </linearGradient>
        </defs>
        <rect width="1200" height="1600" fill="url(#bg)" />
        <rect x="96" y="88" width="1008" height="1424" rx="42" fill="white" opacity="0.94" />
        <rect x="156" y="162" width="888" height="18" rx="9" fill="url(#bar)" />
        <text x="156" y="260" fill="#1d2a4d" font-size="64" font-family="Segoe UI, Arial, sans-serif" font-weight="700">CSAI Impact Report ${year}</text>
        <text x="156" y="330" fill="#3a4d7a" font-size="34" font-family="Segoe UI, Arial, sans-serif">Demo Page ${pageNumber}</text>
        <rect x="156" y="392" width="888" height="2" fill="#dce6ff" />
        <rect x="156" y="448" width="420" height="170" rx="24" fill="#ecf2ff" />
        <rect x="598" y="448" width="446" height="170" rx="24" fill="#edfdf8" />
        <rect x="156" y="656" width="888" height="304" rx="24" fill="#f8f7ff" />
        <rect x="156" y="1004" width="568" height="380" rx="24" fill="#f1fbff" />
        <rect x="752" y="1004" width="292" height="380" rx="24" fill="#fff2f7" />
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  init();
})();
