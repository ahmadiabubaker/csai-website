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
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const formData = new FormData(form);
    const email = (formData.get('email') || '').trim().toLowerCase();
  const studentId = (formData.get('student_id') || '').trim();

    // ✅ email domain check
    if (!/^[A-Za-z0-9._%+-]+@students\.mccc\.edu$/.test(email)) {
      err.textContent = 'Please use your official school email (firstname.lastname@students.mccc.edu).';
      err.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      return;
    }

    // Optional: student ID validation (digits only, 5-12 chars)
    if (studentId && !/^\d{5,12}$/.test(studentId)) {
      err.textContent = 'Please enter a valid Student ID (digits only).';
      err.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      return;
    }

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
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }, 3000);
    }
  });
})();
