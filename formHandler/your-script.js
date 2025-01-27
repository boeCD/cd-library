(function () {
    // Get the site key from the script's data attribute
    const scriptTag = document.currentScript;
    const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
    console.log('siteKey:', siteKey);
    document.addEventListener('DOMContentLoaded', function () {
      console.log('DOM fully loaded and parsed. Initializing script...');
  
      try {
        if (!siteKey) {
          console.error('Site key not found in script data-site-key attribute.');
          return;
        }
  
        // Rest of your code...
  
      } catch (globalError) {
        console.error('Error initializing script:', globalError);
      }
    });
  })();
  