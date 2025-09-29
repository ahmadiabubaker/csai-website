(function(){
  const form = document.getElementById('unsubscribe-form');
  if(!form) return;

  const ok = document.getElementById('unsub-success');
  const err = document.getElementById('unsub-error');
  
  // Same Google Apps Script URL as newsletter signup
  const scriptURL = 'https://script.google.com/macros/s/AKfycbw-aQN--aUaeeVBLH67I_GbBuIHWwC1Df95rHRRwuM-stSp5biK8dETeY4xcxmJu7uJ/exec';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    ok.style.display = 'none';
    err.style.display = 'none';

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Unsubscribing...";

    const formData = new FormData(form);
    const email = (formData.get('email') || '').trim().toLowerCase();

    // Basic email validation
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      err.textContent = 'Please enter a valid email address.';
      err.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    try {
      // Send unsubscribe request
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('action', 'unsubscribe'); // Add action parameter
      
      console.log('Unsubscribing email:', email);
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const result = await response.text();
      console.log('Response:', result);

      if (response.ok) {
        try {
          const jsonResult = JSON.parse(result);
          if (jsonResult.result === 'success') {
            ok.style.display = 'block';
            form.reset();
          } else {
            throw new Error(jsonResult.error || 'Unknown error');
          }
        } catch (parseError) {
          // Handle non-JSON response
          if (result.includes('success') || result.includes('unsubscribed')) {
            ok.style.display = 'block';
            form.reset();
          } else {
            throw new Error('Unexpected response: ' + result);
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      err.textContent = 'Could not unsubscribe. Please try again or contact us directly.';
      err.style.display = 'block';
      console.error('Unsubscribe error:', error.message);
    } finally {
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }, 2000);
    }
  });
})();