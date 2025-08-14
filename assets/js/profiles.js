// Toggle Read More for profiles (fixed)
document.querySelectorAll('.profile-card').forEach(card => {
  // Only create button if it doesn't exist already
  if (!card.querySelector('.read-more-btn')) {
    const btn = document.createElement('button');
    btn.className = 'read-more-btn';
    btn.textContent = 'Read More';
    card.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // stop bubbling just in case
      card.classList.toggle('expanded');
      btn.textContent = card.classList.contains('expanded') ? 'Read Less' : 'Read More';
    });
  }
});
