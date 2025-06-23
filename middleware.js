const path = require('path');

/**
 * Generates custom styles for the HTML content based on the depth of the relative path.
 * @param {number} depth 
 * @returns {string} Custom styles as a string
 */
const getCustomStyles = (depth) => {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet"></link>
    <link rel="stylesheet" href="${Array(depth).fill('../').join('') + 'common.css'}">
  `;
};

/**
 * Generates a custom script tag for the HTML content based on the depth of the relative path. 
 * @param {number} depth 
 * @returns {string} Custom script tag as a string
 */
const getCustomScript = (depth) => {
  return `<script src="${Array(depth).fill('../').join('') + 'common.js'}"></script>\n`;
};

/**
 * Adds custom script and styles to the HTML content.
 * @param {string} html 
 * @param {string} relativePath 
 * @returns {string} HTML with custom script and styles added
 */
const addCustomScriptAndStyles = (html, relativePath) => {
  const depth = typeof relativePath === "string" ? relativePath.split(path.sep).length - 1 : 0;

  return html
    .replace('</head>', `${getCustomStyles(depth)}</head>`,)
    .replace('</body>', `${getCustomScript(depth)}</body>`);
}

module.exports = {
  getCustomStyles,
  getCustomScript,
  addCustomScriptAndStyles,
};