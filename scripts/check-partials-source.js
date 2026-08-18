#!/usr/bin/env node
/**
 * Guard: no silently-stripped `import` lines in reusable partials.
 *
 * docusaurus-plugin-llms inlines each partial into the generated .md mirrors,
 * and before splicing it removes the partial's own import lines — those
 * reference components (`@theme/Tabs`) that mean nothing in plain markdown.
 *
 * As of 0.5.1 upstream does that with a broad `/^\s*import\s+.*$/gm`, so it
 * deletes ANY line beginning with `import` — including `import Foundation`
 * inside a ```swift fence, or a sentence that happens to start with the word.
 * The docs site itself renders fine (Docusaurus resolves partials its own way);
 * only the AI-facing .md mirror loses the line, with no error and no warning.
 *
 * This script fails the build on the day someone writes such a partial, rather
 * than letting it degrade unnoticed. See scripts/check-links-source.js for the
 * sibling guard on links and anchors — same shape, same no-dependency rule.
 *
 * Usage:
 *   node scripts/check-partials-source.js                 # scan src/partials/
 *   node scripts/check-partials-source.js path/to/a.mdx   # scan specific files
 *
 * Exit code is non-zero if any offending line is found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PARTIALS_DIR = path.join(__dirname, '..', 'src', 'partials');

// A genuine MDX import that upstream is *meant* to strip:
//   import Foo from './bar.mdx';
//   import { Foo } from '@site/src/partials/bar.mdx';
const GENUINE_IMPORT = /^\s*import\s+(?:\w+|\{[^}]*\})\s+from\s+['"][^'"]+['"];?\s*$/;

// Any line the broad upstream regex would delete.
const STRIPPED_BY_UPSTREAM = /^\s*import\s/;

function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  let files;

  if (args.length > 0) {
    files = args.map((f) => path.resolve(f));
  } else if (fs.existsSync(PARTIALS_DIR)) {
    files = collectFiles(PARTIALS_DIR);
  } else {
    console.error(`No partials directory at ${PARTIALS_DIR}`);
    process.exit(1);
  }

  const problems = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (STRIPPED_BY_UPSTREAM.test(line) && !GENUINE_IMPORT.test(line)) {
        problems.push({ file, line: i + 1, text: line.trim() });
      }
    });
  }

  const scanned = `${files.length} file${files.length === 1 ? '' : 's'}`;

  if (problems.length === 0) {
    console.log(`check-partials-source: ${scanned} scanned, no stripped imports.`);
    return;
  }

  console.error(
    `check-partials-source: ${problems.length} line(s) would be silently removed ` +
      `from the generated .md mirrors.\n`
  );

  for (const p of problems) {
    console.error(`  ${path.relative(process.cwd(), p.file)}:${p.line}`);
    console.error(`    ${p.text}`);
  }

  console.error(
    `\ndocusaurus-plugin-llms strips every line starting with \`import\` when it ` +
      `inlines a partial.\nMove the snippet to a page instead of a partial, or ` +
      `reorder the sample so no line begins with \`import\`.\n` +
      `Upstream fix: apply maskCodeSegments() around the import strip in ` +
      `lib/content.js resolvePartialImports().`
  );

  process.exit(1);
}

main();
