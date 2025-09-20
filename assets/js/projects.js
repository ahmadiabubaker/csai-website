// Per-card "Read More" toggle — only toggles the clicked card
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.project-card').forEach(card => {
    const actions = card.querySelector('.project-actions');
    const btn = card.querySelector('.read-more-btn') || (()=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'read-more-btn';
      b.textContent = 'Read More';
      b.setAttribute('aria-expanded', 'false');
      actions && actions.appendChild(b);
      return b;
    })();

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = card.classList.toggle('expanded');
      btn.textContent = expanded ? 'Read Less' : 'Read More';
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      // do NOT collapse other cards — per requirement
    });
  });
});
