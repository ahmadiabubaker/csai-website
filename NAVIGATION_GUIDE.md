# Navigation Dropdown System - Documentation

## Overview

This document explains the responsive dropdown navigation menu system implemented for the CSAI website. The system provides different behaviors for desktop and mobile devices using a single, semantic HTML structure.

---

## Features

### Desktop Behavior
- Main navigation items displayed horizontally in the header
- Items with subpages show dropdowns on **hover**
- Dropdowns appear below the parent item with smooth transitions
- CSS-only implementation (no JavaScript required for desktop)
- Keyboard accessible (Tab + Focus)

### Mobile Behavior
- Hamburger menu opens a sliding sidebar
- Navigation items stacked vertically
- Items with subpages have **"+" toggle buttons**
- Tapping the toggle expands/collapses submenus inline
- **Accordion behavior**: Only one submenu open at a time
- Clicking nav links automatically closes the mobile menu

---

## HTML Structure

### Basic Structure
```html
<header class="header">
  <div class="nav container">
    <!-- Hamburger button (mobile only) -->
    <button class="ham-menu" aria-label="Toggle menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Navigation menu (shared for desktop & mobile) -->
    <nav class="nav-links off-screen-menu">
      <ul class="nav-menu">
        <!-- Regular nav item -->
        <li class="nav-item">
          <a href="/" class="nav-link">Home</a>
        </li>

        <!-- Nav item with dropdown -->
        <li class="nav-item has-dropdown">
          <a href="projects.html" class="nav-link">Projects</a>
          <button class="dropdown-toggle" aria-label="Toggle submenu">
            <svg>...</svg>
          </button>
          <ul class="dropdown-menu">
            <li><a href="projects.html">All Projects</a></li>
            <li><a href="anatomyvr.html">AnatomyVR</a></li>
          </ul>
        </li>
      </ul>
    </nav>

    <!-- Desktop Join button -->
    <a class="join-button btn" href="join.html">Join</a>
  </div>
</header>
```

### Key Classes Explained

| Class | Purpose |
|-------|---------|
| `.nav-menu` | Main `<ul>` container for all nav items |
| `.nav-item` | Each list item in the navigation |
| `.nav-item.has-dropdown` | Nav item that contains a submenu |
| `.nav-link` | The main link for each nav item |
| `.dropdown-toggle` | Button to expand/collapse mobile submenus |
| `.dropdown-menu` | The submenu `<ul>` containing child links |
| `.mobile-only` | Items visible only in mobile menu |

---

## CSS Architecture

### Desktop Styles (> 700px)

**Navigation Layout**
```css
.nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
}
```

**Dropdown Toggle Hidden**
```css
.dropdown-toggle {
  display: none; /* Hidden on desktop */
}
```

**Hover-based Dropdowns**
```css
.dropdown-menu {
  position: absolute;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
}

.nav-item.has-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
```

### Mobile Styles (<= 700px)

**Sidebar Menu**
```css
.off-screen-menu {
  position: fixed;
  left: -100%;
  transition: left 0.3s ease;
}

.off-screen-menu.active {
  left: 0;
}
```

**Vertical Stacking**
```css
.nav-menu {
  flex-direction: column;
  align-items: stretch;
}
```

**Toggle Button Visible**
```css
.dropdown-toggle {
  display: flex;
  position: absolute;
  right: 12px;
}
```

**Accordion Submenus**
```css
.dropdown-menu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.nav-item.has-dropdown.expanded .dropdown-menu {
  max-height: 500px;
}
```

---

## JavaScript Functionality

### File: `side-bar.js`

#### 1. Hamburger Menu Toggle
```javascript
function toggleMenu() {
  const isActive = hamMenu.classList.toggle("active");
  offScreenMenu.classList.toggle("active");
  hamMenu.setAttribute('aria-expanded', isActive);
  
  // Prevent body scroll when menu is open
  document.body.style.overflow = isActive ? 'hidden' : '';
}
```

#### 2. Mobile Accordion Behavior
```javascript
toggle.addEventListener('click', (e) => {
  // Only on mobile
  if (window.innerWidth > 700) return;
  
  // Close all other dropdowns (accordion)
  document.querySelectorAll('.nav-item.has-dropdown.expanded').forEach(item => {
    if (item !== navItem) {
      item.classList.remove('expanded');
    }
  });
  
  // Toggle current dropdown
  navItem.classList.toggle('expanded');
});
```

#### 3. Click Outside to Close
```javascript
document.addEventListener('click', (e) => {
  if (
    offScreenMenu.classList.contains('active') &&
    !offScreenMenu.contains(e.target) &&
    !hamMenu.contains(e.target)
  ) {
    // Close menu
  }
});
```

#### 4. Viewport Resize Handler
```javascript
window.addEventListener('resize', () => {
  if (window.innerWidth > 700) {
    // Reset mobile states when switching to desktop
    offScreenMenu.classList.remove('active');
    // Close all accordion dropdowns
  }
});
```

---

## Accessibility Features

### ARIA Attributes
- `aria-label`: Descriptive labels for buttons
- `aria-expanded`: Indicates open/closed state of menus
- `aria-hidden`: Used for decorative SVG icons

### Keyboard Support
- **Tab**: Navigate through menu items
- **Enter/Space**: Activate dropdown toggles
- **Escape**: Close mobile menu (can be added)
- **Focus-within**: Desktop dropdowns open on keyboard focus

### Screen Reader Support
- Semantic HTML (`<nav>`, `<ul>`, `<li>`, `<button>`)
- Proper ARIA labels
- State changes announced via `aria-expanded`

---

## How to Add New Navigation Items

### Adding a Regular Nav Item
```html
<li class="nav-item">
  <a href="new-page.html" class="nav-link">New Page</a>
</li>
```

### Adding a Nav Item with Dropdown
```html
<li class="nav-item has-dropdown">
  <a href="parent-page.html" class="nav-link">Parent Page</a>
  <button class="dropdown-toggle" aria-label="Toggle Parent Page submenu" aria-expanded="false">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 11L3 6h10z"/>
    </svg>
  </button>
  <ul class="dropdown-menu">
    <li><a href="child-1.html">Child Page 1</a></li>
    <li><a href="child-2.html">Child Page 2</a></li>
    <li><a href="child-3.html">Child Page 3</a></li>
  </ul>
</li>
```

**Important**: 
- Always include the `dropdown-toggle` button for mobile functionality
- Use the same SVG icon for consistency
- Update the `aria-label` to match the parent page name

---

## Customization

### Changing Colors
Edit CSS variables in `:root`:
```css
:root {
  --nav-link-color: #223;
  --card-bg: rgba(255,255,255,0.85);
  --glass-line: rgba(10,20,40,0.10);
}
```

### Changing Breakpoint
The mobile/desktop breakpoint is **700px**. To change it:
1. Update media query: `@media (max-width: 700px)`
2. Update JavaScript condition: `if (window.innerWidth > 700)`

### Adjusting Animation Speed
```css
.dropdown-menu {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.off-screen-menu {
  transition: left 0.3s ease;
}
```

### Changing Accordion Behavior
To allow multiple submenus open at once, remove this code from `side-bar.js`:
```javascript
// Remove these lines:
document.querySelectorAll('.nav-item.has-dropdown.expanded').forEach(item => {
  if (item !== navItem) {
    item.classList.remove('expanded');
  }
});
```

---

## Browser Support

- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **IE11**: Not supported (uses CSS Grid, Flexbox, modern JS)
- **Mobile browsers**: Tested on iOS Safari, Chrome Android

---

## Troubleshooting

### Dropdown not appearing on desktop
- Check that `.nav-item.has-dropdown:hover .dropdown-menu` exists in CSS
- Ensure parent has `position: relative`
- Verify `z-index: 100` on dropdown menu

### Mobile accordion not working
- Check that JavaScript is loaded after DOM
- Verify `side-bar.js` is included in HTML
- Check browser console for errors

### Menu not closing on mobile
- Ensure event listeners are properly attached
- Check that `off-screen-menu` class exists
- Verify viewport width detection is working

### Active link not highlighting
- Add `active` class to current page's nav link
- Check CSS specificity for `.nav-link.active`

---

## Performance Notes

- **CSS-only desktop dropdowns**: No JavaScript overhead
- **Passive event listeners**: Used for scroll performance
- **Debounced resize handler**: Prevents excessive function calls
- **Transform animations**: Hardware-accelerated for smooth transitions

---

## Future Enhancements

Potential improvements:
1. **Mega menu** support for more complex submenus
2. **Swipe gestures** to open/close mobile menu
3. **Search integration** in mobile menu
4. **Animation customization** via data attributes
5. **Multi-level nested dropdowns**

---

## Questions or Issues?

If you encounter any problems or need to extend this system, refer to:
- HTML structure in `index.html`
- Desktop styles: `style.css` lines ~301-390
- Mobile styles: `style.css` lines ~2080-2290
- JavaScript: `side-bar.js`

Last updated: December 24, 2025
