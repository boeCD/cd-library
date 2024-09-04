//Version 0.0.1
// Code that runs before DOM is fully loaded
(function() {
    console.log("🌴🌴🌴🌴🌴🌴🌴Code before DOM is loaded");
})();

// Code that runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("Code after DOM is loaded");
});
