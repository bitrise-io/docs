#!/usr/bin/env node
/**
 * Source-level internal link & anchor checker for the Bitrise docs.
 *
 * Validates, WITHOUT a build, that every internal `/en/...` link (and any
 * `#anchor` on it) written in a `.md` / `.mdx` file points at a real page and
 * a real heading. Meant to run at authoring time — before a change reaches a
 * PR — as a complement to the build-time checks (`onBrokenLinks` in
 * docusaurus.config.ts) and the HTML-level `link_analyzer.js`.
 *
 * Usage:
 *   node scripts/check-links-source.js                 # scan every page under docs/
 *   node scripts/check-links-source.js docs/a.mdx ...  # check only the given files
 *   node scripts/check-links-source.js --json          # machine-readable output
 *
 * Exit code: 0 if clean, 1 if any broken link/anchor is found (so it can gate).
 *
 * Known limits (reported as warnings, never hard failures):
 *   - Headings that come from a non-partial component are invisible to a
 *     source-level scan, so an anchor into one may be flagged. Add it to
 *     KNOWN_ANCHOR_EXCEPTIONS if that happens.
 *   - Generated API-reference pages get their anchors at build time; anchors
 *     into those routes are skipped, not validated.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const PARTIALS_DIR = path.join(ROOT, 'src', 'partials');
const ROUTE_BASE = '/en'; // docusaurus.config.ts -> routeBasePath: 'en'

// Routes whose anchors are generated at build time — validate the page exists,
// but don't try to validate #anchors against source.
const GENERATED_ANCHOR_ROUTE_PREFIXES = [
  '/en/bitrise-api/api-reference',
  '/en/bitrise-rde-api/api-reference',
];

const KNOWN_ANCHOR_EXCEPTIONS = new Set([
  // '/en/some/page#anchor-from-a-partial',
]);

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const fileArgs = args.filter((a) => !a.startsWith('--'));

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

function readFrontmatter(src) {
  if (!src.startsWith('---')) return {};
  const end = src.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = src.slice(3, end);
  const fm = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

// Strip fenced code blocks so links/headings inside them are ignored.
function stripCodeFences(src) {
  return src.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
}

// GitHub-slugger-compatible enough for our heading text.
function slugify(text) {
  return text
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links -> text
    .replace(/[*~]/g, '') // emphasis marks (keep _, it's word-internal e.g. run_if)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // drop punctuation
    .replace(/\s+/g, '-'); // spaces -> hyphens
}

// Compute the /en/... route for a doc file.
function routeForFile(absFile, frontmatter) {
  if (frontmatter.slug) {
    const s = frontmatter.slug.startsWith('/')
      ? frontmatter.slug
      : '/' + frontmatter.slug;
    return (ROUTE_BASE + s).replace(/\/+$/, '') || ROUTE_BASE;
  }
  let rel = path.relative(DOCS_DIR, absFile).replace(/\\/g, '/');
  // OpenAPI-generated pages are named "<name>.api.mdx" / "<name>.info.mdx" and
  // route by their frontmatter `id`, dropping the .api/.info infix.
  rel = rel.replace(/\.(api|info)\.mdx$/, '').replace(/\.mdx?$/, '');
  if (frontmatter.id) {
    rel = rel.replace(/[^/]+$/, frontmatter.id);
  }
  rel = rel.replace(/\/index$/, '').replace(/^index$/, '');
  const route = (ROUTE_BASE + '/' + rel).replace(/\/+$/, '');
  return route || ROUTE_BASE;
}

// Resolve @site/src/partials/<slug>.mdx imports and return anchors they add,
// recursively (a partial may import another). Cached to avoid rework.
const partialAnchorCache = new Map();
function partialAnchors(absPartial, seen) {
  if (partialAnchorCache.has(absPartial)) return partialAnchorCache.get(absPartial);
  if (!fs.existsSync(absPartial)) return new Set();
  seen = seen || new Set();
  if (seen.has(absPartial)) return new Set();
  seen.add(absPartial);
  const src = fs.readFileSync(absPartial, 'utf8');
  const set = anchorsForSource(src);
  for (const nested of importedPartials(src)) {
    for (const a of partialAnchors(nested, seen)) set.add(a);
  }
  partialAnchorCache.set(absPartial, set);
  return set;
}

function importedPartials(src) {
  const out = [];
  const re = /from\s+['"]@site\/src\/partials\/([^'"]+\.mdx)['"]/g;
  let m;
  while ((m = re.exec(src))) out.push(path.join(PARTIALS_DIR, m[1]));
  return out;
}

// Anchors on a page = its own headings + anchors from any partials it imports.
function pageAnchors(src) {
  const set = anchorsForSource(src);
  for (const p of importedPartials(src)) {
    for (const a of partialAnchors(p)) set.add(a);
  }
  return set;
}

// Collect anchors (heading IDs) available on a page.
function anchorsForSource(src) {
  const anchors = new Set();
  const clean = stripCodeFences(src);
  const lines = clean.split('\n');
  for (const line of lines) {
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (!h) continue;
    let heading = h[1].trim();
    const explicit = heading.match(/\{#([^}]+)\}\s*$/); // {#custom-id}
    if (explicit) {
      anchors.add(explicit[1]);
      heading = heading.replace(/\{#[^}]+\}\s*$/, '').trim();
    }
    const slug = slugify(heading);
    if (slug) anchors.add(slug);
  }
  return anchors;
}

// Extract internal /en/ link targets from a page (markdown + JSX props).
function internalLinks(src) {
  const clean = stripCodeFences(src).replace(/`[^`]*`/g, ''); // drop inline code too
  const targets = [];
  const patterns = [
    /\]\((\/en\/[^)\s]+)\)/g, // [text](/en/...)
    /\b(?:href|to)=["'](\/en\/[^"']+)["']/g, // href="/en/..." / to="/en/..."
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(clean))) targets.push(m[1]);
  }
  return targets;
}

function normalizePath(p) {
  return p.replace(/\.html$/, '').replace(/\/+$/, '') || ROUTE_BASE;
}

function isGeneratedAnchorRoute(route) {
  return GENERATED_ANCHOR_ROUTE_PREFIXES.some((pre) => route.startsWith(pre));
}

/* ------------------------------------------------------------------ */
/* build the route + anchor map from ALL pages                        */
/* ------------------------------------------------------------------ */

const allFiles = walk(DOCS_DIR);
const routeMap = new Map(); // route -> { file, anchors:Set }

for (const abs of allFiles) {
  const src = fs.readFileSync(abs, 'utf8');
  const fm = readFrontmatter(src);
  const route = routeForFile(abs, fm);
  routeMap.set(route, { file: abs, anchors: pageAnchors(src) });
}

/* ------------------------------------------------------------------ */
/* check the target files                                             */
/* ------------------------------------------------------------------ */

// Partials live outside docs/ but their bodies can contain internal links; a
// broken link in a reused partial would otherwise go unnoticed. Scan them too.
const partialFiles = fs.existsSync(PARTIALS_DIR) ? walk(PARTIALS_DIR) : [];

const filesToCheck = fileArgs.length
  ? fileArgs.map((f) => path.resolve(f))
  : [...allFiles, ...partialFiles];

const results = []; // { file, brokenLinks:[], brokenAnchors:[] }
let brokenLinkCount = 0;
let brokenAnchorCount = 0;

for (const abs of filesToCheck) {
  if (!fs.existsSync(abs)) {
    console.error(`skip (not found): ${abs}`);
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const brokenLinks = [];
  const brokenAnchors = [];

  for (const raw of internalLinks(src)) {
    const [rawPath, anchor] = raw.split('#');
    const target = normalizePath(rawPath);
    const entry = routeMap.get(target);

    if (!entry) {
      brokenLinks.push({ link: raw, target });
      brokenLinkCount++;
      continue;
    }
    if (anchor && !isGeneratedAnchorRoute(target)) {
      if (KNOWN_ANCHOR_EXCEPTIONS.has(target + '#' + anchor)) continue;
      if (!entry.anchors.has(anchor)) {
        brokenAnchors.push({ link: raw, target, anchor });
        brokenAnchorCount++;
      }
    }
  }

  if (brokenLinks.length || brokenAnchors.length) {
    results.push({
      file: path.relative(ROOT, abs),
      brokenLinks,
      brokenAnchors,
    });
  }
}

/* ------------------------------------------------------------------ */
/* report                                                             */
/* ------------------------------------------------------------------ */

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      { brokenLinkCount, brokenAnchorCount, pagesWithIssues: results.length, results },
      null,
      2
    )
  );
} else {
  if (!results.length) {
    console.log(
      `Clean — checked ${filesToCheck.length} file(s), no broken internal links or anchors.`
    );
  } else {
    console.log(
      `Found ${brokenLinkCount} broken link(s) and ${brokenAnchorCount} broken anchor(s) across ${results.length} page(s):\n`
    );
    for (const r of results) {
      console.log(`  ${r.file}`);
      for (const b of r.brokenLinks) console.log(`    [404 page]   ${b.link}`);
      for (const b of r.brokenAnchors)
        console.log(`    [no anchor]  ${b.link}  (page exists, #${b.anchor} does not)`);
      console.log('');
    }
  }
}

process.exit(brokenLinkCount + brokenAnchorCount > 0 ? 1 : 0);
