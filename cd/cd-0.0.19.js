//Version 0.0.19
// Code that runs before DOM is fully loaded
const logger = {
    log: function(message) {
        this._checkAndLog("log", message);
    },
    info: function(message) {
        this._checkAndLog("info", message);
    },
    warn: function(message) {
        this._checkAndLog("warn", message);
    },
    error: function(message) {
        this._checkAndLog("error", message);
    },
    debug: function(message) {
        this._checkAndLog("debug", message);
    },
    trace: function(message) {
        this._checkAndLog("trace", message);
    },
    group: function(label) {
        this._checkAndLog("group", label);
    },
    groupEnd: function() {
        this._checkAndLog("groupEnd");
    },
    time: function(label) {
        this._checkAndLog("time", label);
    },
    timeEnd: function(label) {
        this._checkAndLog("timeEnd", label);
    },
    count: function(label) {
        this._checkAndLog("count", label);
    },
    countReset: function(label) {
        this._checkAndLog("countReset", label);
    },
    _checkAndLog: function(type, message = "") {
        const body = localStorage.getItem("cd-debug");
        if (body) {
            console[type]("🐙🐙🐙🐙 ", message);
        }
    }
};

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
function loadLenisCDN(callback) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@latest";
    script.defer = true;
    script.onload = callback; // Initialize Lenis after the script is loaded
    document.head.appendChild(script);
}

function initLenisLibrary({ duration = 1.2, easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), direction = 'vertical', smooth = true, smoothTouch = false }) {
    loadLenisCDN(function() {
        function initLenis() {
            const lenis = new Lenis({
                duration,
                easing,
                direction,
                smooth,
                smoothTouch,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }

            requestAnimationFrame(raf);
        
        }
    initLenis(); // Call the init function
    logger.log('Lenis First INIT', event);
        // Add event listener to body
        document.body.addEventListener('click', function(event) {
            setTimeout(function() {
                initLenis(); // Call the init function
                logger.log('Lenis click INIT', event);
            }, 50);
        });
    });
}



//______________________________________________________________________________________________________________________________________________________________________________________________________________________________
// Code that runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    logger.log("Code after DOM is loaded");

//end of DOMFinishedLoading
});
