const getCustomStyles = () => `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet"></link>
`;

const getCustomScript = (depth) => `
  <script src="${Array(depth).fill('../').join('') + 'index.js'}"></script>
`;

const addCustomScriptAndStyles = (html, depth) => {
  return html
    .replace('</head>', `${getCustomStyles()}</head>`,)
    .replace('</body>', `${getCustomScript(depth)}</body>`);
}

module.exports = {
  getCustomStyles,
  getCustomScript,
  addCustomScriptAndStyles,
};