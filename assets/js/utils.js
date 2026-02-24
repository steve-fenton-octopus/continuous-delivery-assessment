/**
 * Utility functions for the assessment tool.
 */

/**
 * Helper to fetch CSS variables from the :root.
 * @param {string} name Variable name without -- prefix.
 */
export function getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/**
 * Converts newline characters (\r\n or \n) in a string to HTML <br> elements.
 * @param {string} str
 * @returns {string}
 */
export function nl2br(str) {
    return String(str ?? '').replace(/\r\n|\n/g, '<br>');
}
