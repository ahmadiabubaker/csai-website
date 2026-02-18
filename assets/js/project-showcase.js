// Manual horizontal scroll for project showcase with pointer drag
(function(){
  'use strict';
  var container = document.getElementById('project-showcase');
  var track = document.getElementById('project-showcase-track');
  if(!container || !track) return;

  var dragging = false;
  var pointerId = null;
  var startX = 0;
  var scrollLeft = 0;

  // Enable horizontal scrolling on the container
  container.style.overflowX = 'auto';
  container.style.overflowY = 'hidden';
  container.style.cursor = 'grab';
  
  // Hide scrollbar but keep functionality
  container.style.scrollbarWidth = 'thin'; // For Firefox
  
  // Smooth scrolling
  container.style.scrollBehavior = 'smooth';

  // pointer drag to scroll manually
  container.addEventListener('pointerdown', function(e){
    // Don't start drag if user clicks on a link or button
    if(e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON') return;
    
    dragging = true;
    pointerId = e.pointerId;
    container.setPointerCapture(pointerId);
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
    container.style.scrollBehavior = 'auto'; // Disable smooth scroll while dragging
    e.preventDefault();
  });

  container.addEventListener('pointermove', function(e){
    if(!dragging || e.pointerId !== pointerId) return;
    e.preventDefault();
    var x = e.pageX - container.offsetLeft;
    var walk = (x - startX) * 1.5; // Multiply for faster scroll
    container.scrollLeft = scrollLeft - walk;
  });

  function endDrag(e){
    if(e && e.pointerId && e.pointerId !== pointerId) return;
    try{ if(pointerId) container.releasePointerCapture(pointerId); }catch(err){}
    dragging = false;
    pointerId = null;
    container.style.cursor = 'grab';
    container.style.scrollBehavior = 'smooth'; // Re-enable smooth scroll
  }

  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);
  container.addEventListener('mouseleave', endDrag);

  // Prevent text selection while dragging
  container.addEventListener('selectstart', function(e){
    if(dragging) e.preventDefault();
  });

})();
