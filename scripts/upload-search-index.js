#!/usr/bin/env node
/**
 * Uploads the records built by scripts/build-search-index.js to Algolia,
 * replacing the live index atomically: records and settings go into a
 * temporary index first, which is then moved over the real one in a single
 * operation, so search never sees a half-built index.
 *
 * Does nothing unless --upload is passed (without it, prints the plan).
 *
 * Environment (the write key is a secret: set it in your shell, never commit it):
 *   ALGOLIA_APP_ID           e.g. HI1538U2K4
 *   ALGOLIA_INDEX_NAME       e.g. docs_bitrise_io
 *   ALGOLIA_WRITE_API_KEY    key limited to "<index>*" (see the PR description)
 *
 * Usage:
 *   node scripts/upload-search-index.js [--dir build/search-index] [--min-records 1000] [--upload]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const DIR = path.resolve(__dirname, '..', opt('dir', 'build/search-index'));
const MIN_RECORDS = Number(opt('min-records', '1000'));
const UPLOAD = args.includes('--upload');
const BATCH_SIZE = 500;

const {ALGOLIA_APP_ID: APP_ID, ALGOLIA_INDEX_NAME: INDEX, ALGOLIA_WRITE_API_KEY: KEY} = process.env;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

async function api(method, pathname, body) {
  const res = await fetch(`https://${APP_ID}.algolia.net${pathname}`, {
    method,
    headers: {
      'X-Algolia-Application-Id': APP_ID,
      'X-Algolia-API-Key': KEY,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${pathname} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

async function waitTask(index, taskID) {
  for (let i = 0; i < 300; i++) {
    const {status} = await api('GET', `/1/indexes/${index}/task/${taskID}`);
    if (status === 'published') return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for task ${taskID} on ${index}`);
}

async function main() {
  const recordsFile = path.join(DIR, 'records.json');
  const settingsFile = path.join(DIR, 'settings.json');
  if (!fs.existsSync(recordsFile) || !fs.existsSync(settingsFile)) {
    fail(`records.json / settings.json not found in ${DIR}. Run scripts/build-search-index.js first.`);
  }
  const records = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

  if (records.length < MIN_RECORDS) {
    fail(`only ${records.length} records (minimum ${MIN_RECORDS}). Refusing to replace the index with a near-empty one.`);
  }

  const tmpIndex = `${INDEX}_tmp_${Date.now()}`;
  console.log(`App:        ${APP_ID}`);
  console.log(`Index:      ${INDEX}`);
  console.log(`Records:    ${records.length} (batches of ${BATCH_SIZE})`);
  console.log(`Plan:       settings + records -> ${tmpIndex}, then move over ${INDEX}`);

  if (!UPLOAD) {
    console.log('\nDry run: nothing was sent. Re-run with --upload to apply.');
    return;
  }

  try {
    const s = await api('PUT', `/1/indexes/${tmpIndex}/settings`, settings);
    await waitTask(tmpIndex, s.taskID);
    console.log('Settings applied to temporary index.');

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      const b = await api('POST', `/1/indexes/${tmpIndex}/batch`, {
        requests: chunk.map((body) => ({action: 'addObject', body})),
      });
      await waitTask(tmpIndex, b.taskID);
      console.log(`Uploaded ${Math.min(i + BATCH_SIZE, records.length)} / ${records.length}`);
    }

    const m = await api('POST', `/1/indexes/${tmpIndex}/operation`, {
      operation: 'move',
      destination: INDEX,
    });
    await waitTask(INDEX, m.taskID);
    console.log(`Done: ${INDEX} now holds ${records.length} records.`);
  } catch (err) {
    console.error(`Upload failed: ${err.message}`);
    try {
      await api('DELETE', `/1/indexes/${tmpIndex}`);
      console.error(`Removed temporary index ${tmpIndex}. ${INDEX} is unchanged.`);
    } catch {
      console.error(`Could not remove temporary index ${tmpIndex}; delete it manually.`);
    }
    process.exit(1);
  }
}

if (!APP_ID || !INDEX || !KEY) {
  fail('set ALGOLIA_APP_ID, ALGOLIA_INDEX_NAME and ALGOLIA_WRITE_API_KEY.');
}

main();
