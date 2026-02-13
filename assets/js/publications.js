document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('publications-table');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  
  // Get filter elements
  const typeFilter = document.getElementById('type-filter');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  let allPublications = [];
  
  // normalize posted time to seconds (or return null)
  function postedSeconds(item) {
    if (!item) return null;
    const raw = item.date_posted || item.date_updated || 0;
    let n = Number(raw) || 0;
    if (n === 0) return null;
    if (n > 1e12) n = Math.floor(n / 1000); // ms -> sec
    return n;
  }

  // build tbody rows from filtered data
  function renderTable(items) {
    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999">No publications found</td></tr>`;
      return;
    }

    // Sort by year (most recent first), then by title
    items.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (a.title || '').localeCompare(b.title || '');
    });

    let html = '';
    for (const pub of items) {
      const title = pub.title || 'Untitled';
      const authors = Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || 'N/A');
      const venue = pub.venue || 'N/A';
      const year = pub.year || 'N/A';
      const type = pub.type || 'Other';
      const url = pub.url || '#';

      html += `
        <tr>
          <td class="col-title">${title}</td>
          <td class="col-company">${authors}</td>
          <td class="col-location">${venue}</td>
          <td class="col-year">${year}</td>
          <td class="col-type">${type}</td>
          <td>
            <a href="${url}" target="_blank" rel="noopener" class="btn small-btn">View</a>
          </td>
        </tr>
      `;
    }
    tbody.innerHTML = html;
  }

  // Apply current filters
  function applyFilters() {
    const typeVal = typeFilter.value;
    
    let filtered = allPublications.filter(pub => {
      // Type filter
      if (typeVal !== 'all' && pub.type !== typeVal) return false;
      return true;
    });

    renderTable(filtered);
  }

  // Clear all filters
  function clearFilters() {
    typeFilter.value = 'all';
    applyFilters();
  }

  // Attach event listeners
  typeFilter.addEventListener('change', applyFilters);
  clearFiltersBtn.addEventListener('click', clearFilters);

  // Load publications data
  fetch('data/publications.json')
    .then(res => res.json())
    .then(data => {
      // Filter visible publications
      allPublications = data.filter(pub => pub.is_visible !== false);
      renderTable(allPublications);
    })
    .catch(err => {
      console.error('Error loading publications:', err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#d00">Error loading publications</td></tr>`;
    });
});
