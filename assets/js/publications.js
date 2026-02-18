document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('pub-grid');
  const emptyState = document.getElementById('pub-empty');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  let allPublications = [];
  let currentFilter = 'all';
  
  // Update stats counters
  function updateStats() {
    const total = allPublications.length;
    const paperCount = allPublications.filter(p => p.type === 'paper').length;
    const videoCount = allPublications.filter(p => p.type === 'video').length;
    
    // Animate counter
    function animateCount(element, target) {
      let current = 0;
      const increment = Math.ceil(target / 20);
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        element.textContent = current;
      }, 30);
    }
    
    const totalEl = document.getElementById('total-count');
    const paperEl = document.getElementById('paper-count');
    const videoEl = document.getElementById('video-count');
    
    if (totalEl) animateCount(totalEl, total);
    if (paperEl) animateCount(paperEl, paperCount);
    if (videoEl) animateCount(videoEl, videoCount);
    
    // Update filter counts
    document.getElementById('filter-count-all').textContent = total;
    document.getElementById('filter-count-paper').textContent = paperCount;
    document.getElementById('filter-count-video').textContent = videoCount;
  }
  
  // Create a publication card
  function createCard(pub) {
    const card = document.createElement('div');
    card.className = `pub-card ${pub.featured ? 'featured' : ''}`;
    card.dataset.type = pub.type;
    
    // Featured badge
    const featuredBadge = pub.featured 
      ? '<div class="featured-badge">✨ Featured</div>' 
      : '';
    
    // Header accent strip
    const header = '<div class="pub-card-header"></div>';
    
    // Video or Paper specific content
    let mediaContent = '';
    if (pub.type === 'video' && pub.video_url) {
      mediaContent = `
        <div class="pub-video-container">
          <iframe 
            src="${pub.video_url}" 
            title="${pub.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
      `;
    } else if (pub.type === 'video') {
      mediaContent = `
        <div class="pub-video-container">
          <div class="pub-video-placeholder">
            🎥
            <div class="pub-video-placeholder-text">Video Coming Soon</div>
          </div>
        </div>
      `;
    }
    
    // Type badge
    const typeBadge = `<div class="pub-type-badge type-${pub.type}">${pub.type === 'video' ? '🎥 Video' : '📄 Paper'}</div>`;
    
    // Authors
    const authors = Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors || 'N/A';
    
    // Meta information
    const metaItems = [];
    if (pub.year) {
      metaItems.push(`
        <div class="pub-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${pub.year}</span>
        </div>
      `);
    }
    
    metaItems.push(`
      <div class="pub-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>${authors}</span>
      </div>
    `);
    
    if (pub.venue) {
      metaItems.push(`
        <div class="pub-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${pub.venue}</span>
        </div>
      `);
    }
    
    if (pub.category) {
      metaItems.push(`
        <div class="pub-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>${pub.category}</span>
        </div>
      `);
    }
    
    const meta = `<div class="pub-card-meta">${metaItems.join('')}</div>`;
    
    // Description
    const description = pub.description 
      ? `<p class="pub-card-description">${pub.description}</p>`
      : '';
    
    // Footer buttons
    let footerButtons = '';
    if (pub.type === 'paper' && pub.url) {
      footerButtons = `
        <a href="${pub.url}" target="_blank" rel="noopener" class="pub-btn primary">
          📖 Read Paper
        </a>
      `;
    } else if (pub.type === 'video' && pub.url) {
      footerButtons = `
        <a href="${pub.url}" target="_blank" rel="noopener" class="pub-btn">
          🔗 Learn More
        </a>
      `;
    }
    
    const footer = footerButtons ? `<div class="pub-card-footer">${footerButtons}</div>` : '';
    
    // Assemble card
    card.innerHTML = `
      ${featuredBadge}
      ${header}
      ${mediaContent}
      <div class="pub-card-body">
        ${typeBadge}
        <h3 class="pub-card-title">${pub.title}</h3>
        ${meta}
        ${description}
        ${footer}
      </div>
    `;
    
    return card;
  }
  
  // Render publications
  function renderPublications() {
    grid.innerHTML = '';
    
    // Filter publications
    const filtered = allPublications.filter(pub => {
      if (currentFilter === 'all') return true;
      return pub.type === currentFilter;
    });
    
    // Show empty state or cards
    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      
      // Sort: featured first, then by year
      filtered.sort((a, b) => {
        if (a.featured !== b.featured) return b.featured ? 1 : -1;
        return (b.year || 0) - (a.year || 0);
      });
      
      // Create and append cards
      filtered.forEach(pub => {
        const card = createCard(pub);
        grid.appendChild(card);
      });
    }
  }
  
  // Handle filter button clicks
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update filter and render
      currentFilter = btn.dataset.filter;
      renderPublications();
    });
  });
  
  // Load publications data
  fetch('data/publications.json')
    .then(res => res.json())
    .then(data => {
      // Filter visible publications
      allPublications = data.filter(pub => pub.is_visible !== false);
      updateStats();
      renderPublications();
    })
    .catch(err => {
      console.error('Error loading publications:', err);
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #d00;">
          <h3>Error loading publications</h3>
          <p>Please try again later.</p>
        </div>
      `;
    });
});
