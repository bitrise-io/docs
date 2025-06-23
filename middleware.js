const path = require('path');

const getCustomStyles = (depth) => {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet"></link>
    <link rel="stylesheet" href="${Array(depth).fill('../').join('') + 'common.css'}">
  `;
};

const getCustomScript = (depth) => {
  return `<script src="${Array(depth).fill('../').join('') + 'common.js'}"></script>\n`;
};

const addCustomScriptAndStyles = (html, relativePath) => {
  const depth = relativePath ? relativePath.split(path.sep).length - 1 : 0;

  let subPage;
  if (relativePath && relativePath.match(/^(en|jp)\/bitrise-platform/)) subPage = 'bitrise-platform';

  return html
    .replace('<body', `<body data-subpage="${subPage || ''}"`)
    .replace('</head>', `${getCustomStyles(depth)}</head>`,)
    .replace('</body>', `${getCustomScript(depth)}</body>`);
}

module.exports = {
  getCustomStyles,
  getCustomScript,
  addCustomScriptAndStyles,
};