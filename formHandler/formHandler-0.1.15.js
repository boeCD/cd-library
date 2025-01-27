(function () {
    const scriptTag = document.currentScript;
    const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
    const webhookURL = scriptTag ? scriptTag.getAttribute('data-action') : null;
    const debugMode = scriptTag.hasAttribute('debug');
  
    // Debugging helper
    function logDebug(message, data) {
      if (debugMode) {
        console.log(`[DEBUG] ${message}`, data || '');
      }
    }
  
    // Log initialization
    logDebug('Site key obtained:', siteKey);
    logDebug('Webhook URL obtained:', webhookURL);
  
    document.addEventListener('DOMContentLoaded', function () {
      logDebug('DOM fully loaded. Initializing script...');
  
      if (!siteKey) {
        console.error('Site key not found in script data-site-key attribute.');
        return;
      }
  
      if (!webhookURL) {
        console.error('Webhook URL not found in script data-action attribute.');
        return;
      }
  
      /**
       * Load reCAPTCHA dynamically if not already loaded
       */
      function loadRecaptcha(siteKey) {
        return new Promise((resolve, reject) => {
          const existingScript = document.querySelector(`script[src*="google.com/recaptcha/api.js"]`);
          if (existingScript) {
            logDebug('Existing reCAPTCHA script found. Reusing it.');
            if (typeof grecaptcha !== 'undefined') {
              grecaptcha.ready(() => {
                logDebug('reCAPTCHA is ready after reusing script.');
                resolve();
              });
            } else {
              reject(new Error('grecaptcha not defined after finding existing script.'));
            }
            return;
          }
  
          logDebug('Adding new reCAPTCHA script...');
          const script = document.createElement('script');
          script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
          script.onload = () => {
            logDebug('reCAPTCHA script successfully loaded.');
            if (typeof grecaptcha !== 'undefined') {
              grecaptcha.ready(() => {
                logDebug('reCAPTCHA is ready after script load.');
                resolve();
              });
            } else {
              reject(new Error('grecaptcha not defined after script load.'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load reCAPTCHA script.'));
          document.head.appendChild(script);
        });
      }
  
      /**
       * Handle form submissions
       */
      function handleFormSubmission(form) {
        logDebug('Processing form:', form);
  
        const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
        const defaultButtonText = submitButton?.value || submitButton?.innerText || 'Submit';
        const loadingText = submitButton?.getAttribute('data-wait') || 'Please wait...';
  
        const successMessage = form.parentElement.querySelector('.w-form-done');
        const errorMessage = form.parentElement.querySelector('.w-form-fail');
  
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          logDebug('Form submission triggered.');
  
          // Set loading state
          if (submitButton) {
            if (submitButton.tagName.toLowerCase() === 'input') {
              submitButton.value = loadingText;
            } else {
              submitButton.innerText = loadingText;
            }
          }
  
          loadRecaptcha(siteKey)
            .then(() => {
              logDebug('Executing reCAPTCHA...');
              return grecaptcha.execute(siteKey, { action: 'submit' });
            })
            .then(token => {
              logDebug('reCAPTCHA token obtained:', token);
  
              const formData = new FormData(form);
              formData.append('g-recaptcha-response', token);
  
              logDebug('Form data prepared:', Array.from(formData.entries()));
  
              return fetch(webhookURL, {
                method: 'POST',
                body: formData,
              });
            })
            .then(response => {
              logDebug('Webhook response received:', response);
              if (response.ok) {
                successMessage.style.display = 'block';
                form.style.display = 'none';
                logDebug('Form submission successful. Success message displayed.');
              } else {
                throw new Error('Form submission failed.');
              }
            })
            .catch(error => {
              console.error('[ERROR] During form submission:', error);
              if (errorMessage) {
                errorMessage.style.display = 'block';
                logDebug('Error message displayed.');
              }
            })
            .finally(() => {
              // Reset button text
              if (submitButton) {
                if (submitButton.tagName.toLowerCase() === 'input') {
                  submitButton.value = defaultButtonText;
                } else {
                  submitButton.innerText = defaultButtonText;
                }
                logDebug('Submit button text reset to default.');
              }
            });
        });
      }
  
      // Process all forms with the `data-form-handler` attribute
      const forms = document.querySelectorAll('form[data-form-handler]');
      if (forms.length > 0) {
        logDebug('Forms found:', forms.length);
        forms.forEach(handleFormSubmission);
      } else {
        logDebug('No forms found with data-form-handler attribute.');
      }
    });
  })();
  