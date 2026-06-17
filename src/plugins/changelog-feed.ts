import * as fs from 'node:fs';
import * as path from 'node:path';

const CHANGELOG_PARTIAL = path.resolve(
  __dirname,
  '../../src/partials/changelog-content.mdx',
);

// Duplicates url in docusaurus.config.ts — update both if the domain changes.
const SITE_URL = 'https://docs.bitrise.io';
const FEED_TITLE = 'Bitrise Docs changelog';
const FEED_DESCRIPTION = 'A record of documentation updates on the Bitrise docs site.';
// Pins feed item links to the Bitrise CI hub changelog. Update if the slug changes.
const CHANGELOG_PATH = '/en/bitrise-ci/changelog';

interface Entry {
  date: string;   // ISO 8601, e.g. "2026-06-16"
  title: string;
  content: string;
}

function parseEntries(): Entry[] {
  const text = fs.readFileSync(CHANGELOG_PARTIAL, 'utf-8');
  const lines = text.split('\n');
  const entries: Entry[] = [];

  // Match H2 headings: ## <time dateTime="YYYY-MM-DD">YYYY-MM-DD</time> — Title
  // Also matches plain: ## YYYY-MM-DD — Title
  const headingRe = /^## (?:<time[^>]*>)?(\d{4}-\d{2}-\d{2})(?:<\/time>)? — (.+)$/;
  let current: Entry | null = null;
  const contentLines: string[] = [];

  for (const line of lines) {
    const m = line.match(headingRe);
    if (m) {
      if (current) {
        current.content = contentLines.join('\n').trim();
        entries.push(current);
      }
      current = { date: m[1], title: m[2], content: '' };
      contentLines.length = 0;
    } else if (current) {
      contentLines.push(line);
    }
  }
  if (current) {
    current.content = contentLines.join('\n').trim();
    entries.push(current);
  }

  return entries;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildRss(entries: Entry[]): string {
  const items = entries
    .map((e) => {
      const pubDate = new Date(`${e.date}T00:00:00Z`).toUTCString();
      const link = `${SITE_URL}${CHANGELOG_PATH}#${e.date}-${toSlug(e.title)}`;
      return `  <item>
    <title>${escapeXml(e.title)}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="false">${escapeXml(link)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(e.content)}</description>
  </item>`;
    })
    .join('\n');

  const lastBuild = entries[0]
    ? new Date(`${entries[0].date}T00:00:00Z`).toUTCString()
    : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}${CHANGELOG_PATH}</link>
    <atom:link href="${SITE_URL}/changelog.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function buildJson(entries: Entry[]): string {
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    home_page_url: `${SITE_URL}${CHANGELOG_PATH}`,
    feed_url: `${SITE_URL}/changelog.json`,
    items: entries.map((e) => ({
      id: `${SITE_URL}${CHANGELOG_PATH}#${e.date}-${toSlug(e.title)}`,
      url: `${SITE_URL}${CHANGELOG_PATH}#${e.date}-${toSlug(e.title)}`,
      title: e.title,
      date_published: `${e.date}T00:00:00Z`,
      content_text: e.content,
    })),
  };
  return JSON.stringify(feed, null, 2);
}

export default function changelogFeedPlugin() {
  return {
    name: 'changelog-feed',
    async postBuild({ outDir }: { outDir: string }) {
      const entries = parseEntries();
      fs.writeFileSync(path.join(outDir, 'changelog.xml'), buildRss(entries), 'utf-8');
      fs.writeFileSync(path.join(outDir, 'changelog.json'), buildJson(entries), 'utf-8');
    },
  };
}
