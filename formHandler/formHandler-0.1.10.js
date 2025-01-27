(function () {
    // Get the site key, webhook URL, and debug mode from the script's data attributes
    const scriptTag = document.currentScript;
    const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
    const webhookURL = scriptTag ? scriptTag.getAttribute('data-action') : null;
    const debugMode = scriptTag.hasAttribute('debug');
  
    // Debug logging helper
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
       * Dynamically loads the reCAPTCHA script if not already loaded.
       */
      function loadRecaptcha() {
        return new Promise((resolve, reject) => {
            /*
          if (typeof grecaptcha !== 'undefined') {
            logDebug('reCAPTCHA already loaded.');
            resolve();

          } else  {
            const existingScript = document.querySelector(`script[src*="google.com/recaptcha/api.js"]`);
            if (existingScript) {
              logDebug('reCAPTCHA script already exists in DOM.');
              existingScript.onload = resolve;
              existingScript.onerror = () => reject(new Error('Failed to load existing reCAPTCHA script.'));
              return;
            }
            */
           
            logDebug('Loading reCAPTCHA script...');
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.onload = () => {
              logDebug('reCAPTCHA script successfully loaded.');
              document.head.appendChild(script);
              logDebug('reCAPTCHA added to Head.');
              resolve();
            };
            script.onerror = () => {
              console.error('Failed to load reCAPTCHA script.');
              reject(new Error('Failed to load reCAPTCHA script.'));
            };
          //}
        });
      }
  
      /**
       * Ensures `grecaptcha` is ready before executing.
       */
      function ensureGrecaptchaReady() {
        return new Promise((resolve) => {
          if (typeof grecaptcha !== 'undefined') {
            grecaptcha.ready(() => {
              logDebug('reCAPTCHA is ready.');
              resolve();
            });
          } else {
            logDebug('Waiting for reCAPTCHA to load...');
            setTimeout(() => ensureGrecaptchaReady().then(resolve), 100);
          }
        });
      }
  
      /**
       * Validates email addresses provided in the form attribute.
       */
      function validateEmails(emailString) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emails = emailString.split(/[,\s]+/).filter(Boolean);
        const invalidEmails = emails.filter(email => !emailPattern.test(email));
        return { valid: invalidEmails.length === 0, invalidEmails, emails };
      }
  
      /**
       * Handles form submission logic.
       */
      function handleFormSubmission(form) {
        logDebug('Processing form:', form);
  
        const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
        const defaultButtonText = submitButton?.value || submitButton?.innerText || 'Submit';
        const loadingText = submitButton?.getAttribute('data-wait') || 'Please wait...';
  
        const successMessage = form.parentElement.querySelector('.w-form-done');
        const errorMessage = form.parentElement.querySelector('.w-form-fail');
  
        if (successMessage) successMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
  
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          logDebug('Form submission triggered.');
  
          // Set submit button to loading state
          if (submitButton) {
            if (submitButton.tagName.toLowerCase() === 'input') {
              submitButton.value = loadingText;
            } else {
              submitButton.innerText = loadingText;
            }
          }
  
          loadRecaptcha()
            .then(() => ensureGrecaptchaReady())
            .then(() => {
              logDebug('Executing reCAPTCHA...');
              return grecaptcha.execute(siteKey, { action: 'submit' });
            })
            .then(token => {
              logDebug('reCAPTCHA token obtained:', token);
  
              // Prepare form data
              const formData = new FormData(form);
              formData.append('g-recaptcha-response', token);
  
              logDebug('Sending form data to webhook...', { formData: Array.from(formData.entries()) });
  
              return fetch(webhookURL, {
                method: 'POST',
                body: formData,
              });
            })
            .then(response => {
              logDebug('Webhook response received:', response);
              return response.json();
            })
            .then(data => {
              logDebug('Parsed response data:', data);
  
              if (data.success) {
                logDebug('Form submission successful.');
                if (successMessage) successMessage.style.display = 'block';
                if (form) form.style.display = 'none';
              } else {
                throw new Error('Form submission failed.');
              }
            })
            .catch(error => {
              console.error('Error during form submission:', error);
              if (errorMessage) errorMessage.style.display = 'block';
            })
            .finally(() => {
              // Reset submit button text
              if (submitButton) {
                if (submitButton.tagName.toLowerCase() === 'input') {
                  submitButton.value = defaultButtonText;
                } else {
                  submitButton.innerText = defaultButtonText;
                }
              }
            });
        });
      }
  
      // Find and process all forms
      const forms = document.querySelectorAll('form[data-form-handler]');
      if (forms.length > 0) {
        logDebug('Forms found:', forms.length);
        forms.forEach(handleFormSubmission);
      } else {
        logDebug('No forms found with data-form-handler attribute.');
      }
    });
  })();  

  