#!/usr/bin/env node
/**
 * Patches the generated bitrise-api.info.mdx after `docusaurus gen-api-docs`.
 *
 * The openapi-docs plugin regenerates this file from the spec on every run,
 * discarding manual edits. This script reapplies two fixes automatically:
 *
 *   1. Adds `displayed_sidebar: bitriseAPISidebar` to the frontmatter so the
 *      page renders inside the Bitrise API sidebar.
 *
 *   2. Inserts the license name ("MIT") into the License section, which the
 *      plugin generates as an empty heading.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(
  __dirname,
  '../docs/bitrise-api/api-reference/bitrise-api.info.mdx',
);

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject displayed_sidebar into frontmatter if not already present.
if (!content.includes('displayed_sidebar:')) {
  content = content.replace(
    /^(---\n[\s\S]*?)(---\n)/m,
    '$1displayed_sidebar: bitriseAPISidebar\n$2',
  );
  console.log('✔ Added displayed_sidebar to frontmatter');
} else {
  console.log('· displayed_sidebar already present, skipping');
}

// 2. Fill in the empty License section with the name from the spec.
const licenseSpec = path.resolve(__dirname, '../api/bitrise-ci.json');
const spec = JSON.parse(fs.readFileSync(licenseSpec, 'utf-8'));
const licenseName = spec?.info?.license?.name;

if (licenseName) {
  // The plugin generates:  <h3 …>License</h3>\n</div>
  // We insert a <span> with the name between the heading and the closing div.
  const emptyLicensePattern = /([ \t]*<h3[\s\S]*?>[\s\S]*?License[\s\S]*?<\/h3>)([\s\n]*<\/div>)/;
  if (emptyLicensePattern.test(content) && !content.includes(licenseName)) {
    content = content.replace(
      emptyLicensePattern,
      `$1<span>\n    ${licenseName}\n  </span>\n$2`,
    );
    console.log(`✔ Inserted license name: ${licenseName}`);
  } else {
    console.log('· License name already present, skipping');
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✔ Patch complete');
