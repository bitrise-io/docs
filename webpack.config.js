const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { getCustomStyles, getCustomScript } = require('./middleware.js');

const redirects = require('./redirect.js');

module.exports = (mode, distPath) => {
  const plugins = [
    new CopyPlugin({
      patterns: [
        "public",
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      customStyles: mode === 'development' ? getCustomStyles() : '',
      customScript: mode === 'development' ? getCustomScript(0) : '',
      copyrightYear: new Date().getFullYear(),
      template: 'src/html/portal.html',
      inject: false,
    }),
  ];
  redirects.forEach((redirect) => {
    plugins.push(new HtmlWebpackPlugin({
      filename: redirect[0],
      redirect: mode === 'development' ? redirect[1].replace("https://devcenter.bitrise.io", "") : redirect[1],
      template: 'src/html/redirect.html',
      inject: false,
    }));
  });
  if (mode === 'development') {
    plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  const srcPath = path.resolve(__dirname, 'src');
  const entryPoints = {};
  fs.readdirSync(path.resolve(srcPath, 'js')).forEach((fileName) => {
    const match = fileName.match(/^(.*)\.js$/);
    if (match) {
      if (mode === 'development') {
        entryPoints[match[1]] = ['webpack-hot-middleware/client', path.join('js', fileName)];
      } else {
        entryPoints[match[1]] = path.join('js', fileName);
      }
    }
  });

  return {
    mode,
    resolve: {
      modules: [srcPath, 'node_modules'],
    },
    plugins,
    entry: entryPoints,
    output: {
      path: distPath,
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  };
};
