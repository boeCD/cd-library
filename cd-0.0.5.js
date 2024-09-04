//Version 0.0.1
// Code that runs before DOM is fully loaded
(function() {
    console.log("🌴🌴🌴🌴🌴🌴Code before DOM is loaded");
})();

    //Darkmode for Favicon
    function setFaviconBasedOnTheme(lightModeIcon, darkModeIcon) {
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
              console.log("targetElement" , {targetElement} , "element", {element})
            }
          });
        });
      }

//Converting CMS Date from Weird to Readable
function cmsDateConversion(){
//Date conversion
document.querySelectorAll('[data-date]').forEach(function(element) {
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



// Code that runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("Code after DOM is loaded");

//end of DOMFinishedLoading
});
