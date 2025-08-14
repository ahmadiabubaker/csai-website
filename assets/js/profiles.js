// Toggle Read More for profiles
document.querySelectorAll('.profile-card').forEach(card => {
  const btn = document.createElement('button');
  btn.className = 'read-more-btn';
  btn.textContent = 'Read More';
  card.appendChild(btn);
  
  btn.addEventListener('click', () => {
    card.classList.toggle('expanded');
    btn.textContent = card.classList.contains('expanded') ? 'Read Less' : 'Read More';
  });
});
