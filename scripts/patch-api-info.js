#!/usr/bin/env node
/**
 * Patches generated files after `docusaurus gen-api-docs`.
 *
 * The openapi-docs plugin regenerates these files from the spec on every run,
 * discarding manual edits. This script reapplies fixes automatically for each
 * generated API reference:
 *
 *   1. Adds `displayed_sidebar: <sidebar>` to the info doc's frontmatter so
 *      the page renders inside the correct product sidebar.
 *
 *   2. Inserts the license name into the License section, which the plugin
 *      generates as an empty heading. Skipped when the spec has no license or
 *      isn't available as a local file (e.g. it's fetched from a remote URL).
 *
 *   3. Normalizes operation titles generated straight from the spec's
 *      `summary` field, which mixes imperative ("Create a preset") and
 *      third-person-singular ("Creates a preset") verb forms depending on how
 *      each endpoint's summary was written upstream. Strips a trailing period
 *      and the trailing "s" off a third-person-singular leading verb, so
 *      every title reads as an imperative ("Creates a preset." -> "Create a
 *      preset"). Applied to each *.api.mdx file's title/sidebar_label/heading
 *      and the matching label in that directory's sidebar.ts.
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
  {
    infoFile: '../docs/release-management-api/apps/api-reference/release-management-api.info.mdx',
    sidebar: 'releaseManagementSidebar',
    specFile: '../api/bitrise-rm-apps.json',
  },
  {
    infoFile:
      '../docs/release-management-api/store-releases/api-reference/release-management-api-app-versions.info.mdx',
    sidebar: 'releaseManagementSidebar',
    specFile: '../api/bitrise-rm-store-releases.json',
  },
  {
    infoFile:
      '../docs/release-management-api/code-push/api-reference/release-management-api-codepush.info.mdx',
    sidebar: 'releaseManagementSidebar',
    specFile: '../api/bitrise-rm-code-push.json',
  },
  {
    infoFile:
      '../docs/release-management-api/build-distributions/api-reference/release-management-api-build-distributions.info.mdx',
    sidebar: 'releaseManagementSidebar',
    specFile: '../api/bitrise-rm-build-distributions.json',
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

  // 3. Normalize operation titles in every *.api.mdx sibling of this info file.
  normalizeOperationTitles(path.dirname(filePath));
}

console.log('✔ Patch complete');

function readLicenseName(specFile) {
  if (!specFile) return null;
  const specPath = path.resolve(__dirname, specFile);
  if (!fs.existsSync(specPath)) return null;
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  return spec?.info?.license?.name ?? null;
}

// Strip a lone trailing period, then fix a leading third-person-singular verb
// ("Gets" -> "Get"). Guards against words ending in a doubled "s" (Access,
// Process, …), which aren't third-person-singular verbs and would otherwise
// get mangled.
function normalizeTitle(title) {
  let t = title.trim();
  if (t.endsWith('.') && !t.endsWith('..')) {
    t = t.slice(0, -1);
  }
  t = t.replace(/^([A-Z][a-z]+)s(\s|$)/, (whole, verb, ws) => {
    if (verb.endsWith('s')) return whole;
    return verb + ws;
  });
  return t;
}

function normalizeOperationTitles(dir) {
  const apiFiles = fs.readdirSync(dir).filter(f => f.endsWith('.api.mdx'));
  const sidebarPath = path.join(dir, 'sidebar.ts');
  let sidebarContent = fs.existsSync(sidebarPath) ? fs.readFileSync(sidebarPath, 'utf-8') : null;
  let changedCount = 0;

  for (const file of apiFiles) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^title: "(.*)"$/m);
    if (!match) continue;

    const oldTitle = match[1];
    const newTitle = normalizeTitle(oldTitle);
    if (newTitle === oldTitle) continue;

    // title / sidebar_label / Heading children all carry the exact same
    // string — replace every literal occurrence.
    content = content.split(`"${oldTitle}"`).join(`"${newTitle}"`);
    fs.writeFileSync(filePath, content, 'utf-8');
    changedCount++;

    if (sidebarContent) {
      sidebarContent = sidebarContent.split(`label: "${oldTitle}"`).join(`label: "${newTitle}"`);
    }
  }

  if (sidebarContent !== null) {
    fs.writeFileSync(sidebarPath, sidebarContent, 'utf-8');
  }
  if (changedCount > 0) {
    console.log(`✔ normalized ${changedCount} operation title(s) in ${path.relative(path.resolve(__dirname, '..'), dir)}`);
  }
}
