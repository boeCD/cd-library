(function () {
  const scriptTag = document.currentScript;
  const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
  const webhookURL = scriptTag ? scriptTag.getAttribute('data-action') : null;
  const debugMode = scriptTag.hasAttribute('debug');

  if (debugMode) {
    console.log('Site key obtained:', siteKey);
    console.log('Webhook URL obtained:', webhookURL);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (debugMode) console.log('DOM fully loaded. Initializing script...');

    if (!siteKey) {
      console.error('Site key not found in script data-site-key attribute.');
      return;
    }

    if (!webhookURL) {
      console.error('Webhook URL not found in script data-action attribute.');
      return;
    }

    /**
     * Dynamically loads the reCAPTCHA script and waits for `grecaptcha` readiness.
     */
    function loadRecaptcha() {
      return new Promise((resolve, reject) => {
        if (typeof grecaptcha !== 'undefined') {
          if (debugMode) console.log('reCAPTCHA already loaded.');
          resolve();
        } else {
          const existingScript = document.querySelector(`script[src*="google.com/recaptcha/api.js"]`);
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.onload = () => {
              if (debugMode) console.log('reCAPTCHA script successfully loaded.');
              resolve();
            };
            script.onerror = () => {
              console.error('Failed to load reCAPTCHA script.');
              reject(new Error('Failed to load reCAPTCHA script.'));
            };
            document.head.appendChild(script);
          } else {
            if (debugMode) console.log('reCAPTCHA script already in the DOM.');
            existingScript.onload = resolve;
            existingScript.onerror = reject;
          }
        }
      });
    }

    /**
     * Validates email addresses.
     */
    function validateEmails(emailString) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = emailString.split(/[,\s]+/).filter(Boolean);
      const invalidEmails = emails.filter(email => !emailPattern.test(email));
      return { valid: invalidEmails.length === 0, invalidEmails, emails };
    }

    /**
     * Handles form submission.
     */
    function handleFormSubmission(form) {
      if (debugMode) console.log('Processing form:', form);

      const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
      const defaultButtonText = submitButton?.value || submitButton?.innerText || 'Submit';
      const loadingText = submitButton?.getAttribute('data-wait') || 'Please wait...';

      const successMessage = form.parentElement.querySelector('.w-form-done');
      const errorMessage = form.parentElement.querySelector('.w-form-fail');

      if (successMessage) successMessage.style.display = 'none';
      if (errorMessage) errorMessage.style.display = 'none';

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (debugMode) console.log('Form submission triggered.');

        // Set submit button to loading state
        if (submitButton) {
          if (submitButton.tagName.toLowerCase() === 'input') {
            submitButton.value = loadingText;
          } else {
            submitButton.innerText = loadingText;
          }
        }

        loadRecaptcha()
          .then(() => {
            if (debugMode) console.log('Executing reCAPTCHA...');
            return grecaptcha.execute(siteKey, { action: 'submit' });
          })
          .then(token => {
            if (debugMode) console.log('reCAPTCHA token obtained:', token);

            // Prepare form data
            const formData = new FormData(form);
            formData.append('g-recaptcha-response', token);

            if (debugMode) console.log('Sending form data to webhook...');
            return fetch(webhookURL, {
              method: 'POST',
              body: formData,
            });
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              if (debugMode) console.log('Form submission successful.');
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
      if (debugMode) console.log('Forms found:', forms.length);
      forms.forEach(handleFormSubmission);
    } else {
      if (debugMode) console.log('No forms found with data-form-handler attribute.');
    }
  });
})();
