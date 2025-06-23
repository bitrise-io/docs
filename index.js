const fs = require('fs');
const path = require('path');
const express = require('express');
const webpack = require('webpack');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const webpackConfigBuilder = require('./webpack.config.js');
const { addCustomScriptAndStyles } = require('./middleware.js');

const hostname = process.argv[3] || '127.0.0.1';
const port = 3333;

const outputPath = path.join(__dirname, 'out');

const webpackConfig = webpackConfigBuilder('development', outputPath);
const compiler = webpack(webpackConfig);
const devMiddlewareOptions = {
  // writeToDisk: true,
};
const app = express();

app.use(devMiddleware(compiler, devMiddlewareOptions));
if (webpackConfig.mode === 'development') app.use(hotMiddleware(compiler));

// Middleware to inject script tag into HTML files
app.use(async (req, res, next) => {
  let filePath = path.join(outputPath, req.path === '/' ? 'index.html' : req.path);
  if (path.extname(filePath) === '' && fs.existsSync(`${filePath}.html`)) {
    filePath += '.html';
  }
  if (path.extname(filePath) === '.html' && fs.existsSync(filePath)) {
    try {
      const html = await fs.promises.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(addCustomScriptAndStyles(html, path.relative(outputPath, filePath)));
    } catch (err) {
      next();
    }
  } else {
    next();
  }
});

// Serve static files from /out
app.use(express.static(outputPath));

app.listen(port, hostname, () => {
  process.stdout.write(`Server running at http://${hostname}:${port}/\n`);
});
