#!/usr/bin/env node
/**
 * Builds Algolia search records from the built site, in the DocSearch v3
 * record format the search modal (src/theme/SearchBar) reads. This stands in
 * for the Algolia Crawler on plans that don't include it.
 *
 * DRY RUN ONLY: it reads HTML and writes local JSON files. It never talks to
 * Algolia; uploading is a separate step, not implemented here.
 *
 * Usage (after `npm run build`):
 *   node scripts/build-search-index.js [--dir build/en] [--out build/search-index]
 *                                      [--base-url https://docs.bitrise.io]
 *                                      [--content paragraphs|all]
 *
 * --content paragraphs (default) indexes only plain paragraphs as body text,
 * matching the existing test index. --content all also indexes list items,
 * nested paragraphs and table rows (roughly twice the records).
 *
 * Writes:
 *   <out>/records.json   array of records, ready for an Algolia batch/replace
 *   <out>/settings.json  index settings to apply alongside the records
 *   and prints a summary (counts per type, largest records, skipped pages).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cheerio = require('cheerio');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(ROOT, opt('dir', 'build/en'));
const OUT_DIR = path.resolve(ROOT, opt('out', 'build/search-index'));
const BASE_URL = opt('base-url', 'https://docs.bitrise.io').replace(/\/$/, '');
// Where BUILD_DIR sits in the site's URL space (en is served under /en/).
const URL_PREFIX = opt('url-prefix', '/en');
const CONTENT_MODE = opt('content', 'paragraphs');
if (!['paragraphs', 'all'].includes(CONTENT_MODE)) {
  console.error(`--content must be "paragraphs" or "all", got "${CONTENT_MODE}"`);
  process.exit(1);
}
const ALL_CONTENT = CONTENT_MODE === 'all';

// Algolia rejects records over 10KB on the free/build plans (100KB on
// higher ones); stay well under so one long paragraph can't fail a batch.
const MAX_CONTENT_CHARS = 2000;
// Shorter blocks ("200", "Yes", "iOS") are noise as search results; the
// headings around them already cover those topics.
const MIN_CONTENT_CHARS = 10;

// Pages that exist as HTML but aren't documentation.
const SKIP_PATH_PATTERNS = [/(^|\/)404(\.html)?$/, /(^|\/)search(\/|$)/];

// weight.level ranks higher-is-better (customRanking: desc(weight.level)), so
// a page title (lvl1 = 90) outranks a section (lvl2 = 80) and body text (0),
// as in DocSearch's own records.
const HEADING_LEVEL = {H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6};
const CONTENT_TAGS = new Set(['P', 'LI', 'DT', 'DD', 'BLOCKQUOTE', 'FIGCAPTION']);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function pageUrl(file) {
  let rel = path.relative(BUILD_DIR, file).split(path.sep).join('/');
  rel = rel.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
  return `${BASE_URL}${URL_PREFIX}${rel ? `/${rel}` : ''}`;
}

const clean = (text) => text.replace(/\s+/g, ' ').replace(/​/g, '').trim();

// Heading text minus the "Click to copy link" tooltip the hash-link adds.
function headingText($, el) {
  const copy = $(el).clone();
  copy.find('.hash-link').remove();
  return clean(copy.text());
}

function recordsForPage(file) {
  const html = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(html);

  const robots = $('meta[name="robots"]').attr('content') || '';
  if (/noindex/i.test(robots)) return {skipped: 'noindex'};

  const root = $('.theme-doc-markdown').first();
  if (!root.length) return {skipped: 'no doc content'};

  const url = pageUrl(file);
  const meta = (name) => $(`meta[name="docsearch:${name}"]`).attr('content');
  const language = meta('language') || 'en';
  const version = meta('version') || 'current';
  const docusaurusTag = meta('docusaurus_tag') || 'docs-default-current';

  // Top-level category shown above each result, e.g. "Bitrise CI".
  const lvl0 =
    clean($('.sidebar-product-title').first().text()) ||
    clean($('.breadcrumbs__item').first().text()) ||
    'Documentation';

  const hierarchy = {lvl0, lvl1: null, lvl2: null, lvl3: null, lvl4: null, lvl5: null, lvl6: null};
  let anchor = '';
  let position = 0;
  const records = [];

  const base = () => ({
    url: anchor ? `${url}#${anchor}` : url,
    url_without_anchor: url,
    url_without_variables: anchor ? `${url}#${anchor}` : url,
    anchor,
    hierarchy: {...hierarchy},
    language,
    lang: language,
    version: [version],
    docusaurus_tag: docusaurusTag,
    tags: [],
    recordVersion: 'v3',
  });

  const push = (type, content, level) => {
    const record = {
      ...base(),
      type,
      content,
      weight: {pageRank: 0, level, position: position++},
    };
    // Mirrors DocSearch's camel-case twin so "workflowEditor" matches
    // "Workflow Editor" in the same way the crawler-built index does.
    if (content) record.content_camel = content;
    records.push(record);
  };

  // Walk the article in document order. Headings move the "current section";
  // text blocks become content records under whichever heading is current.
  const visit = (node) => {
    $(node)
      .contents()
      .each((_, child) => {
        if (child.type !== 'tag') return;
        const tag = child.tagName.toUpperCase();
        const level = HEADING_LEVEL[tag];

        if (level) {
          const text = headingText($, child);
          if (!text) return;
          // The h1 is the page title (lvl1). Deeper headings nest under it.
          const lvl = Math.min(level, 6);
          for (let l = lvl; l <= 6; l++) hierarchy[`lvl${l}`] = null;
          hierarchy[`lvl${lvl}`] = text;
          anchor = $(child).attr('id') || '';
          push(`lvl${lvl}`, null, 100 - lvl * 10);
          return;
        }

        // API reference pages show "PATCH /apps/:app-slug/..." in a <pre>.
        // The path is what people search for, so make it the section (lvl2)
        // that the page's lead paragraph sits under.
        if (tag === 'PRE' && $(child).hasClass('openapi__method-endpoint')) {
          const endpoint = clean($(child).find('.openapi__method-endpoint-path').text());
          if (endpoint) {
            for (let l = 2; l <= 6; l++) hierarchy[`lvl${l}`] = null;
            hierarchy.lvl2 = endpoint;
            anchor = '';
            push('lvl2', null, 80);
          }
          return;
        }

        // Code samples, hidden skeleton loaders and tab chrome add noise.
        if (['PRE', 'SCRIPT', 'STYLE', 'SVG', 'BUTTON', 'NAV'].includes(tag)) return;
        if ($(child).hasClass('openapi-skeleton')) return;

        // Paragraphs-only mode: lists, tables and definition lists aren't
        // indexed as body text (their headings still are).
        if (!ALL_CONTENT && ['UL', 'OL', 'TABLE', 'DL'].includes(tag)) return;

        // One record per table row (cells joined), not per cell: a lone cell
        // like "Yes" is useless as a search result, and big reference tables
        // would otherwise dominate the record count.
        if (tag === 'TR') {
          const cells = $(child)
            .children('td, th')
            .map((_, cell) => clean($(cell).text()))
            .get()
            .filter(Boolean);
          const row = cells.join(' | ');
          if (row.length >= MIN_CONTENT_CHARS) push('content', row.slice(0, MAX_CONTENT_CHARS), 0);
          return;
        }

        if (CONTENT_TAGS.has(tag) && (ALL_CONTENT || tag === 'P')) {
          // A <li> that wraps its own <p> is handled via that <p>.
          if (tag !== 'P' && $(child).children('p').length) {
            visit(child);
            return;
          }
          const text = clean($(child).text());
          if (text.length >= MIN_CONTENT_CHARS) push('content', text.slice(0, MAX_CONTENT_CHARS), 0);
          return;
        }

        visit(child);
      });
  };

  visit(root);

  // Without an h1 we have no page title to show, so the page isn't useful.
  if (!records.some((r) => r.type === 'lvl1')) return {skipped: 'no h1'};

  return {records};
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`Build directory not found: ${BUILD_DIR}\nRun \`npm run build\` first, or pass --dir.`);
    process.exit(1);
  }

  const all = [];
  const skipped = {};
  let pages = 0;

  for (const file of walk(BUILD_DIR)) {
    const rel = path.relative(BUILD_DIR, file).split(path.sep).join('/');
    if (SKIP_PATH_PATTERNS.some((re) => re.test(rel))) continue;
    const result = recordsForPage(file);
    if (result.skipped) {
      skipped[result.skipped] = (skipped[result.skipped] || 0) + 1;
      continue;
    }
    pages++;
    all.push(...result.records);
  }

  // objectIDs must be unique and stable between runs so an update replaces
  // records instead of duplicating them.
  const seen = new Map();
  for (const record of all) {
    const key = `${record.url}|${record.type}|${record.hierarchy.lvl0}|${record.hierarchy.lvl1}|${record.hierarchy.lvl2}|${record.hierarchy.lvl3}|${record.hierarchy.lvl4}|${record.hierarchy.lvl5}|${record.content || ''}`;
    const n = seen.get(key) || 0;
    seen.set(key, n + 1);
    record.objectID = crypto.createHash('sha1').update(n ? `${key}#${n}` : key).digest('hex');
  }

  fs.mkdirSync(OUT_DIR, {recursive: true});
  fs.writeFileSync(path.join(OUT_DIR, 'records.json'), JSON.stringify(all));
  fs.writeFileSync(path.join(OUT_DIR, 'settings.json'), JSON.stringify(SETTINGS, null, 2));

  const byType = {};
  for (const r of all) byType[r.type] = (byType[r.type] || 0) + 1;
  const sizes = all.map((r) => Buffer.byteLength(JSON.stringify(r)));
  const largest = Math.max(...sizes);

  console.log(`Content mode:   ${CONTENT_MODE}`);
  console.log(`Pages indexed:  ${pages}`);
  console.log(`Records:        ${all.length}`);
  console.log(`By type:        ${JSON.stringify(byType)}`);
  console.log(`Largest record: ${largest} bytes`);
  console.log(`Skipped pages:  ${JSON.stringify(skipped)}`);
  console.log(`Wrote:          ${path.relative(ROOT, OUT_DIR)}/records.json, settings.json`);
}

// Index settings the search modal relies on. These follow DocSearch's
// documented defaults; they were NOT read from the existing test index (a
// search-only key can't read settings), so diff them against the test app's
// Configuration tab before applying.
const SETTINGS = {
  attributesForFaceting: [
    'filterOnly(language)',
    'filterOnly(lang)',
    'filterOnly(version)',
    'filterOnly(docusaurus_tag)',
    'filterOnly(type)',
    'filterOnly(tags)',
  ],
  attributeForDistinct: 'url',
  distinct: true,
  searchableAttributes: [
    'unordered(hierarchy.lvl0)',
    'unordered(hierarchy.lvl1)',
    'unordered(hierarchy.lvl2)',
    'unordered(hierarchy.lvl3)',
    'unordered(hierarchy.lvl4)',
    'unordered(hierarchy.lvl5)',
    'unordered(hierarchy.lvl6)',
    'content',
  ],
  customRanking: ['desc(weight.pageRank)', 'desc(weight.level)', 'asc(weight.position)'],
  attributesToRetrieve: [
    'hierarchy',
    'content',
    'anchor',
    'url',
    'url_without_anchor',
    'type',
  ],
  attributesToHighlight: ['hierarchy', 'content'],
  attributesToSnippet: ['content:10'],
  highlightPreTag: '<mark>',
  highlightPostTag: '</mark>',
  snippetEllipsisText: '…',
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 7,
  allowTyposOnNumericTokens: false,
  minProximity: 1,
  ignorePlurals: true,
  // Drops filler words ("how to", "for", "the") from long, natural-language
  // queries before matching. queryLanguages tells Algolia which language's
  // stop words and plural rules to use.
  removeStopWords: true,
  queryLanguages: ['en'],
  advancedSyntax: true,
  attributeCriteriaComputedByMinProximity: true,
  removeWordsIfNoResults: 'allOptional',
};

main();
