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
    <link rel="stylesheet" href="${Array(depth).fill('../').join('') + 'main.css'}">
  `;
};

/**
 * Generates a custom script tag for the HTML content based on the depth of the relative path. 
 * @param {number} depth 
 * @returns {string} Custom script tag as a string
 */
const getCustomScript = (depth) => {
  return `<script src="${Array(depth).fill('../').join('') + 'main.js'}"></script>\n`;
};

/**
 * Adds custom script and styles to the HTML content.
 * @param {string} html 
 * @param {string} relativePath 
 * @returns {string} HTML with custom script and styles added
 */
const updateContent = (html, relativePath) => {
  const depth = typeof relativePath === "string" ? relativePath.split(path.sep).length - 1 : 0;

  return html
    .replace('</head>', `${getCustomStyles(depth)}</head>`,)
    .replace('</body>', `${getCustomScript(depth)}</body>`)
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