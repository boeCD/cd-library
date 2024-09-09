
# JS Utility Library Documentation

Version 0.0.19

## Overview

This JavaScript utility library provides a collection of useful custom attributes that enhance the functionality of your web pages. Each attribute can be used directly in your HTML markup, and the corresponding JavaScript functions will handle behavior such as class toggling, lazy loading, copying text, smooth scrolling, and more.

### Custom Attributes

#### 1. `boe-toggle-class="className"`
Toggles a class on an element when it is clicked. Use this to dynamically change the style or behavior of elements based on user interaction.

#### Example:
```html
<div boe-toggle-class="active">Click me to toggle class</div>
```

#### 2. `boe-copy-text="elementId"`
Copies the text content from the element with the specified ID to the clipboard when clicked.

#### Example:
```html
<button boe-copy-text="text-element">Copy Text</button>
<p id="text-element">This is the text to copy.</p>
```

#### 3. `boe-lazy-load="imageURL"`
Lazy loads an image when the element scrolls into view, improving performance by deferring the loading of images until needed.

#### Example:
```html
<img boe-lazy-load="path/to/image.jpg" alt="Lazy loaded image">
```

#### 4. `boe-scroll-to="elementId"`
Scrolls smoothly to the element with the specified ID when clicked.

#### Example:
```html
<a boe-scroll-to="section1">Scroll to Section 1</a>
<div id="section1">This is Section 1</div>
```

#### 5. `boe-show-hide="elementId"`
Toggles the visibility of the target element when clicked. This can be used to show or hide content dynamically.

#### Example:
```html
<button boe-show-hide="targetElement">Toggle Visibility</button>
<div id="targetElement" style="display: none;">This is the target element.</div>
```

## Additional Features

### Logger Function
The logger function included in this library replaces standard `console.log` calls with custom logging. The logger logs messages conditionally based on a `localStorage` flag, which can be set to toggle debugging logs.

### Favicon Switching for Dark Mode
This function dynamically switches the favicon based on the user's dark mode preference. This improves user experience and visual consistency with different themes.

### CMS Date Conversion
Automatically converts and formats CMS-generated dates to a human-readable format in the format `DD/MM/YYYY HH:mm` for elements with the `data-date` attribute.

#### Example:
```html
<span data-date="2023-09-09T12:30:00Z">2023-09-09T12:30:00Z</span>
```

### Footer Year Setter
Automatically sets the current year for elements with the `footer-date` attribute. This is useful for setting copyright years dynamically.

#### Example:
```html
<footer>
    <span footer-date=""></span> &copy; All Rights Reserved
</footer>
```

### Lenis Smooth Scrolling
Smooth scrolling functionality is added via the Lenis library. This improves the overall UX of your page, providing a more fluid scrolling experience.

## How to Use

1. Include this JavaScript in your project.
2. Add the appropriate custom attributes to your HTML elements as needed.
3. Enjoy the enhanced functionality!

