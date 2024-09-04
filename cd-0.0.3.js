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

// Code that runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("Code after DOM is loaded");






    
//end of DOMFinishedLoading
});
