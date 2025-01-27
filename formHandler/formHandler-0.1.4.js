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
          logDebug('Existing reCAPTCHA script found.');
          existingScript.onload = resolve;
          existingScript.onerror = () => reject(new Error('Failed to load existing reCAPTCHA script.'));
          return;
        }

        logDebug('Adding new reCAPTCHA script...');
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.onload = () => {
          logDebug('reCAPTCHA script successfully loaded.');
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load reCAPTCHA script.'));
        document.head.appendChild(script);
      });
    }

    /**
     * Validate email addresses
     */
    function validateEmails(emailString) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = emailString.split(/[,\s]+/).filter(Boolean);
      const invalidEmails = emails.filter(email => !emailPattern.test(email));
      return { valid: invalidEmails.length === 0, invalidEmails, emails };
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

      const formName = form.getAttribute('name');
      const dataType = form.getAttribute('data-type');
      const customEmail = form.getAttribute('data-form-handler');

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

            const headers = {
              'Content-Type': 'application/json',
              'custom-email': customEmail || 'None',
              'form-name': formName || 'Unnamed',
              'form-type': dataType || 'Generic',
            };

            logDebug('Headers prepared:', headers);

            const formData = new FormData(form);
            formData.append('g-recaptcha-response', token);

            logDebug('Sending data to webhook...', Array.from(formData.entries()));

            return fetch(webhookURL, {
              method: 'POST',
              body: formData,
              headers,
            });
          })
          .then(response => response.json())
          .then(data => {
            logDebug('Webhook response:', data);
            if (data.success) {
              successMessage.style.display = 'block';
              form.style.display = 'none';
            } else {
              throw new Error('Form submission failed.');
            }
          })
          .catch(error => {
            console.error('Error during form submission:', error);
            errorMessage.style.display = 'block';
          })
          .finally(() => {
            // Reset button text
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
