(function(){
  const form = document.getElementById('join-form');
  if(!form) return;
  const ok = document.getElementById('join-success');
  const err = document.getElementById('join-error');

  const scriptURL = 'https://script.google.com/macros/s/AKfycby77sOsHRtJSgPLoJDY56WJi05F9jFZhsuJETKct2lka-eg6mfXOg1r7YTjvRqhgM5P/exec';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ok.style.display = 'none';
    err.style.display = 'none';

    const formData = new FormData(form);

    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        ok.style.display = 'block';
        form.reset();
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      err.textContent = 'Could not submit form. Try again.';
      err.style.display = 'block';
      console.error('Error!', error.message);
    }
  });
})();
