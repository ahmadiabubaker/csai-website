(function(){
  'use strict';

  var dataUrl = 'data/bootcamp-projects.json';
  var scroller = document.getElementById('bootcamp-showcase');
  var track = document.getElementById('bootcamp-showcase-track');
  var links = document.getElementById('bootcamp-project-links');

  if(!scroller || !track || !links) return;

  function escapeHtml(str){
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function attachDragScroll(el){
    var isDown = false;
    var startX = 0;
    var startScrollLeft = 0;
    var moved = false;
    var pointerId = null;

    el.addEventListener('pointerdown', function(e){
      // allow right click / non-primary to do normal behavior
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      el.classList.add('is-dragging');
      el.setPointerCapture(pointerId);
    });

    el.addEventListener('pointermove', function(e){
      if(!isDown || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      el.scrollLeft = startScrollLeft - dx;
      e.preventDefault();
    });

    function endDrag(e){
      if(!isDown) return;
      if(e && pointerId !== null && e.pointerId !== pointerId) return;
      isDown = false;
      try { el.releasePointerCapture(pointerId); } catch (err) {}
      el.classList.remove('is-dragging');
      pointerId = null;
      // keep moved flag around briefly to prevent accidental link clicks
      setTimeout(function(){ moved = false; }, 0);
    }

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    // Prevent click-through when the user was dragging
    el.addEventListener('click', function(e){
      if(moved){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // improve touch behavior
    el.addEventListener('touchstart', function(){}, {passive:true});
  }

  function projectHref(id){
    return 'bootcamp-project.html?id=' + encodeURIComponent(id);
  }

  function render(projects){
    track.innerHTML = '';
    links.innerHTML = '';

    projects.forEach(function(p){
      var id = p.id || '';
      var title = p.title || 'Untitled Project';
      var owner = p.owner || 'CSAI';
      var tagline = p.tagline || '';
      var desc = p.description || '';
      var img = p.image || '';
      var fallbackImg = p.fallbackImage || '';
      var alt = p.imageAlt || title;

      var card = document.createElement('a');
      card.className = 'showcase-card';
      card.href = projectHref(id);

      card.innerHTML =
        '<figure class="showcase-figure">' +
          '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(alt) + '" loading="lazy" />' +
        '</figure>' +
        '<div class="showcase-body">' +
          '<h4 class="showcase-title">' + escapeHtml(title) + '</h4>' +
          (tagline ? ('<p class="showcase-tagline">' + escapeHtml(tagline) + '</p>') : '') +
          '<p class="showcase-owner">' + escapeHtml(owner) + '</p>' +
          '<p class="showcase-desc">' + escapeHtml(desc) + '</p>' +
        '</div>';

      // Fallback to SVG placeholder if the PNG isn't present yet
      if (fallbackImg) {
        var imgEl = card.querySelector('img');
        if (imgEl) {
          imgEl.addEventListener('error', function(){
            // prevent infinite error loop
            if (imgEl.getAttribute('data-fallback-applied') === 'true') return;
            imgEl.setAttribute('data-fallback-applied', 'true');
            imgEl.src = fallbackImg;
          });
        }
      }

      track.appendChild(card);

      var li = document.createElement('li');
      li.innerHTML = '<a href="' + escapeHtml(projectHref(id)) + '">' + escapeHtml(title) + ' — ' + escapeHtml(owner) + '</a>';
      links.appendChild(li);
    });

    attachDragScroll(scroller);
  }

  function embeddedProjects(){
    var embedded = window.__BOOTCAMP_PROJECTS__;
    return Array.isArray(embedded) ? embedded : null;
  }

  function loadProjects(){
    // When opened via file://, fetch() for local JSON is blocked by browsers.
    if (window.location && window.location.protocol === 'file:') {
      var emb = embeddedProjects();
      if (emb) return Promise.resolve(emb);
      return Promise.reject(new Error('Embedded bootcamp projects not found'));
    }

    return fetch(dataUrl, {cache:'no-store'})
      .then(function(r){
        if(!r.ok) throw new Error('Failed to load ' + dataUrl);
        return r.json();
      })
      .catch(function(err){
        // If fetch fails (offline / blocked / wrong path), fall back to embedded data.
        var emb = embeddedProjects();
        if (emb) return emb;
        throw err;
      });
  }

  loadProjects()
    .then(function(data){
      if(!Array.isArray(data)) throw new Error('Invalid project data');
      render(data);
    })
    .catch(function(){
      track.innerHTML = '<div class="showcase-empty">Project data not available yet.</div>';
      links.innerHTML = '<li>Project list not available yet.</li>';
    });
})();
