
(function(){
  const form = document.getElementById('join-form');
  if(!form) return;
  const ok = document.getElementById('join-success');
  const err = document.getElementById('join-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ok.style.display = 'none'; err.style.display = 'none';

    const data = Object.fromEntries(new FormData(form).entries());
    try{
      // Placeholder: store to localStorage; later we'll swap with Google Sheets Apps Script endpoint
      const current = JSON.parse(localStorage.getItem('csai-members')||'[]');
      current.push({ ...data, ts: new Date().toISOString() });
      localStorage.setItem('csai-members', JSON.stringify(current));
      ok.style.display='block';
      form.reset();
    }catch(ex){
      err.textContent = 'Could not submit form. Try again.';
      err.style.display='block';
    }
  });
})();
