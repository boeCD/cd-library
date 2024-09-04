# JavaScript DOM Event Library

This is a simple JavaScript library that allows you to execute code both **before** and **after** the website's DOM is loaded.

## Features

- **Pre-DOM Execution**: Code can be executed immediately when the script is loaded, even before the DOM is fully ready.
- **Post-DOM Execution**: Code can be executed as soon as the DOM is fully loaded, using the `DOMContentLoaded` event listener.

## Usage

### 1. Include the Script

To use this JavaScript library, include the script in your HTML file as follows:

```html
<script src="path/to/your-library.js"></script>
```
## Dynamic Favicon Based on Theme

This section describes how to dynamically change the favicon based on the user's color scheme preference (light or dark mode).

### Function: `setFaviconBasedOnTheme(lightModeIcon, darkModeIcon)`

This function sets the favicon of the website depending on whether the user has enabled light or dark mode on their device. It uses the `prefers-color-scheme` media query to detect the user's preference.

#### Parameters:
- **`lightModeIcon`**: A string URL pointing to the favicon to be used for light mode.
- **`darkModeIcon`**: A string URL pointing to the favicon to be used for dark mode.

#### Example Usage:

```javascript
setFaviconBasedOnTheme(
    'https://cdn.prod.website-files.com/66b48863d6ba7c12593a03e5/66d5bcb6b0b3a125ce117c5f_render-studio-256-black.png',
    'https://cdn.prod.website-files.com/66b48863d6ba7c12593a03e5/66d5bcb6a839ec800fa8dece_render-studio-256png.png'
);
```
