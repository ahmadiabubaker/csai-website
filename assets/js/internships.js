document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("internship-table");
  if (!table) return;
  const tbody = table.querySelector("tbody");

  // Get filter elements
  const roleFilter = document.getElementById("role-filter");
  const appliedFilter = document.getElementById("applied-filter");
  const clearFiltersBtn = document.getElementById("clear-filters");

  // cutoff: do not show anything older than 2025-06-06 (YYYY,MM-1,DD)
  const cutoffSec = Date.UTC(2025, 5, 6, 0, 0, 0) / 1000;

  // Store for applied internships
  const appliedInternships = new Set(
    JSON.parse(localStorage.getItem("appliedInternships") || "[]"),
  );

  // normalize posted time to seconds (or return null)
  function postedSeconds(item) {
    if (!item) return null;
    const raw = item.date_posted || item.date_updated || 0;
    let n = Number(raw) || 0;
    if (n === 0) return null;
    if (n > 1e12) n = Math.floor(n / 1000); // ms -> sec
    return n;
  }

  // Determine role category from title
  function determineRoleCategory(title) {
    if (!title) return "Other";

    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes("software") ||
      lowerTitle.includes("developer") ||
      (lowerTitle.includes("engineer") && !lowerTitle.includes("data")) ||
      lowerTitle.includes("full stack") ||
      lowerTitle.includes("frontend") ||
      lowerTitle.includes("backend") ||
      lowerTitle.includes("java ") ||
      lowerTitle.includes("c++") ||
      lowerTitle.includes("coding")
    ) {
      return "Software Engineering";
    } else if (
      lowerTitle.includes("data sci") ||
      lowerTitle.includes("data analy") ||
      lowerTitle.includes("analytics") ||
      lowerTitle.includes("business intel") ||
      lowerTitle.includes("statistic")
    ) {
      return "Data Science";
    } else if (
      lowerTitle.includes("machine") ||
      lowerTitle.includes("ml") ||
      lowerTitle.includes("ai") ||
      lowerTitle.includes("artificial intel") ||
      lowerTitle.includes("deep learn")
    ) {
      return "Machine Learning";
    } else if (
      lowerTitle.includes("cyber") ||
      lowerTitle.includes("security") ||
      (lowerTitle.includes("network") && lowerTitle.includes("secur"))
    ) {
      return "Cybersecurity";
    } else if (
      lowerTitle.includes("product") ||
      lowerTitle.includes("pm ") ||
      lowerTitle.includes("program manage")
    ) {
      return "Product";
    } else {
      return "Other";
    }
  }

  // Mark internship as applied
  function toggleAppliedStatus(id) {
    if (appliedInternships.has(id)) {
      appliedInternships.delete(id);
    } else {
      appliedInternships.add(id);
    }

    localStorage.setItem(
      "appliedInternships",
      JSON.stringify([...appliedInternships]),
    );
    renderInternships(); // Re-render to update UI
  }

  // Format epoch timestamp to date string
  function formatEpoch(sec) {
    const n = Number(sec) || 0;
    const d = n > 1e12 ? new Date(n) : new Date(n * 1000);
    if (isNaN(d)) return "";
    return d.toLocaleDateString();
  }

  // Escape HTML to prevent XSS
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Load and process internships
  let allInternships = [];

  // Render internships based on current filters
  function renderInternships() {
    const roleCategory = roleFilter.value;
    const appliedStatus = appliedFilter.value;

    let filtered = [...allInternships];

    // Apply role filter
    if (roleCategory !== "all") {
      filtered = filtered.filter((item) => item._roleCategory === roleCategory);
    }

    // Apply applied status filter
    if (appliedStatus === "applied") {
      filtered = filtered.filter((item) => appliedInternships.has(item.id));
    } else if (appliedStatus === "not-applied") {
      filtered = filtered.filter((item) => !appliedInternships.has(item.id));
    }

    // Clear table
    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No internships found matching your filters.</td></tr>`;
      return;
    }

    // Render each internship
    filtered.forEach((item) => {
      const company = item.company_name || item.company || "";
      const title = item.title || item.job_title || "";
      const locations =
        item.locations && item.locations.length
          ? item.locations.join(", ")
          : item.location || "";
      const terms =
        item.terms && item.terms.length
          ? item.terms.join(", ")
          : item.term || "";
      const posted = item._postedSec ? formatEpoch(item._postedSec) : "";
      const url = item.url || item.applyLink || "#";
      const isApplied = appliedInternships.has(item.id);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-company" data-label="Company">
          <strong>${escapeHtml(company)}</strong>
        </td>
        <td class="col-title" data-label="Role">
          ${escapeHtml(title)}
          <div><small>Category: ${escapeHtml(item._roleCategory)}</small></div>
        </td>
        <td class="col-location" data-label="Location">${escapeHtml(locations)}</td>
        <td class="col-terms" data-label="Terms">${escapeHtml(terms)}</td>
        <td class="col-status" data-label="Status">
          <div class="status-indicator ${isApplied ? "status-applied" : "status-not-applied"}"
               style="${isApplied ? "" : "display: none;"}">
            ${isApplied ? "✓ Applied" : ""}
          </div>
          <button class="toggle-applied" data-id="${item.id}">
            ${isApplied ? "Mark as Not Applied" : "Mark as Applied"}
          </button>
        </td>
        <td class="col-posted" data-label="Posted">
          ${escapeHtml(posted)}
        </td>
        <td class="col-apply">
          <a class="apply-btn" href="${encodeURI(url)}" target="_blank" rel="noopener">
            Apply
          </a>
        </td>
      `;
      tbody.appendChild(tr);

      // Add event listener for the toggle button
      const toggleBtn = tr.querySelector(".toggle-applied");
      toggleBtn.addEventListener("click", () => {
        toggleAppliedStatus(item.id);
      });
    });
  }

  // Fetch and initialize
  fetch("nj-internships.json")
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      console.log("Loaded internships data:", data.length, "entries");

      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No internships found.</td></tr>';
        return;
      }

      // Process and store internships
      allInternships = data
        .filter((item) => {
          // Make sure we have valid items and they're not hidden
          return item && item.is_visible !== false;
        })
        .map((item) => {
          // Add needed processing fields
          const p = postedSeconds(item);
          const roleCategory = determineRoleCategory(
            item.title || item.job_title || "",
          );

          // Make sure each item has an ID for tracking applied status
          if (!item.id) {
            item.id = `${item.company_name || ""}-${item.title || ""}-${Math.random().toString(36).substring(2, 9)}`;
          }

          return Object.assign(
            {
              _postedSec: p,
              _roleCategory: roleCategory,
            },
            item,
          );
        });

      // Only filter by date if we have actual date data
      const hasDateData = allInternships.some((item) => item._postedSec);
      if (hasDateData) {
        allInternships = allInternships
          .filter((item) => item._postedSec && item._postedSec >= cutoffSec)
          .sort((a, b) => b._postedSec - a._postedSec);
      }

      console.log(
        "Processed internships:",
        allInternships.length,
        "entries ready to display",
      );

      renderInternships();
    })
    .catch((err) => {
      console.error("Error loading internships:", err);
      tbody.innerHTML =
        '<tr><td colspan="6">Unable to load internships at this time.</td></tr>';
    });

  // Event listeners for filters
  roleFilter.addEventListener("change", renderInternships);
  appliedFilter.addEventListener("change", renderInternships);
  clearFiltersBtn.addEventListener("click", () => {
    roleFilter.value = "all";
    appliedFilter.value = "all";
    renderInternships();
  });

  // Subtab switching functionality
  const subtabBtns = document.querySelectorAll(".subtab-btn");
  const searchTab = document.getElementById("search-tab");
  const featuredTab = document.getElementById("featured-tab");

  subtabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab");

      // Update button active states
      subtabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show/hide tab content
      if (tabName === "search") {
        searchTab.classList.remove("hidden");
        featuredTab.classList.add("hidden");
      } else if (tabName === "featured") {
        searchTab.classList.add("hidden");
        featuredTab.classList.remove("hidden");
      }
    });
  });
});
