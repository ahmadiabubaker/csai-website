(function(){
  const form = document.getElementById('join-form');
  if(!form) return;

  const ok = document.getElementById('join-success');
  const err = document.getElementById('join-error');
  const scriptURL = 'https://script.google.com/macros/s/AKfycbyBsARMnKbHyQPIaiohb71go01vKsH5jbeg3yf6sIa0AM_RH2ZyTZtBRkVBAGBShadF/exec';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    ok.style.display = 'none';
    err.style.display = 'none';

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true; // disable button immediately
    submitBtn.textContent = "Submitting..."; // feedback to user

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
    } finally {
      // Re-enable button after 3 seconds for safety
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }, 3000);
    }
  });
})();
