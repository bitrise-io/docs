const fs = require('fs');
const path = require('path');
const express = require('express');
const webpack = require('webpack');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const webpackConfig = require('./webpack.dev.js');

const hostname = process.argv[3] || '127.0.0.1';
const port = 3333;

const compiler = webpack(webpackConfig);
const devMiddlewareOptions = {
  // writeToDisk: true,
};
const app = express();
app.use(devMiddleware(compiler, devMiddlewareOptions));
if (webpackConfig.mode === 'development') app.use(hotMiddleware(compiler));

// Middleware to inject script tag into HTML files
app.use(async (req, res, next) => {
  const filePath = path.join(__dirname, 'out', req.path === '/' ? 'index.html' : req.path);
  if (path.extname(filePath) === '.html' && fs.existsSync(filePath)) {
    try {
      let html = await fs.promises.readFile(filePath, 'utf8');
      html = html.replace('</body>', '<script src="/index.js"></script></body>');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      next();
    }
  } else {
    next();
  }
});

// Serve static files from /out
app.use(express.static(path.join(__dirname, 'out')));

app.listen(port, hostname, () => {
  process.stdout.write(`Server running at http://${hostname}:${port}/\n`);
});
