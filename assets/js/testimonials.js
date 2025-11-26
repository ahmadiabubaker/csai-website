// Continuous right-to-left testimonial scroller with hover-pause and pointer drag
(function(){
  'use strict';
  var container = document.getElementById('testimonials');
  var track = document.getElementById('testimonials-track');
  if(!container || !track) return;

  // speed in pixels per second
  var speed = 60;
  var paused = false;
  var dragging = false;
  var pointerId = null;
  var startX = 0, startOffset = 0;
  var offset = 0;
  var trackWidth = 0;

  // duplicate children to create a seamless loop until the track is wide enough
  var originals = Array.from(track.children);
  if (originals.length === 0) return;

  function measureOriginalWidth() {
    var total = 0;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.gap || style.columnGap || 16) || 16;
    originals.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      total += r.width;
      if (i !== originals.length - 1) total += gap;
    });
    return total;
  }

  // initial measure (wait a tick for layout)
  setTimeout(function(){
    var originalWidth = measureOriginalWidth();
    // clone until the track is at least container width + one original set
    while (track.scrollWidth < container.clientWidth + originalWidth) {
      originals.forEach(function(n){ track.appendChild(n.cloneNode(true)); });
    }

    // set the width used for wrapping (one set of originals)
    trackWidth = originalWidth;

    // remove any CSS transition to avoid visible jumps when wrapping
    track.style.transition = 'none';
    track.style.willChange = 'transform';

    var lastTime = performance.now();
    function step(now){
      var dt = (now - lastTime) / 1000;
      lastTime = now;
      if(!paused && !dragging){
        offset += speed * dt;
        if (trackWidth && offset >= trackWidth) offset -= trackWidth;
      }
      // apply transform using translate3d for smoother GPU compositing
      track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, 60);

  // hover to pause
  container.addEventListener('mouseenter', function(){ paused = true; });
  container.addEventListener('mouseleave', function(){ if(!dragging) paused = false; });

  // pointer drag to move manually
  track.addEventListener('pointerdown', function(e){
    dragging = true;
    pointerId = e.pointerId;
    track.setPointerCapture(pointerId);
    startX = e.clientX;
    startOffset = offset;
    paused = true;
    track.style.cursor = 'grabbing';
    e.preventDefault();
  });

  track.addEventListener('pointermove', function(e){
    if(!dragging || e.pointerId !== pointerId) return;
    var dx = e.clientX - startX;
    // dragging to the right should move content left (reverse)
    offset = startOffset - dx;
    // normalise
    if(trackWidth){
      // keep offset in the 0..trackWidth range
      offset = ((offset % trackWidth) + trackWidth) % trackWidth;
    }
  });

  function endDrag(e){
    if(e && e.pointerId && e.pointerId !== pointerId) return;
    try{ if(pointerId) track.releasePointerCapture(pointerId); }catch(err){}
    dragging = false; pointerId = null; paused = false; track.style.cursor = 'grab';
  }

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // touch fallback: tapping should not trigger text selection
  track.addEventListener('touchstart', function(){}, {passive:true});

})();
