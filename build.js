const fs = require('fs').promises;
const path = require('path');
const webpack = require('webpack');
const webpackConfigBuilder = require('./webpack.config.js');
const { pathExists, publish } = require('./paligo.js');
const { addCustomScriptAndStyles } = require('./middleware.js');

async function processHtmlFiles(basePath, processPath=null) {
  if (!processPath) {
    processPath = basePath;
  }
  let count = 0;
  const entries = await fs.readdir(processPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(processPath, entry.name);
    if (entry.isDirectory()) {
      count += await processHtmlFiles(basePath, fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      let content = await fs.readFile(fullPath, 'utf8');
      const depth = path.relative(basePath, fullPath).split(path.sep).length - 1;
      content = await addCustomScriptAndStyles(content, depth);
      await fs.writeFile(fullPath, content, 'utf8');
      process.stdout.write(` - ${path.relative(basePath, fullPath)}: done\n`);
      count++;
    }
  }
  return count;
}

const webpackBuild = (config) =>  new Promise((resolve, reject) => {
  webpack(config, (err, stats) => {
    if (err || stats.hasErrors()) {
      reject(stats);
    } else {
      resolve(stats);
    }
  });
});

const build = async (publishsetting, outputPath) => {
  process.stdout.write(`Starting build:
  Publish setting: ${JSON.stringify(publishsetting)}
  Output path: ${outputPath}
\n`);

  // Create and download Paligo production
  await publish(publishsetting, outputPath);

  // Build project with Webpack
  let webpackStats;
  try {
    webpackStats = await webpackBuild(webpackConfigBuilder('production', outputPath));
  } catch (error) {
    webpackStats = error;
  }
  if (webpackStats.hasErrors()) {
    process.stderr.write(`Webpack build failed:\n${webpackStats.toString({ colors: true })}\n\n`);
    throw new Error('Webpack build failed');
  } else {
    process.stdout.write(`Webpack build completed successfully:\n${webpackStats.toString({ colors: true })}\n\n`);
  }

  // Process HTML files to inject custom scripts and styles
  process.stdout.write(`Processing HTML files in directory: ${path.relative(__dirname, outputPath)}\n`);
  const count = await processHtmlFiles(outputPath);
  process.stdout.write(`Finished processing ${count} HTML files.\n\n`);

  process.stdout.write(`Build completed successfully. Output is in ${outputPath}\n`);
}

build('19', path.join(__dirname, 'deploy')).catch((error) => {
  process.stderr.write(`Error during build: ${error.message}\n`);
  process.exit(1);
});
