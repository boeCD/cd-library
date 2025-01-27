(function () {
    // Get the site key from the script's data attribute
    const scriptTag = document.currentScript;
    const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
  
    document.addEventListener('DOMContentLoaded', function () {
      console.log('DOM fully loaded and parsed. Initializing script...');
  
      try {
        if (!siteKey) {
          console.error('Site key not found in script data-site-key attribute.');
          return;
        }
  
        // Define the webhook URL within the script
        const webhookURL = 'https://webhook.creative-directors.com/webhook-test/a03f6fc0-cdb2-4a2d-84ac-05df51e49d7e';
  
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
  
        // Find all forms with the data-form-handler attribute
        const forms = document.querySelectorAll('form[data-form-handler]');
  
        if (!forms || forms.length === 0) {
          console.log('No forms found with the data-form-handler attribute.');
          return;
        }
  
        forms.forEach(function (form) {
          try {
            // Get the custom email from the data-form-handler attribute (if provided)
            const customEmail = form.getAttribute('data-form-handler');
            if (customEmail) {
              console.log(`Custom email found: ${customEmail}`);
            } else {
              console.log('No custom email provided; using default settings.');
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
                .then(() => grecaptcha.execute(siteKey, { action: 'submit' }))
                .then(token => {
                  console.log('reCAPTCHA token obtained:', token);
  
                  // Prepare form data
                  const formData = new FormData(form);
                  formData.append('g-recaptcha-response', token);
                  formData.append('site-key', siteKey);
  
                  // Include the custom email if provided
                  if (customEmail) {
                    formData.append('custom-email', customEmail);
                  }
  
                  // Send the form data via fetch to the webhook URL
                  return fetch(webhookURL, {
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
  