const fs = require('fs').promises;
const path = require('path');
const { pathExists } = require('./paligo');

/**
 * @typedef {{
 *  url: string,
 *  absoluteUrl: string,
 *  linkText: string,
 *  type: "preview" | "file" | "urn"
 * }} BrokenLink
 */

/**
 * @typedef {{
 *  pageTitle: string,
 *  breadcrumb: Array<string>,
 *  brokenLinks: Array<BrokenLink>
 * }} FileResult
 */

/**
 * @typedef {Record<string, FileResult>} LinkAnalysis
 */

/**
 * Converts a relative URL to an absolute URL.
 * @param {string} relativeUrl
 * @param {string} basePath
 * @returns {string}
 */
function convertToAbsoluteUrl(relativeUrl, basePath) {
  if (relativeUrl.match(/^http/)) {
    return new URL(relativeUrl);
  }
  return new URL(relativeUrl, new URL(basePath, 'https://docs.bitrise.io/').href);
}

/**
 * Analyzes the links in a single HTML file.
 * @param {string} basePath
 * @param {string} fullPath
 * @returns {Promise<FileResult>}
 */
async function analyseLinksInFile(basePath, fullPath) {
  return analyseLinks(await fs.readFile(fullPath, 'utf8'), basePath, fullPath);
}

/**
 * Analyzes the links in the given HTML content.
 * @param {string} content
 * @param {string} basePath
 * @param {string} fullPath
 * @returns {Promise<FileResult>}
 */
async function analyseLinks(content, basePath, fullPath) {
  /** @type {Array<BrokenLink>} */
  const brokenLinks = [];
  const relativePath = path.relative(basePath, fullPath);
  const pageTitle = content.match(/<title>(.*?)<\/title>/)?.[1] || 'Unknown title';
  const breadcrumb = content.match(/<ul class="breadcrumb">(.*?)<\/ul>/s)?.[1] || '';
  const breadcrumbItems = Array.from(breadcrumb.matchAll(/<li class="breadcrumb-link">\s*(.*?)\s*<\/li>/g)).map(match => {
    const link = match[1];
    if (link.match(/href="[^"]*"/)) {
      return link.replace(/href="([^"]*)"/, (_, p1) => {
        return `href="${convertToAbsoluteUrl(p1, relativePath).pathname}"`
      });
    }
    return link;
  });

  const previewLinks = content.match(/href="\/document\/preview\/[0-9]+.*?"[^>]*>(.*?)<\/a>/g);
  if (previewLinks) {
    process.stdout.write(`\nBroken links detected in ${relativePath}:\n`);
    for (let link of previewLinks) {
      const [, url, linkText] = link.match(/href="([^"]*)"[^>]*>(.*?)<\/a>/) || [];
      process.stderr.write(` - ${url}\n   ${linkText}\n`);
      brokenLinks.push({
        url,
        absoluteUrl: new URL(url, 'https://bitrise.paligoapp.com/').href,
        linkText,
        type: 'preview'
      });
    }
  }

  const linkedFilesMatch = content.match(/(src|href)="([^"]*)"[^>]*>(.*?)<\/a>/g);
  if (linkedFilesMatch) {
    for (let match of linkedFilesMatch) {
      const [, , url, linkText] = match.match(/(src|href)="([^"]*)"[^>]*>(.*?)<\/a>/) || [];
      if (!url.match(/^(http|mailto|#|\/)/) || url.match(/^https:\/\/docs\.bitrise\.io/)) {
        const absoluteUrl = convertToAbsoluteUrl(url, relativePath);
        const exists = await pathExists(path.join(basePath, absoluteUrl.pathname));
        if (!exists) {
          if (brokenLinks.length === 0) {
            process.stdout.write(`\nBroken links detected in ${relativePath}:\n`);
          }
          process.stderr.write(` - ${url}\n   ${linkText}\n`);
          brokenLinks.push({
            url,
            absoluteUrl: absoluteUrl.pathname + absoluteUrl.search + absoluteUrl.hash,
            linkText,
            type: url.match(/^urn:/) ? 'urn' : 'file'
          });
        }
      }
    }
  }
  return {
    pageTitle,
    breadcrumb: breadcrumbItems.slice(1),
    brokenLinks
  };
}

/**
 * Analyzes the HTML files in the given directory.
 * @param {string} basePath
 * @param {string|null} processPath
 * @returns {Promise<LinkAnalysis>}
 */
async function analyzeHtmlFiles(basePath, processPath=null) {
  if (!processPath) {
    processPath = basePath;
  }
  /** @type {LinkAnalysis} */
  const linkAnalysis = new Map();
  const entries = await fs.readdir(processPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(processPath, entry.name);
    if (entry.isDirectory()) {
      const subDirLinkAnalysis = await analyzeHtmlFiles(basePath, fullPath);
      Object.keys(subDirLinkAnalysis).forEach(key => {
        linkAnalysis[key] = subDirLinkAnalysis[key];
      });
    } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== '404.html') {
      // process.stdout.write(`Analyzing: ${path.relative(basePath, fullPath)}: \n`);
      const fileAnalysis = await analyseLinksInFile(basePath, fullPath);
      // if (fileCount > 0) process.stdout.write(`${path.relative(basePath, fullPath)} broken links found: ${fileCount}\n\n`);
      if (fileAnalysis.brokenLinks.length > 0) linkAnalysis[path.relative(basePath, fullPath)] = fileAnalysis;
    }
  }
  return linkAnalysis;
}

/**
 * Generates an HTML report of broken links and writes it to outputPath.
 * @param {LinkAnalysis} linkAnalysis - Output from analyzeHtmlFiles
 * @param {string} outputPath - Path to write the HTML report
 * @returns {Promise<void>}
 */
async function generateBrokenLinksReport(linkAnalysis, outputPath) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Broken Links Report</title>
  <link rel="stylesheet" href="/css/_broken_links.css">
</head>
<body>
  <h1>Broken Links Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
`;

  if (Object.keys(linkAnalysis).length === 0) {
    html += '<p class="no-links">No broken links found.</p>';
  } else {
    html += `<h2>${Object.values(linkAnalysis).reduce((acc, curr) => acc + curr.brokenLinks.length, 0)} broken links found in ${Object.keys(linkAnalysis).length} files.</h2>`;
    for (const file of Object.keys(linkAnalysis).sort()) {
      const result = linkAnalysis[file];
      html += `<div class="breadcrumb">
        <span class="counter">${result.brokenLinks.length}</span>
        ${result.breadcrumb.join(' &bull; ')}
        ${result.breadcrumb.length ? ' &bull; ' : ''}
        <a href="${file}" target="_blank"><strong>${result.pageTitle}</strong></a>
      </div>`;
      html += `<ul>`;
      for (const link of result.brokenLinks) {
        html += '<li>';
        if (link.type === 'urn') {
          html += '<img src="/css/image/paligo-logo.png" alt="Paligo" style="filter: grayscale(100%);" />';
          html += `<span class="urn">${link.url}</span> (${link.linkText})`;
        } else if (link.type === 'preview') {
          html += '<img src="/css/image/paligo-logo.png" alt="Paligo" />';
          html += `<a href="${link.absoluteUrl}" target="_blank">${link.url}</a> (${link.linkText})`;
        } else {
          html += '<img src="/favicon.ico" alt="Bitrise" />';
          html += `<a href="${link.url.match(/^http/) ? link.url : link.absoluteUrl}" target="_blank">${link.url.match(/^http/) ? link.url : link.absoluteUrl}</a> (${link.linkText})`;
        }
        html += '</li>';
      }
      html += '</ul>';
    }
  }

  html += '</body></html>';
  await fs.writeFile(outputPath, html, 'utf8');
}

if (require.main === module) {
  if (process.argv[2] && process.argv[3]) {
    analyseLinksInFile(process.argv[2], process.argv[3]);
  } else if (process.argv[2]) {
    const outputPath = path.join(process.argv[2], '_broken_links.html');
    fs.access(outputPath).then(() => {
      process.stdout.write(`Removing existing report: ${outputPath}\n`);
      return fs.unlink(outputPath);
    }).catch(() => Promise.resolve()).then(() => {
      return analyzeHtmlFiles(process.argv[2]);
    }).then(linkAnalysis => {
      process.stdout.write(`Total broken links found: ${Object.values(linkAnalysis).reduce((acc, curr) => acc + curr.brokenLinks.length, 0)}\n`);
      generateBrokenLinksReport(linkAnalysis, path.join(process.argv[2], '_broken_links.html'));
    });
  } else {
    console.error('Usage: node link_analyzer.js <basePath> [fullPath]');
    process.exit(1);
  }
}

module.exports = {
    analyseLinksInFile,
    analyseLinks,
    generateBrokenLinksReport
};
