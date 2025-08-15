// Select the header and hamburger
const header = document.querySelector('.header');
const hamburger = document.querySelector('.hamburger');

// Add click event to toggle active class
hamburger.addEventListener('click', () => {
  header.classList.toggle('active');
});
