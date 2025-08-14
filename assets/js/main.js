// ===== Scroll rail + active section =====
(function(){
  const rail = document.querySelector('.side-rail');
  if(!rail) return;

  const items = [...rail.querySelectorAll('.rail-item')];
  const targets = items.map(i => document.querySelector(i.getAttribute('href'))).filter(Boolean);
  const progress = rail.querySelector('.rail-progress');

  // Smooth click
  items.forEach(i => {
    i.addEventListener('click', e => {
      e.preventDefault();
      const el = document.querySelector(i.getAttribute('href'));
      el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Active section by viewport center
  function setActive() {
    const mid = window.innerHeight * 0.5;
    let bestIdx = 0, bestDist = Infinity;
    targets.forEach((t, idx) => {
      const r = t.getBoundingClientRect();
      const center = r.top + r.height/2;
      const d = Math.abs(center - mid);
      if(d < bestDist){ bestDist = d; bestIdx = idx; }
    });
    items.forEach(i => i.classList.remove('active'));
    items[bestIdx]?.classList.add('active');
  }

  // Rail progress (overall page scroll)
  function setProgress() {
    const doc = document.documentElement;
    const h = doc.scrollHeight - window.innerHeight;
    const y = window.scrollY || doc.scrollTop || 0;
    const pct = Math.max(0, Math.min(1, h ? y / h : 0));
    if(progress) progress.style.height = (pct * 100) + '%';
  }

  const onScroll = () => { setActive(); setProgress(); };
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

// ===== Parallax accents (mouse) =====
(function(){
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const strength = parseFloat(el.dataset.parallax) || 10;
    window.addEventListener('mousemove', (e) => {
      const { innerWidth:w, innerHeight:h } = window;
      const x = (e.clientX - w/2) / (w/2);
      const y = (e.clientY - h/2) / (h/2);
      el.style.transform = `translate(${x*strength}px, ${y*strength}px)`;
    }, { passive:true });
  });
})();

// ===== Reveal on view =====
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
})();

// ===== Lightweight 3D: hero crystal (glass icosahedron) =====
(function(){
  const canvas = document.getElementById('gl-hero');
  if(!canvas || !window.THREE) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 50);
  camera.position.set(0, 0, 6);

  const geo = new THREE.IcosahedronGeometry(1.4, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.0, roughness: 0.05,
    transmission: 1.0, thickness: 0.8, ior: 1.35, transparent: true,
    attenuationColor: new THREE.Color(0x7A5CFF), attenuationDistance: 4
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // soft lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const k1 = new THREE.DirectionalLight(0x7A5CFF, 1.2); k1.position.set(2,2,3); scene.add(k1);
  const k2 = new THREE.DirectionalLight(0x00E6FF, 0.9); k2.position.set(-3,1,2); scene.add(k2);

  // resize
  function resize(){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  // pointer rotate
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e)=>{
    mx = (e.clientX / window.innerWidth - 0.5) * 0.4;
    my = (e.clientY / window.innerHeight - 0.5) * 0.4;
  }, { passive:true });

  // animate
  renderer.setAnimationLoop((t)=>{
    mesh.rotation.x += 0.003 + (my * 0.02);
    mesh.rotation.y += 0.004 + (mx * 0.02);
    renderer.render(scene, camera);
  });
})();

// ===== 3D accent: crystal box =====
(function(){
  const canvas = document.getElementById('gl-crystal');
  if(!canvas || !window.THREE) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 50);
  camera.position.set(0,0,6);

  const geo = new THREE.BoxGeometry(2.2, 1.2, 1.2, 2,2,2);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.08,
    transmission: 1, thickness: 1, ior: 1.4, transparent:true
  });
  const box = new THREE.Mesh(geo, mat);
  scene.add(box);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const l = new THREE.DirectionalLight(0x00E6FF, 1.2); l.position.set(2,1,3); scene.add(l);

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  renderer.setAnimationLoop(()=>{
    box.rotation.x += 0.01;
    box.rotation.y += 0.012;
    renderer.render(scene, camera);
  });
})();

// ===== 3D accent: parametric math curve =====
(function(){
  const canvas = document.getElementById('gl-curve');
  if(!canvas || !window.THREE) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 50);
  camera.position.set(0,0,8);

  // Lissajous-like curve
  const pts = [];
  const n = 800, a=3, b=2, delta=Math.PI/2.5;
  for(let i=0;i<n;i++){
    const t = i / n * Math.PI * 2;
    const x = Math.sin(a*t + delta) * 2.2;
    const y = Math.sin(b*t) * 0.9;
    const z = Math.cos(a*t) * 0.3;
    pts.push(new THREE.Vector3(x,y,z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0x7A5CFF, transparent:true, opacity:0.9 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  renderer.setAnimationLoop(()=>{
    line.rotation.y += 0.005;
    line.rotation.x += 0.002;
    renderer.render(scene, camera);
  });
})();

// ===== Google Calendar URL (kept from your original) =====
function googleCalendarUrl(ev){
  function fmt(d){ return d.replace(/[-:]/g,'').split('.')[0] + 'Z'; }
  const params = new URLSearchParams({
    action:'TEMPLATE',
    text: ev.title || 'CSAI Event',
    dates: `${fmt(ev.startISO)}/${fmt(ev.endISO)}`,
    details: ev.description || '',
    location: ev.location || ''
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
window.CSAI = { googleCalendarUrl };
