const path = require('path');

/**
 * Generates custom styles for the HTML content based on the depth of the relative path.
 * @param {{
 *  depth: number
 * }} options 
 * @returns {string} Custom styles as a string
 */
const getCustomStyles = ({ depth, gtmId, environment }) => {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet"></link>
    <link rel="stylesheet" href="${`${Array(depth).fill('../').join('')}main.css?v=${Date.now()}`}" />

    ${environment !== 'development' ? `
    <link rel="preconnect" href="https://cdn.cookielaw.org/">
    <link rel="preload" href="https://cdn.cookielaw.org/consent/74dfda25-8e61-4fab-9330-4718635e7050/OtAutoBlock.js" as="script">
    <link rel="preload" href="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js" as="script">
    <script type="text/javascript" src="https://cdn.cookielaw.org/consent/74dfda25-8e61-4fab-9330-4718635e7050/OtAutoBlock.js" ></script>
    <script src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"  type="text/javascript" charset="UTF-8" data-domain-script="74dfda25-8e61-4fab-9330-4718635e7050" ></script>

    ` : ''}

    ${environment !== 'development' && gtmId ? `<script>
      const gtmContainerId = '${gtmId}';
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;
      // NOTE: Manual OneTrust categorization override to unblock gtm.js loading
      j.setAttribute('class','optanon-category-C0002'); 
      f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer',gtmContainerId);
    </script>
  
    ` : ''}
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

  customScript += `<script src="${`${Array(depth).fill('../').join('')}main.js?v=${Date.now()}`}" type="text/javascript"></script>`;
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
const updateContent = (html, { relativePath, genSearchWidgetConfigId, gtmId, environment }) => {
  const depth = typeof relativePath === "string" ? relativePath.split(path.sep).length - 1 : 0;

  return html
    // Below is already done for pages rendered by webpack
    .replace(/devcenter\.bitrise\.io/, 'docs.bitrise.io')
    .replace('<script src="js/fuzzydata.js" type="text/javascript"></script>', '')
    .replace(/<div class="toolbar top-nav-on".*?<main/gms, '<div class="toolbar"></div><main')
    .replace('id="navbar">', 'id="navbar">\n<div class="tool-search"></div>')
    .replace(/<script\s+[^>]*src="[^"]*js\/layout-custom-script\.js(\?[^"]*)?"[^>]*><\/script>/g, '')

    // Below is embedded through template variables for pages rendered by webpack
    .replace(/<footer class="site-footer">.*?<\/footer>/gms, getFooter())
    .replace('</head>', `${getCustomStyles({ depth, gtmId, environment })}</head>`,)
    .replace('</body>', `${getCustomScript({ depth, genSearchWidgetConfigId })}</body>`);
}

const getFooter = () => {
  return `
    <footer class="site-footer">
      <div class="inner">
        <div class="copyright">
          &copy; ${new Date().getFullYear()} Bitrise Ltd.
        </div>

        <ul class="footer-links">
          <li><a href="https://docs.bitrise.io/" rel="noopener">Docs</a></li>
          <li><a href="https://docs.bitrise.io/en/bitrise-ci/api.html" target="_blank" rel="noopener">API</a></li>
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