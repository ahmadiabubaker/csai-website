document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('competitions-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  let allCompetitions = [];
  let currentFilter = 'all';
  
  // Escape HTML to prevent XSS
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Calculate time remaining
  function getTimeRemaining(endDate) {
    const total = Date.parse(endDate) - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return {
      total,
      days,
      hours,
      minutes,
      seconds
    };
  }
  
  // Format countdown display
  function formatCountdown(timeRemaining) {
    if (timeRemaining.total <= 0) {
      return 'Expired';
    }
    
    const parts = [];
    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.hours}h`);
    }
    if (timeRemaining.days === 0) {
      parts.push(`${timeRemaining.minutes}m`);
    }
    
    return parts.join(' ');
  }
  
  // Determine competition status
  function getStatus(comp) {
    const now = Date.now();
    const start = Date.parse(comp.start_date);
    const end = Date.parse(comp.end_date);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'ongoing';
  }
  
  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  // Create competition card
  function createCompetitionCard(comp) {
    const status = getStatus(comp);
    const statusClass = comp.featured ? 'status-featured' : `status-${status}`;
    const statusText = comp.featured ? 'Featured' : status.charAt(0).toUpperCase() + status.slice(1);
    
    const card = document.createElement('div');
    card.className = `competition-card ${comp.featured ? 'featured' : ''}`;
    card.dataset.status = status;
    
    let countdownHTML = '';
    // Countdown component removed from all cards
    
    const tagsHTML = comp.tags && comp.tags.length > 0
      ? `<div class="competition-tags">
          ${comp.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
         </div>`
      : '';
    
    const featuredBadge = comp.featured 
      ? '<div class="featured-badge">Featured Competition</div>' 
      : '';
    
    const detailsBtn = comp.details_url 
      ? `<a href="${escapeHtml(comp.details_url)}" target="_blank" rel="noopener" class="comp-btn comp-btn-primary comp-btn-details">Details</a>`
      : '';

    card.innerHTML = `
      ${featuredBadge}
      <div class="competition-header">
        <div class="competition-status ${statusClass}">${statusText}</div>
        <h3 class="competition-title">${escapeHtml(comp.name)}</h3>
        <div class="competition-organizer">by ${escapeHtml(comp.organizer)}</div>
      </div>
      <div class="competition-body">
        <p class="competition-description">${escapeHtml(comp.description)}</p>
        
        ${countdownHTML}
        
        <div class="competition-meta">
          <div class="meta-item">
            <span class="meta-label">Prize Pool</span>
            <span class="meta-value prize">${escapeHtml(comp.prize)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Difficulty</span>
            <span class="meta-value">${escapeHtml(comp.difficulty)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Start Date</span>
            <span class="meta-value">${formatDate(comp.start_date)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">End Date</span>
            <span class="meta-value">${formatDate(comp.end_date)}</span>
          </div>
        </div>
        
        ${tagsHTML}
        
        <div class="competition-actions">
          ${detailsBtn}
        </div>
      </div>
    `;
    
    return card;
  }
  
  // Render competitions
  function renderCompetitions() {
    grid.innerHTML = '';
    
    let filtered = allCompetitions;
    if (currentFilter !== 'all') {
      filtered = allCompetitions.filter(comp => getStatus(comp) === currentFilter);
    }
    
    // Sort: featured first, then by start date
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return Date.parse(b.start_date) - Date.parse(a.start_date);
    });
    
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No competitions found</h3>
          <p>Check back later for new challenges!</p>
        </div>
      `;
      return;
    }
    
    filtered.forEach(comp => {
      const card = createCompetitionCard(comp);
      grid.appendChild(card);
    });
    
    // Start countdown timers
    startCountdowns();
  }
  
  // Update countdowns
  function startCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    
    function updateCountdowns() {
      timers.forEach(timer => {
        const target = timer.dataset.target;
        if (target) {
          const timeRemaining = getTimeRemaining(target);
          timer.textContent = formatCountdown(timeRemaining);
          
          if (timeRemaining.total <= 0) {
            // Reload competitions when a countdown expires
            setTimeout(() => loadCompetitions(), 1000);
          }
        }
      });
    }
    
    // Update every second
    setInterval(updateCountdowns, 1000);
  }
  
  // Filter button handlers
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderCompetitions();
    });
  });
  
  // Load competitions
  function loadCompetitions() {
    fetch('data/competitions.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load competitions');
        return res.json();
      })
      .then(data => {
        allCompetitions = data.filter(comp => comp.visible !== false);
        renderCompetitions();
      })
      .catch(err => {
        console.error('Error loading competitions:', err);
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Unable to load competitions</h3>
            <p>Please try again later.</p>
          </div>
        `;
      });
  }
  
  // Initialize
  loadCompetitions();
});
