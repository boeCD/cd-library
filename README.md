
# JavaScript Utility Library

**Version**: 0.0.1

This is a JavaScript utility library that performs various actions such as running code before and after the DOM is loaded, setting favicons based on the user's theme preference, adding click event listeners to mirrored elements, and converting CMS dates to a readable format.

## Features

1. **Pre-DOM Load Code Execution**: Execute code immediately upon loading, before the DOM is fully parsed.
2. **Dark Mode Favicon**: Dynamically set favicons based on the user's color scheme (dark or light mode).
3. **Mirror Click Listeners**: Automatically forward click events from one element to another.
4. **CMS Date Conversion**: Converts dates stored in an odd format into a human-readable format.

---

## 1. Pre-DOM Load Code Execution

This code runs before the DOM is fully loaded. It is useful for initializing variables or logging pre-DOM events.

```javascript
(function() {
    console.log("🌴🌴🌴🌴🌴🌴Code before DOM is loaded");
})();
```

---

## 2. Dynamic Favicon Based on Theme

This function dynamically sets the favicon depending on whether the user has a light or dark theme. It uses the `prefers-color-scheme` media query to detect the user's theme preference.

### Usage:

```javascript
setFaviconBasedOnTheme(lightModeIcon, darkModeIcon);
```

### Parameters:
- **`lightModeIcon`**: URL for the light mode favicon.
- **`darkModeIcon`**: URL for the dark mode favicon.

### Example:

```javascript
setFaviconBasedOnTheme(
    'https://cdn.example.com/light-mode-icon.png',
    'https://cdn.example.com/dark-mode-icon.png'
);
```

---

## 3. Mirror Click Listeners

This function adds a click event listener to elements that have a `mirror-click` attribute. When clicked, it triggers a click on the target element specified in the attribute.

### Usage:

1. Add the `mirror-click` attribute to any HTML element and specify the target element's ID.
2. Call the `addMirrorClickListeners()` function.

### Example:

```html
<button mirror-click="target-element">Click Me</button>
<div id="target-element">Target Element</div>
```

```javascript
addMirrorClickListeners();
```

---

## 4. CMS Date Conversion

This function converts dates in a non-standard format into a readable format (`DD/MM/YYYY HH:mm`) and updates the text content of elements with the `data-date` attribute.

### Usage:

1. Add the `data-date` attribute to any HTML element that contains a date string.
2. Call the `cmsDateConversion()` function to convert the dates.

### Example:

```html
<div data-date="2024-09-03T10:15:00Z">2024-09-03T10:15:00Z</div>
```

```javascript
cmsDateConversion();
```

The date will be converted and displayed as `03/09/2024 10:15`.

---

## 5. Post-DOM Load Code Execution

The following code runs once the DOM has fully loaded and is ready. You can add your custom code inside this `DOMContentLoaded` event listener.

```javascript
document.addEventListener("DOMContentLoaded", function() {
    console.log("Code after DOM is loaded");
});
```

---

## Installation

You can include this script in your HTML file as follows:

```html
<script src="path/to/your-library.js"></script>
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Feel free to contribute by opening an issue or submitting a pull request. To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push your branch (`git push origin feature-branch`).
5. Open a pull request.
