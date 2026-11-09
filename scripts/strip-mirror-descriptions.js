#!/usr/bin/env node
/**
 * Post-build step: drop the description line from the generated .md mirrors.
 *
 * docusaurus-plugin-llms writes every mirror as
 *
 *     # Title
 *
 *     > The page's description.
 *
 *     Body...
 *
 * and has no option to leave the description out. For a reader who copies or
 * opens a page as Markdown, that line is noise: it summarizes the paragraph
 * right below it. The description still serves the social preview card and
 * the page metadata, which don't read the mirror.
 *
 * This is only safe because every page has a frontmatter `description`
 * (scripts/check-descriptions-source.js fails the build otherwise). Without
 * one the plugin would use the page's first paragraph as the description and
 * remove that paragraph from the body, so stripping the blockquote would
 * delete real content.
 *
 * Even so, a blockquote is removed only when its text equals the frontmatter
 * description of some page under docs/. A mirror whose first block is a quote
 * of its own, or a hand-written static .md file, is left alone, and running
 * the script twice changes nothing the second time.
 *
 * Runs after `docusaurus build`, before scripts/promote-root-static-files.js,
 * so the copies promoted to the site root are the stripped ones. Handles the
 * mirrors under build/en/ and build/ja/. llms-full.txt is not touched.
 *
 * Usage:
 *   node scripts/strip-mirror-descriptions.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseDescription, collectFiles, isGenerated, DOCS_DIR } = require('./check-descriptions-source');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const STATIC_DIR = path.join(__dirname, '..', 'static');
const LOCALES = ['en', 'ja'];

const normalize = (text) => text.replace(/\s+/g, ' ').trim();

/** The normalized description of every page under docs/. */
function collectDescriptions() {
  const descriptions = new Set();
  for (const file of collectFiles(DOCS_DIR)) {
    if (isGenerated(file)) continue;
    const { value } = parseDescription(fs.readFileSync(file, 'utf8'));
    if (value) descriptions.add(normalize(value));
  }
  return descriptions;
}

function collectMirrors(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMirrors(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * Returns the mirror's text without the description blockquote, or null when
 * there is nothing to strip. `unmatched` is set when a blockquote follows the
 * title but its text is not any page's description.
 */
function strip(text, descriptions) {
  const lines = text.split('\n');
  if (!lines[0].startsWith('# ') || lines[1] !== '') return { text: null };

  let end = 2;
  const quoted = [];
  while (end < lines.length && lines[end].startsWith('>')) {
    quoted.push(lines[end].replace(/^>\s?/, ''));
    end++;
  }
  if (quoted.length === 0) return { text: null };
  if (!descriptions.has(normalize(quoted.join('\n')))) return { text: null, unmatched: true };

  // Remove the quote and the blank line after it.
  lines.splice(2, quoted.length + (lines[end] === '' ? 1 : 0));
  return { text: lines.join('\n') };
}

function main() {
  const localeDirs = LOCALES.map((l) => path.join(BUILD_DIR, l)).filter((d) => fs.existsSync(d));
  if (localeDirs.length === 0) {
    console.error(`strip-mirror-descriptions: no build output under ${BUILD_DIR}. Run it after \`docusaurus build\`.`);
    process.exit(1);
  }

  const descriptions = collectDescriptions();
  let stripped = 0;
  let mirrors = 0;
  const unmatched = [];

  for (const dir of localeDirs) {
    for (const file of collectMirrors(dir)) {
      // static/ is copied into every locale's build, .md files included
      // (onboarding-for-agents.md). They are hand-written pages, not mirrors.
      if (fs.existsSync(path.join(STATIC_DIR, path.relative(dir, file)))) continue;

      mirrors++;
      const result = strip(fs.readFileSync(file, 'utf8'), descriptions);
      if (result.text !== null) {
        fs.writeFileSync(file, result.text);
        stripped++;
      } else if (result.unmatched) {
        unmatched.push(path.relative(BUILD_DIR, file));
      }
    }
  }

  console.log(
    `strip-mirror-descriptions: removed the description line from ${stripped} of ${mirrors} .md mirrors ` +
      `(${descriptions.size} distinct descriptions known).`
  );

  if (unmatched.length > 0) {
    console.warn(
      `strip-mirror-descriptions: ${unmatched.length} mirror(s) open with a quote that is not any page's ` +
        `description, so they were left as they are:`
    );
    for (const f of unmatched.slice(0, 10)) console.warn(`  ${f}`);
    if (unmatched.length > 10) console.warn(`  ... and ${unmatched.length - 10} more`);
  }
}

main();
