
(async function(){
  const list = document.getElementById('post-list');
  if(!list) return;

  const res = await fetch('data/posts.json');
  const posts = await res.json();

  posts.forEach(p => {
    const el = document.createElement('article');
    el.className = 'post-card';
    el.innerHTML = `
      <div class="meta">${new Date(p.date).toLocaleDateString()}</div>
      <h3><a href="post.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h3>
      <p>${p.excerpt}</p>
    `;
    list.appendChild(el);
  });
})();
