(function(){
  const form = document.getElementById('newsletter-form');
  if(!form) return;

  const ok = document.getElementById('newsletter-success');
  const err = document.getElementById('newsletter-error');
  
  // You'll need to create a new Google Apps Script for the newsletter
  // This should point to your newsletter Google Sheet API endpoint
  const scriptURL = 'https://script.google.com/macros/s/AKfycbw-aQN--aUaeeVBLH67I_GbBuIHWwC1Df95rHRRwuM-stSp5biK8dETeY4xcxmJu7uJ/exec';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    ok.style.display = 'none';
    err.style.display = 'none';

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Subscribing...";

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
      // Create URL-encoded form data instead of FormData for better compatibility
      const params = new URLSearchParams();
      params.append('email', email);
      
      console.log('Sending email:', email);
      console.log('To URL:', scriptURL);
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const result = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', result);

      if (response.ok) {
        try {
          const jsonResult = JSON.parse(result);
          if (jsonResult.result === 'success') {
            ok.style.display = 'block';
            form.reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
              ok.style.display = 'none';
            }, 5000);
          } else {
            throw new Error(jsonResult.error || 'Unknown error');
          }
        } catch (parseError) {
          // Handle non-JSON response
          if (result.includes('success') || result.includes('Success')) {
            ok.style.display = 'block';
            form.reset();
            setTimeout(() => {
              ok.style.display = 'none';
            }, 5000);
          } else {
            throw new Error('Unexpected response: ' + result);
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      err.textContent = 'Could not subscribe. Please try again later.';
      err.style.display = 'block';
      console.error('Newsletter subscription error:', error.message);
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        err.style.display = 'none';
      }, 5000);
    } finally {
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }, 2000);
    }
  });
})();