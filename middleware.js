const path = require('path');

/**
 * Generates custom styles for the HTML content based on the depth of the relative path.
 * @param {{
 *  depth: number
 * }} options 
 * @returns {string} Custom styles as a string
 */
const getCustomStyles = ({ depth }) => {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet"></link>
    <link rel="stylesheet" href="${Array(depth).fill('../').join('') + 'main.css'}">
  `;
};

/**
 * Generates a custom script tag for the HTML content based on the depth of the relative path. 
 * @param {{
 *  depth: number,
 *  genSearchWidgetConfigId: string
 * }} options
 * @returns {string} Custom script tag as a string
 */
const getCustomScript = ({ depth, genSearchWidgetConfigId }) => {
  let customScript = '';

  if (genSearchWidgetConfigId) {
    customScript = `
    <!-- Widget JavaScript bundle -->
    <script src="https://cloud.google.com/ai/gen-app-builder/client?hl=en_US"></script>
    
    <!-- Search widget element is not visible by default -->
    <gen-search-widget
      configId="${genSearchWidgetConfigId}"
      location="us"
      triggerId="searchWidgetTrigger">
    </gen-search-widget>`;
  }

  customScript += `<script src="${Array(depth).fill('../').join('') + 'main.js'}"></script>`;
  return customScript;
};

/**
 * Adds custom script and styles to the HTML content.
 * @param {string} html 
 * @param {{
 *  relativePath: string | null,
 *  genSearchWidgetConfigId: string
 * }} options 
 * @returns {string} HTML with custom script and styles added
 */
const updateContent = (html, { relativePath, genSearchWidgetConfigId }) => {
  const depth = typeof relativePath === "string" ? relativePath.split(path.sep).length - 1 : 0;

  return html
    .replace('</head>', `${getCustomStyles({ depth })}</head>`,)
    .replace('</body>', `${getCustomScript({ depth, genSearchWidgetConfigId })}</body>`)
    .replace(/<div class="toolbar top-nav-on".*?<main/gms, '<main')
    .replace('id="navbar">', 'id="navbar">\n<div class="tool-search"></div>')
    .replace(/<footer class="site-footer">.*?<\/footer>/gms, getFooter());
}

const getFooter = () => {
  return `
    <footer class="site-footer">
      <div class="inner">
        <div class="copyright">
          &copy; ${new Date().getFullYear()} Bitrise Ltd.
        </div>

        <ul class="footer-links">
          <li><a href="https://devcenter.bitrise.io/" rel="noopener">Docs</a></li>
          <li><a href="https://devcenter.bitrise.io/api/v0.1/" target="_blank" rel="noopener">API</a></li>
          <li><a href="https://bitrise.io/pricing" target="_blank" rel="noopener">Pricing</a></li>
          <li><a href="https://bitrise.io/platform/devops/security" target="_blank" rel="noopener">Security</a></li>
          <li><a href="https://bitrise.io/terms" target="_blank" rel="noopener">Terms</a></li>
          <li><a href="https://bitrise.io/privacy" target="_blank" rel="noopener">Privacy</a></li>
          <li><a href="https://bitrise.io/cookie-policy" target="_blank" rel="noopener">Cookie</a></li>
        </ul>
      </div>
    </footer>
  `;
};

module.exports = {
  getCustomStyles,
  getCustomScript,
  updateContent,
  getFooter
};