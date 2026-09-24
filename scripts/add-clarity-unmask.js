#!/usr/bin/env node
/**
 * Adds data-clarity-unmask="true" to the <body> tag of every generated page.
 *
 * Runs as a static-HTML transform (not a client-side script) so the attribute
 * is present in the very first bytes served, before any JavaScript — GTM's
 * async-loaded Clarity tag included — has a chance to run. A client module
 * would only win that race by luck.
 *
 * Runs before scripts/promote-root-static-files.js so the root-level
 * build/404.html it promotes is a copy of the already-transformed
 * build/en/404.html, without needing a second pass over the root.
 */
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '..', 'build');
const BODY_TAG_RE = /<body(\s|>)/i;
const ALREADY_PRESENT_RE = /<body[^>]*\sdata-clarity-unmask=/i;

function walk(dir, onHtmlFile) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, onHtmlFile);
    } else if (entry.name.endsWith('.html')) {
      onHtmlFile(full);
    }
  }
}

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`✖ ${BUILD_DIR} not found. Run "docusaurus build" first.`);
  process.exit(1);
}

let transformed = 0;
let skipped = 0;

walk(BUILD_DIR, (file) => {
  const original = fs.readFileSync(file, 'utf8');

  if (ALREADY_PRESENT_RE.test(original)) {
    skipped += 1;
    return;
  }

  if (!BODY_TAG_RE.test(original)) {
    console.error(`✖ ${file} has no <body> tag — output would be malformed HTML.`);
    process.exit(1);
  }

  const updated = original.replace(BODY_TAG_RE, '<body data-clarity-unmask="true"$1');
  fs.writeFileSync(file, updated);
  transformed += 1;
});

if (transformed === 0 && skipped === 0) {
  console.error('✖ No HTML files were found. The build output layout may have changed.');
  process.exit(1);
}

console.log(`✔ added data-clarity-unmask="true" to ${transformed} page(s)${skipped ? ` (${skipped} already had it)` : ''}`);
