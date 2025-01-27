(function () {
    document.addEventListener('DOMContentLoaded', function () {
      console.log('DOM fully loaded and parsed. Initializing script...');
  
      try {
        // Get the site key from the script's data attribute
        const scriptTag = document.currentScript;
        const siteKey = scriptTag.getAttribute('data-site-key');
  
        if (!siteKey) {
          console.error('Site key not found in script data-site-key attribute.');
          return;
        }
  
        // Load reCAPTCHA script dynamically
        function loadRecaptcha(siteKey) {
          return new Promise((resolve, reject) => {
            if (typeof grecaptcha !== 'undefined') {
              resolve();
            } else {
              const script = document.createElement('script');
              script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            }
          });
        }
  
        // Find all forms that need to be processed
        const forms = document.querySelectorAll('form[action*="your-webhook-endpoint"]');
  
        if (!forms || forms.length === 0) {
          console.log('No forms found with the specified action.');
          return;
        }
  
        forms.forEach(function (form) {
          try {
            // Get the custom email from the form's data attribute
            const customEmail = form.getAttribute('data-custom-email');
            if (customEmail) {
              console.log(`Custom email found: ${customEmail}`);
            } else {
              console.log('No custom email found on the form.');
            }
  
            // Find the submit button and loading text
            const submitButton = form.querySelector('input[type="submit"]');
            if (!submitButton) {
              console.log('Submit button not found in form.');
              return;
            }
  
            const defaultButtonText = submitButton.value;
            const loadingText = submitButton.getAttribute('data-wait') || 'Please wait...';
  
            // Hide success and error messages initially
            const successMessage = form.parentElement.querySelector('.w-form-done');
            const errorMessage = form.parentElement.querySelector('.w-form-fail');
  
            if (successMessage) successMessage.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
  
            // On form submit
            form.addEventListener('submit', function (e) {
              e.preventDefault();
  
              // Set the button text to loading state
              submitButton.value = loadingText;
  
              // Load reCAPTCHA and execute
              loadRecaptcha(siteKey)
                .then(() => {
                  return grecaptcha.execute(siteKey, { action: 'submit' });
                })
                .then(token => {
                  console.log('reCAPTCHA token obtained:', token);
  
                  // Prepare form data
                  const formData = new FormData(form);
                  formData.append('g-recaptcha-response', token);
                  formData.append('site-key', siteKey);
  
                  // Send the custom email if provided
                  if (customEmail) {
                    formData.append('custom-email', customEmail);
                  }
  
                  // Send the form data via fetch
                  return fetch(form.action, {
                    method: 'POST',
                    body: formData,
                  });
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    // Handle success
                    if (successMessage) {
                      form.style.display = 'none';
                      successMessage.style.display = 'block';
                    }
                  } else {
                    // Handle failure
                    if (errorMessage) {
                      errorMessage.style.display = 'block';
                      submitButton.value = defaultButtonText;
                      setTimeout(() => {
                        errorMessage.style.display = 'none';
                      }, 30000);
                    }
                  }
                })
                .catch(error => {
                  console.error('Error during form submission:', error);
                  if (errorMessage) {
                    errorMessage.style.display = 'block';
                    submitButton.value = defaultButtonText;
                    setTimeout(() => {
                      errorMessage.style.display = 'none';
                    }, 30000);
                  }
                });
            });
          } catch (formError) {
            console.error('Error in form processing:', formError);
          }
        });
      } catch (globalError) {
        console.error('Error initializing script:', globalError);
      }
    });
  })();
  