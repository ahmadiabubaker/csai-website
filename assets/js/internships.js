document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('internship-table');
  if (!table) return;
  const tbody = table.querySelector('tbody');

  // cutoff: do not show anything older than 2025-06-06 (YYYY,MM-1,DD)
  const cutoffSec = Date.UTC(2025, 5, 6, 0, 0, 0) / 1000;

  // normalize posted time to seconds (or return null)
  function postedSeconds(item) {
    if (!item) return null;
    const raw = item.date_posted || item.date_updated || 0;
    let n = Number(raw) || 0;
    if (n === 0) return null;
    if (n > 1e12) n = Math.floor(n / 1000); // ms -> sec
    return n;
  }

  fetch('nj-internships.json')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      tbody.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No internships found.</td></tr>';
        return;
      }

      // filter visible + with valid post date >= cutoff, then sort newest first
      const filtered = data
        .filter(item => item && item.is_visible !== false)
        .map(item => {
          const p = postedSeconds(item);
          return Object.assign({ _postedSec: p }, item);
        })
        .filter(item => item._postedSec && item._postedSec >= cutoffSec)
        .sort((a, b) => b._postedSec - a._postedSec);

      filtered.forEach(item => {
        const company = item.company_name || item.company || '';
        const title = item.title || item.job_title || '';
        const locations = (item.locations && item.locations.length) ? item.locations.join(', ') : (item.location || '');
        const terms = (item.terms && item.terms.length) ? item.terms.join(', ') : (item.term || '');
        const posted = item._postedSec ? formatEpoch(item._postedSec) : '';
        const url = item.url || item.applyLink || '#';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="col-company" data-label="Company"><strong>${escapeHtml(company)}</strong></td>
          <td class="col-title" data-label="Role">${escapeHtml(title)}</td>
          <td class="col-location" data-label="Location">${escapeHtml(locations)}</td>
          <td class="col-terms" data-label="Terms">${escapeHtml(terms)}</td>
          <td class="col-posted" data-label="Posted">${escapeHtml(posted)}</td>
          <td class="col-apply"><a class="apply-btn" href="${encodeURI(url)}" target="_blank" rel="noopener">Apply</a></td>
        `;
        tbody.appendChild(tr);
      });

      if (!tbody.children.length) {
        tbody.innerHTML = '<tr><td colspan="6">No recent internships found (after 2025-06-06).</td></tr>';
      }
    })
    .catch(err => {
      console.error('Error loading internships:', err);
      tbody.innerHTML = '<tr><td colspan="6">Unable to load internships at this time.</td></tr>';
    });

  // helpers
  function formatEpoch(sec) {
    const n = Number(sec) || 0;
    const d = n > 1e12 ? new Date(n) : new Date(n * 1000);
    if (isNaN(d)) return '';
    return d.toLocaleDateString();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
});
