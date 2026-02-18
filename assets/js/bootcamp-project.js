(function(){
  'use strict';

  var dataUrl = 'data/bootcamp-projects.json';

  var titleEl = document.getElementById('bootcamp-project-title');
  var taglineEl = document.getElementById('bootcamp-project-tagline');
  var ownerEl = document.getElementById('bootcamp-project-owner');
  var imgEl = document.getElementById('bootcamp-project-image');
  var descEl = document.getElementById('bootcamp-project-description');

  if(!titleEl || !taglineEl || !ownerEl || !imgEl || !descEl) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get('id') || '';

  function setNotFound(){
    titleEl.textContent = 'Project not found';
    taglineEl.textContent = '';
    ownerEl.textContent = '';
    imgEl.removeAttribute('src');
    imgEl.setAttribute('alt', '');
    descEl.textContent = 'This project link is missing or the project data has not been added yet.';
  }

  if(!id){
    setNotFound();
    return;
  }

  function embeddedProjects(){
    var embedded = window.__BOOTCAMP_PROJECTS__;
    return Array.isArray(embedded) ? embedded : null;
  }

  function loadProjects(){
    if (window.location && window.location.protocol === 'file:') {
      var emb = embeddedProjects();
      if (emb) return Promise.resolve(emb);
      return Promise.reject(new Error('Embedded bootcamp projects not found'));
    }

    return fetch(dataUrl, {cache:'no-store'})
      .then(function(r){
        if(!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .catch(function(err){
        var emb = embeddedProjects();
        if (emb) return emb;
        throw err;
      });
  }

  loadProjects()
    .then(function(list){
      if(!Array.isArray(list)) throw new Error('Invalid data');
      var project = list.find(function(p){ return String(p.id) === String(id); });
      if(!project) return setNotFound();

      titleEl.textContent = project.title || 'Bootcamp Project';
      taglineEl.textContent = project.tagline || '';
      ownerEl.textContent = project.owner ? ('By ' + project.owner) : '';
      descEl.textContent = project.longDescription || project.description || '';

      if(project.image){
        imgEl.src = project.image;
        imgEl.alt = project.imageAlt || project.title || 'Project image';

        if (project.fallbackImage) {
          imgEl.addEventListener('error', function(){
            if (imgEl.getAttribute('data-fallback-applied') === 'true') return;
            imgEl.setAttribute('data-fallback-applied', 'true');
            imgEl.src = project.fallbackImage;
          }, {once:false});
        }
      } else {
        imgEl.removeAttribute('src');
        imgEl.alt = '';
      }
    })
    .catch(setNotFound);
})();
