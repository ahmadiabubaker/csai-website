/**
 * ===== Mobile Navigation System =====
 * Handles hamburger menu toggle and mobile accordion submenus
 */

// ===== Hamburger Menu Toggle =====
const hamMenu = document.querySelector(".ham-menu");
const offScreenMenu = document.querySelector(".off-screen-menu");

/**
 * Toggle the mobile menu open/closed
 * Updates ARIA attributes for accessibility
 */
function toggleMenu() {
  const isActive = hamMenu.classList.toggle("active");
  offScreenMenu.classList.toggle("active");
  
  // Update ARIA attributes
  hamMenu.setAttribute('aria-expanded', isActive);
  
  // Prevent body scroll when menu is open
  if (isActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

hamMenu.addEventListener("click", toggleMenu);

// ===== Close menu when clicking outside =====
document.addEventListener('click', (e) => {
  if (
    offScreenMenu.classList.contains('active') &&
    !offScreenMenu.contains(e.target) &&
    !hamMenu.contains(e.target)
  ) {
    offScreenMenu.classList.remove('active');
    hamMenu.classList.remove("active");
    hamMenu.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
});

// ===== Mobile Dropdown Accordion System =====
/**
 * Only activate on mobile (viewport width <= 700px)
 * Handles expanding/collapsing submenus with accordion behavior
 */

const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

dropdownToggles.forEach(toggle => {
  /**
   * Handle click on dropdown toggle button
   * Implements accordion: only one submenu open at a time
   */
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle on mobile viewport
    if (window.innerWidth > 700) return;
    
    const navItem = toggle.closest('.nav-item.has-dropdown');
    const isExpanded = navItem.classList.contains('expanded');
    
    // Close all other dropdowns (accordion behavior)
    document.querySelectorAll('.nav-item.has-dropdown.expanded').forEach(item => {
      if (item !== navItem) {
        item.classList.remove('expanded');
        const otherToggle = item.querySelector('.dropdown-toggle');
        otherToggle?.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Toggle current dropdown
    navItem.classList.toggle('expanded');
    toggle.setAttribute('aria-expanded', !isExpanded);
  });
  
  /**
   * Keyboard accessibility: Enter or Space to toggle
   */
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });
});

// ===== Close mobile menu when clicking nav links =====
const navLinks = document.querySelectorAll('.nav-link, .dropdown-menu a');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    // Only close menu on mobile
    if (window.innerWidth <= 700 && offScreenMenu.classList.contains('active')) {
      offScreenMenu.classList.remove('active');
      hamMenu.classList.remove('active');
      hamMenu.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
});

// ===== Reset mobile states on viewport resize =====
/**
 * When transitioning from mobile to desktop:
 * - Close the mobile menu
 * - Collapse all accordion submenus
 * - Restore body scroll
 */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth > 700) {
      // Transitioning to desktop
      offScreenMenu.classList.remove('active');
      hamMenu.classList.remove('active');
      hamMenu.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      
      // Close all mobile accordion dropdowns
      document.querySelectorAll('.nav-item.has-dropdown.expanded').forEach(item => {
        item.classList.remove('expanded');
        const toggle = item.querySelector('.dropdown-toggle');
        toggle?.setAttribute('aria-expanded', 'false');
      });
    }
  }, 250);
});