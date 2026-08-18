#!/usr/bin/env node
/**
 * Guard: partials actually expanded in the generated .md mirrors.
 *
 * docusaurus-plugin-llms writes a plain-markdown mirror of every page for AI
 * agents to consume. Pages that pull in a reusable fragment must have that
 * fragment inlined; a literal `<Partial_Foo />` left in the output means the
 * plugin failed to resolve it — which is what the local patch in #121 existed
 * to fix, and what a future version bump could regress.
 *
 * The failure is invisible on the docs site (Docusaurus resolves partials via
 * its own MDX pipeline), so nothing else catches it.
 *
 * Run after `npm run build`:
 *   node scripts/check-generated-partials.js
 *
 * Exit code is non-zero if any generated .md still contains a partial tag.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const PARTIAL_TAG = /<Partial_\w+/g;

function collectMarkdown(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(
      `check-generated-partials: no build/ directory. Run \`npm run build\` first.`
    );
    process.exit(1);
  }

  const files = collectMarkdown(BUILD_DIR);

  if (files.length === 0) {
    console.error(
      `check-generated-partials: build/ has no .md mirrors. Is ` +
        `generateMarkdownFiles still enabled for docusaurus-plugin-llms?`
    );
    process.exit(1);
  }

  const offenders = [];

  for (const file of files) {
    const matches = fs.readFileSync(file, 'utf8').match(PARTIAL_TAG);
    if (matches) {
      offenders.push({ file, tags: [...new Set(matches)] });
    }
  }

  if (offenders.length === 0) {
    console.log(
      `check-generated-partials: ${files.length} generated .md files, ` +
        `no unresolved partial tags.`
    );
    return;
  }

  console.error(
    `check-generated-partials: ${offenders.length} of ${files.length} generated ` +
      `.md files still contain an unresolved partial tag.\n`
  );

  for (const o of offenders.slice(0, 20)) {
    console.error(
      `  ${path.relative(BUILD_DIR, o.file)} — ${o.tags.join(', ')}`
    );
  }

  if (offenders.length > 20) {
    console.error(`  … and ${offenders.length - 20} more`);
  }

  console.error(
    `\ndocusaurus-plugin-llms did not inline these partials. Check that the ` +
      `installed\nversion still resolves '@site/src/partials/*.mdx' imports ` +
      `(see PR #121 and the\npin in package.json).`
  );

  process.exit(1);
}

main();
