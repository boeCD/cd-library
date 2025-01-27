(function () {
    // Get the site key from the script's data attribute
    const scriptTag = document.currentScript;
    const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
    console.log('Site key obtained:', siteKey);
  
    document.addEventListener('DOMContentLoaded', function () {
      console.log('DOM fully loaded and parsed. Initializing script...');
  
      try {
        if (!siteKey) {
          console.error('Site key not found in script data-site-key attribute.');
          return;
        }
  
        // Define the webhook URL within the script
        const webhookURL = 'https://webhook.creative-directors.com/webhook-test/a03f6fc0-cdb2-4a2d-84ac-05df51e49d7e';
        console.log('Webhook URL:', webhookURL);
  
        // Load reCAPTCHA script dynamically
        function loadRecaptcha(siteKey) {
          console.log('Loading reCAPTCHA script...');
          return new Promise((resolve, reject) => {
            if (typeof grecaptcha !== 'undefined') {
              console.log('reCAPTCHA already loaded.');
              resolve();
            } else {
              const script = document.createElement('script');
              script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
              script.onload = () => {
                console.log('reCAPTCHA script loaded.');
                resolve();
              };
              script.onerror = () => {
                console.error('Failed to load reCAPTCHA script.');
                reject();
              };
              document.head.appendChild(script);
            }
          });
        }
  
        // Find all forms with the data-form-handler attribute
        const forms = document.querySelectorAll('form[data-form-handler]');
        console.log('Forms found with data-form-handler:', forms.length);
  
        if (!forms || forms.length === 0) {
          console.log('No forms found with the data-form-handler attribute.');
          return;
        }
  
        forms.forEach(function (form, index) {
          try {
            console.log(`Processing form ${index + 1}...`);
  
            // Clone the form to remove any existing event listeners
            const formClone = form.cloneNode(true);
            form.parentNode.replaceChild(formClone, form);
            console.log('Form cloned to remove existing event listeners.');
  
            // Remove the form's action attribute to prevent default submission
            formClone.removeAttribute('action');
            console.log('Form action attribute removed.');
  
            // Override the form's submit method
            formClone.submit = function () {
              console.log('Form submit method overridden.');
            };
  
            // Get the custom email from the data-form-handler attribute (if provided)
            const customEmail = formClone.getAttribute('data-form-handler');
            if (customEmail) {
              console.log(`Custom email found: ${customEmail}`);
            } else {
              console.log('No custom email provided; using default settings.');
            }
  
            // Find the submit button and loading text
            const submitButton = formClone.querySelector('input[type="submit"], button[type="submit"]');
            if (!submitButton) {
              console.log('Submit button not found in form.');
              return;
            }
            console.log('Submit button found:', submitButton);
  
            const defaultButtonText = submitButton.value || submitButton.innerText;
            const loadingText = submitButton.getAttribute('data-wait') || 'Please wait...';
            console.log('Default button text:', defaultButtonText);
            console.log('Loading text:', loadingText);
  
            // Hide success and error messages initially
            const successMessage = formClone.parentElement.querySelector('.w-form-done');
            const errorMessage = formClone.parentElement.querySelector('.w-form-fail');
  
            if (successMessage) {
              successMessage.style.display = 'none';
              console.log('Success message element found and hidden.');
            } else {
              console.log('Success message element not found.');
            }
  
            if (errorMessage) {
              errorMessage.style.display = 'none';
              console.log('Error message element found and hidden.');
            } else {
              console.log('Error message element not found.');
            }
  
            // On form submit
            formClone.addEventListener('submit', function (e) {
              e.preventDefault();
              e.stopImmediatePropagation();
              console.log('Form submit event triggered.');
  
              // Set the button text to loading state
              if (submitButton.tagName.toLowerCase() === 'input') {
                submitButton.value = loadingText;
              } else {
                submitButton.innerText = loadingText;
              }
              console.log('Submit button text set to loading state.');
  
              // Load reCAPTCHA and execute
              loadRecaptcha(siteKey)
                .then(() => {
                  console.log('Executing reCAPTCHA...');
                  return new Promise((resolve, reject) => {
                    grecaptcha.ready(() => {
                      grecaptcha.execute(siteKey, { action: 'submit' })
                        .then(token => {
                          resolve(token);
                        })
                        .catch(error => {
                          reject(error);
                        });
                    });
                  });
                })
                .then(token => {
                  console.log('reCAPTCHA token obtained:', token);
  
                  // Prepare form data
                  const formData = new FormData(formClone);
                  formData.append('g-recaptcha-response', token);
                  formData.append('site-key', siteKey);
  
                  // Include the custom email if provided
                  if (customEmail) {
                    formData.append('custom-email', customEmail);
                  }
  
                  console.log('Form data prepared:', Array.from(formData.entries()));
  
                  // Send the form data via fetch to the webhook URL
                  console.log('Sending form data to webhook...');
                  return fetch(webhookURL, {
                    method: 'POST',
                    body: formData,
                  });
                })
                .then(response => {
                  console.log('Response received from webhook:', response);
                  return response.json();
                })
                .then(data => {
                  console.log('Response data:', data);
                  if (data.success) {
                    // Handle success
                    console.log('Form submission successful.');
                    if (successMessage) {
                      formClone.style.display = 'none';
                      successMessage.style.display = 'block';
                      console.log('Success message displayed, form hidden.');
                    }
                  } else {
                    // Handle failure
                    console.log('Form submission failed:', data.message);
                    if (errorMessage) {
                      errorMessage.style.display = 'block';
                      if (submitButton.tagName.toLowerCase() === 'input') {
                        submitButton.value = defaultButtonText;
                      } else {
                        submitButton.innerText = defaultButtonText;
                      }
                      console.log('Error message displayed, submit button text reset.');
                      setTimeout(() => {
                        errorMessage.style.display = 'none';
                        console.log('Error message hidden after 30 seconds.');
                      }, 30000);
                    }
                  }
                })
                .catch(error => {
                  console.error('Error during form submission:', error);
                  if (errorMessage) {
                    errorMessage.style.display = 'block';
                    if (submitButton.tagName.toLowerCase() === 'input') {
                      submitButton.value = defaultButtonText;
                    } else {
                      submitButton.innerText = defaultButtonText;
                    }
                    console.log('Error message displayed due to exception, submit button text reset.');
                    setTimeout(() => {
                      errorMessage.style.display = 'none';
                      console.log('Error message hidden after 30 seconds.');
                    }, 30000);
                  }
                });
            });
            console.log('Form submit event listener attached.');
          } catch (formError) {
            console.error('Error in form processing:', formError);
          }
        });
      } catch (globalError) {
        console.error('Error initializing script:', globalError);
      }
    });
  })();
  