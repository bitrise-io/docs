const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { updateContent } = require('./middleware.js');

const redirects = JSON.parse(fs.readFileSync('./redirects.json', 'utf8'));

module.exports = (mode, distPath) => {
  const plugins = [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new CopyPlugin({
      patterns: [
        "public",
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/html/portal.html',
      inject: false,
    })
  ];
  // Object.keys(redirects).filter(sourceUrl => !sourceUrl.endsWith('*')).forEach((sourceUrl) => {
  //   plugins.push(new HtmlWebpackPlugin({
  //     filename: sourceUrl.replace(/^\//, '').replace(/\.html$/, '') + '.html',
  //     redirect: redirects[sourceUrl],
  //     template: 'src/html/redirect.html',
  //     inject: false,
  //   }));
  // });
  if (mode === 'development') {
    plugins.push(new webpack.HotModuleReplacementPlugin());
    
    // Custom plugin to apply updateContent to webpack-generated HTML in dev mode
    plugins.push({
      apply: (compiler) => {
        compiler.hooks.compilation.tap('UpdateContentPlugin', (compilation) => {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            'UpdateContentPlugin',
            (data, cb) => {
              // Apply the same transformations as the middleware
              data.html = updateContent(data.html, {
                relativePath: data.outputName,
                genSearchWidgetConfigId: process.env.GEN_SEARCH_WIDGET_ID || '',
                gtmId: process.env.GTM_ID || '',
                environment: mode
              });
              cb(null, data);
            }
          );
        });
      }
    });
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
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
  };
};
