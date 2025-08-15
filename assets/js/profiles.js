// Toggle Read More for profiles (fixed)
document.querySelectorAll('.profile-card').forEach(card => {
  if (!card.querySelector('.read-more-btn')) {
    const btn = document.createElement('button');
    btn.className = 'read-more-btn';
    btn.textContent = 'Read More';
    card.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Collapse all other cards first (optional: remove this if you want multiple open)
      document.querySelectorAll('.profile-card.expanded').forEach(openCard => {
        if (openCard !== card) {
          openCard.classList.remove('expanded');
          const openBtn = openCard.querySelector('.read-more-btn');
          if (openBtn) openBtn.textContent = 'Read More';
        }
      });

      // Toggle the clicked card
      card.classList.toggle('expanded');
      btn.textContent = card.classList.contains('expanded') ? 'Read Less' : 'Read More';
    });
  }
});
