
(async function(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const wrap = document.getElementById('post');
  if(!wrap) return;

  const res = await fetch('data/posts.json');
  const posts = await res.json();
  const post = posts.find(p => String(p.id) === String(id)) || posts[0];

  wrap.innerHTML = `
    <h1>${post.title}</h1>
    <div class="meta">${new Date(post.date).toLocaleString()}</div>
    <article>${post.html}</article>
  `;
})();
