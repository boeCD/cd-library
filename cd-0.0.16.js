//Version 0.0.8
// Code that runs before DOM is fully loaded
import { logger } from 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/logger-0.0.1.js';

logger.log("Log message from imported logger");


(function() {
    logger.log("Code before DOM is loaded");
})();

    //Darkmode for Favicon
    function setFaviconBasedOnTheme(lightModeIcon, darkModeIcon) {
        logger.log("dynamic favicon init")

    // Function to set favicon
    function setFavicon(url) {
        var link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = url;
    }

    // Check for dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Set dark mode icon
        setFavicon(darkModeIcon);
    } else {
        // Set light mode icon
        setFavicon(lightModeIcon);
    }
    };

    // Function to add click event listeners to elements with 'mirror-click' attribute
    function addMirrorClickListeners() {
        // Get all elements with the 'mirror-click' attribute
        const elementsWithAttribute = document.querySelectorAll('[mirror-click]');
      
        // Add a click event listener to each of them
        elementsWithAttribute.forEach(element => {
          element.addEventListener('click', () => {
            const targetId = element.getAttribute('mirror-click');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              targetElement.click();
              logger.log("targetElement" , {targetElement} , "element", {element})
            }
          });
        });
      }

//Converting CMS Date from Weird to Readable
function cmsDateConversion(){
//Date conversion
document.querySelectorAll('[data-date]').forEach(function(element) {
    logger.log("data-date init")
    var dateText = element.textContent;
    var date = new Date(dateText);
    
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    
    var hours = String(date.getHours()).padStart(2, '0');
    var minutes = String(date.getMinutes()).padStart(2, '0');
    
    var formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    element.textContent = formattedDate;
});

}

// ***** Lenis Smooth Scroll *****
function initLenisLibrary({ duration = 1.2, easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), direction = 'vertical', smooth = true, smoothTouch = false }) {
    // Load the Lenis script from the CDN asynchronously
    loadLenisCDN(function() {
        // After Lenis is loaded, initialize it
        const lenis = new Lenis({
            duration,
            easing,
            direction,
            smooth,
            smoothTouch,
        });

        // Request animation frame to keep Lenis smooth scroll active
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        logger.log('Lenis First INIT');

        // Re-initialize Lenis on body clicks (if necessary)
        document.body.addEventListener('click', function(event) {
            setTimeout(function() {
                lenis.raf(); // Re-activate the Lenis scroll effect if needed
                logger.log('Lenis click INIT', event);
            }, 50);
        });
    });
}

// Now you can call this after the DOM is loaded or wherever appropriate
document.addEventListener('DOMContentLoaded', function () {
    initLenisLibrary({
        duration: 1.5,
        direction: 'horizontal',
        smooth: true,
        smoothTouch: true
    });
});



//______________________________________________________________________________________________________________________________________________________________________________________________________________________________
// Code that runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    logger.log("Code after DOM is loaded");

//end of DOMFinishedLoading
});
