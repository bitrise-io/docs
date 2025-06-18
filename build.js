const fs = require('fs').promises;
const path = require('path');
const webpack = require('webpack');
const webpackConfigBuilder = require('./webpack.common.js');
const { publish } = require('./paligo.js');
const { addCustomScriptAndStyles } = require('./middleware.js');

async function processHtmlFiles(basePath, processPath=null) {
  if (!processPath) {
    processPath = basePath;
  }
  let count = 0;
  process.stdout.write(`Processing HTML files in directory: ${path.relative(basePath, processPath)}\n`);
  const entries = await fs.readdir(processPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(processPath, entry.name);
    if (entry.isDirectory()) {
      await processHtmlFiles(basePath, fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      let content = await fs.readFile(fullPath, 'utf8');
      const depth = path.relative(basePath, fullPath).split(path.sep).length - 1;
      content = await addCustomScriptAndStyles(content, depth);
      await fs.writeFile(fullPath, content, 'utf8');
      process.stdout.write(` - ${path.relative(basePath, fullPath)}: done\n`);
      count++;
    }
  }
  process.stdout.write(`Finished processing ${count} HTML files.\n\n`);
}

const webpackBuild = (config) =>  new Promise((resolve, reject) => {
  webpack(config, (err, stats) => {
    if (err || stats.hasErrors()) {
      reject(err || new Error('Webpack build failed'));
    } else {
      resolve(stats);
    }
  });
});

const build = async (publishsetting, outputPath) => {
  process.stdout.write(`Starting build:
  Publish setting: ${JSON.stringify(publishsetting)}
  Output path: ${outputPath}
  `);

  // await publish(publishsetting, outputPath);

  await webpackBuild(webpackConfigBuilder('production', outputPath));

  await processHtmlFiles(outputPath);

  process.stdout.write(`Build completed successfully. Output is in ${outputPath}\n`);
}

build('19', path.join(__dirname, 'deploy')).catch((error) => {
  process.stderr.write(`Error during build: ${error.message}\n`);
  process.exit(1);
});
