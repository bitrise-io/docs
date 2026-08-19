#!/usr/bin/env node
/**
 * Patches the generated *.info.mdx and *.api.mdx files after
 * `docusaurus gen-api-docs`.
 *
 * The openapi-docs plugin regenerates these files from the spec on every run,
 * discarding manual edits. This script reapplies fixes automatically:
 *
 *   1. Adds `displayed_sidebar: <sidebar>` to the frontmatter so the page
 *      renders inside the correct product sidebar.
 *
 *   2. Inserts the license name into the License section, which the plugin
 *      generates as an empty heading. Skipped when the spec has no license or
 *      isn't available as a local file (e.g. it's fetched from a remote URL).
 *
 *   3. Disambiguates duplicate sidebar labels. Two different operations can
 *      share an identical OpenAPI `summary` (a spec-authoring issue upstream,
 *      not something to fix here since both api/bitrise-ci.json and
 *      api/bitrise-rde.json are themselves synced/generated). Docusaurus
 *      derives i18n translation keys from sidebar labels, so a duplicate
 *      breaks `docusaurus write-translations` outright — see DUPLICATE_LABEL_
 *      OVERRIDES below for the specific pairs found so far.
 *
 *   4. Rewrites `info_path` on every generated *.api.mdx to a real URL path.
 *      The plugin derives this value from its `outputDir` option, which is a
 *      filesystem path ('docs/bitrise-api/api-reference'), and writes it into
 *      the frontmatter unchanged. But the theme consumes it as a URL, not a
 *      doc id — see docusaurus-theme-openapi-docs
 *      theme/ApiExplorer/SecuritySchemes/index.tsx:
 *
 *          const infoAuthPath = `/${props.infoPath}#authentication`;
 *
 *      That href is emitted verbatim, so it never goes through Docusaurus's
 *      locale/routeBasePath resolution and has to carry the locale prefix
 *      itself. With `routeBasePath: ''` and `i18n.localeConfigs.en.baseUrl:
 *      '/en/'`, the generated `docs/...` value resolves to /docs/... — a 404
 *      on every API reference page. The correct value is `en/...`.
 *
 *      Derived from each target's own infoFile rather than hardcoded, so a
 *      future outputDir change can't silently reintroduce the wrong prefix.
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

// Explicit fix map, not a generic auto-disambiguation heuristic — same
// convention as TARGETS above. Keyed by the generated file's `id` (stable
// across regenerations; derived from the operationId/path in the spec).
// Extend this if a future spec sync introduces another duplicate pair —
// `docusaurus write-translations` will fail loudly with the exact `id`s
// involved if it does, same as it did for these two.
const DUPLICATE_LABEL_OVERRIDES = {
  'organization-machine-type-update': 'Migrate machine types (organization)',
  'user-machine-type-update': 'Migrate machine types (user)',
  // Deprecated in favor of SessionDownloadFile — see this file's own
  // description ("Deprecated: use SessionDownloadFile.").
  'codespaces-service-session-download': 'Download files (deprecated)',
};

const API_REFERENCE_DIRS = [
  '../docs/bitrise-api/api-reference',
  '../docs/bitrise-rde-api/api-reference',
];

// Root of the docs plugin's content dir (docusaurus.config.ts: docs.path).
// Route paths are relative to this, since routeBasePath is ''.
const DOCS_ROOT = '../docs';

// Locale prefix that generated `info_path` values must carry — the theme
// emits them as raw hrefs with no locale resolution (see step 4 above).
// Mirrors docusaurus.config.ts i18n.localeConfigs.en.baseUrl ('/en/').
// The ja build has no translated copies of the API reference, so it falls
// back to these files and links to the en info page: not ideal, but a live
// page rather than a 404. Revisit if the reference is ever translated.
const EN_ROUTE_PREFIX = 'en';

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

// 3. Disambiguate known duplicate sidebar labels on the generated *.api.mdx
// files (a different file per operation, unlike the *.info.mdx above).
for (const dir of API_REFERENCE_DIRS) {
  const dirPath = path.resolve(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`· ${dir} not found, skipping duplicate-label patch`);
    continue;
  }
  for (const file of fs.readdirSync(dirPath)) {
    if (!file.endsWith('.api.mdx')) continue;
    const id = file.slice(0, -'.api.mdx'.length);
    const override = DUPLICATE_LABEL_OVERRIDES[id];
    if (!override) continue;

    const filePath = path.join(dirPath, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(`sidebar_label: "${override}"`)) {
      console.log(`· [${id}] label override already applied, skipping`);
      continue;
    }
    const before = content;
    content = content
      .replace(/^title: ".*"$/m, `title: "${override}"`)
      .replace(/^sidebar_label: ".*"$/m, `sidebar_label: "${override}"`)
      .replace(/children=\{".*?"\}/, `children={"${override}"}`);
    if (content !== before) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✔ [${id}] disambiguated sidebar label -> "${override}"`);
    } else {
      console.log(`· [${id}] expected title/sidebar_label/heading pattern not found, skipped`);
    }
  }

  // The doc's own frontmatter isn't what Docusaurus reads for the sidebar —
  // sidebar.ts (generated alongside the *.api.mdx files) carries its own
  // separate `label` per item, keyed by the item's full `id`. Both need the
  // override or the duplicate survives for i18n purposes even though the
  // page itself looks fixed.
  const sidebarPath = path.join(dirPath, 'sidebar.ts');
  if (fs.existsSync(sidebarPath)) {
    let content = fs.readFileSync(sidebarPath, 'utf-8');
    const before = content;
    for (const [id, override] of Object.entries(DUPLICATE_LABEL_OVERRIDES)) {
      // Match this item's own { id: "...id", label: "..." } pair specifically
      // (id and label always appear on adjacent lines in the generated
      // output), so a shared id suffix can't accidentally patch a sibling.
      const itemPattern = new RegExp(
        `(id: "[^"]*${id}",\\n\\s*label: ")[^"]*(")`,
      );
      content = content.replace(itemPattern, `$1${override}$2`);
    }
    if (content !== before) {
      fs.writeFileSync(sidebarPath, content, 'utf-8');
      console.log(`✔ [${dir}] disambiguated label(s) in sidebar.ts`);
    } else {
      console.log(`· [${dir}] sidebar.ts labels already patched or pattern not found`);
    }
  }
}

// 4. Point `info_path` at a real URL path instead of the plugin's outputDir.
for (const target of TARGETS) {
  const infoPath = path.resolve(__dirname, target.infoFile);
  const dirPath = path.dirname(infoPath);
  if (!fs.existsSync(dirPath)) {
    console.log(`· ${target.sidebar} reference dir not found, skipping info_path patch`);
    continue;
  }

  // e.g. .../docs/bitrise-api/api-reference/bitrise-api.info.mdx
  //   -> en/bitrise-api/api-reference/bitrise-api
  const routePath = path
    .relative(path.resolve(__dirname, DOCS_ROOT), infoPath)
    .replace(/\.info\.mdx$/, '')
    .split(path.sep)
    .join('/');
  const expected = `${EN_ROUTE_PREFIX}/${routePath}`;

  let patched = 0;
  let alreadyCorrect = 0;
  let missing = 0;

  for (const file of fs.readdirSync(dirPath)) {
    if (!file.endsWith('.api.mdx')) continue;

    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const current = content.match(/^info_path:[ \t]*(.*)$/m);

    if (!current) {
      missing += 1;
      continue;
    }
    if (current[1].trim() === expected) {
      alreadyCorrect += 1;
      continue;
    }

    fs.writeFileSync(
      filePath,
      content.replace(/^info_path:[ \t]*.*$/m, `info_path: ${expected}`),
      'utf-8',
    );
    patched += 1;
  }

  if (patched > 0) {
    console.log(
      `✔ [${target.sidebar}] info_path -> ${expected} ` +
        `(${patched} rewritten, ${alreadyCorrect} already correct)`,
    );
  } else {
    console.log(
      `· [${target.sidebar}] info_path already ${expected} on all ` +
        `${alreadyCorrect} file(s), skipping`,
    );
  }
  if (missing > 0) {
    console.log(`· [${target.sidebar}] ${missing} *.api.mdx had no info_path line`);
  }
}

console.log('✔ Patch complete');

function readLicenseName(specFile) {
  if (!specFile) return null;
  const specPath = path.resolve(__dirname, specFile);
  if (!fs.existsSync(specPath)) return null;
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  return spec?.info?.license?.name ?? null;
}
