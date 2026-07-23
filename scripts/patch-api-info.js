#!/usr/bin/env node
/**
 * Patches the generated *.info.mdx files after `docusaurus gen-api-docs`.
 *
 * The openapi-docs plugin regenerates these files from the spec on every run,
 * discarding manual edits. This script reapplies two fixes automatically for
 * each generated API reference:
 *
 *   1. Adds `displayed_sidebar: <sidebar>` to the frontmatter so the page
 *      renders inside the correct product sidebar.
 *
 *   2. Inserts the license name into the License section, which the plugin
 *      generates as an empty heading. Skipped when the spec has no license or
 *      isn't available as a local file (e.g. it's fetched from a remote URL).
 *
 * Every step is existsSync-guarded and idempotent, so running this after a
 * single-spec regeneration (only one info file present) is safe.
 */

const fs = require('fs');
const path = require('path');

// One entry per generated API reference. `specFile` is a local path used only
// to read the license name; set it to null when the spec is sourced remotely.
const TARGETS = [
  {
    infoFile: '../docs/bitrise-api/api-reference/bitrise-api.info.mdx',
    sidebar: 'bitriseAPISidebar',
    specFile: '../api/bitrise-ci.json',
  },
  {
    // RDE spec is fetched from a live URL, so there's no local file to read the
    // license from. Filename is derived from the spec's info.title.
    infoFile:
      '../docs/bitrise-rde-api/api-reference/bitrise-remote-dev-environments-api.info.mdx',
    sidebar: 'rdeSidebar',
    specFile: null,
  },
];

for (const target of TARGETS) {
  const filePath = path.resolve(__dirname, target.infoFile);
  if (!fs.existsSync(filePath)) {
    console.log(`· ${target.infoFile} not found, skipping`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Inject displayed_sidebar into frontmatter if not already present.
  if (!content.includes('displayed_sidebar:')) {
    content = content.replace(
      /^(---\n[\s\S]*?)(---\n)/m,
      `$1displayed_sidebar: ${target.sidebar}\n$2`,
    );
    console.log(`✔ [${target.sidebar}] added displayed_sidebar`);
  } else {
    console.log(`· [${target.sidebar}] displayed_sidebar already present, skipping`);
  }

  // 2. Fill in the empty License section with the name from the spec.
  const licenseName = readLicenseName(target.specFile);
  if (licenseName) {
    // The plugin generates:  <h3 …>License</h3>\n</div>
    // We insert a <span> with the name between the heading and the closing div.
    const emptyLicensePattern = /([ \t]*<h3[\s\S]*?>[\s\S]*?License[\s\S]*?<\/h3>)([\s\n]*<\/div>)/;
    if (emptyLicensePattern.test(content) && !content.includes(licenseName)) {
      content = content.replace(
        emptyLicensePattern,
        `$1<span>\n    ${licenseName}\n  </span>\n$2`,
      );
      console.log(`✔ [${target.sidebar}] inserted license name: ${licenseName}`);
    } else {
      console.log(`· [${target.sidebar}] license name already present / N/A, skipping`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('✔ Patch complete');

function readLicenseName(specFile) {
  if (!specFile) return null;
  const specPath = path.resolve(__dirname, specFile);
  if (!fs.existsSync(specPath)) return null;
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  return spec?.info?.license?.name ?? null;
}
