#!/usr/bin/env node
/**
 * Uploads the records built by scripts/build-search-index.js to Algolia,
 * replacing the live index atomically: records and settings go into a
 * temporary index first, which is then moved over the real one in a single
 * operation, so search never sees a half-built index.
 *
 * Built on the algoliasearch client (retries with backoff and host fallback)
 * and follows the same sequence as its replaceAllObjects helper, except that
 * the settings come from settings.json instead of being copied from the live
 * index: the repo is the source of truth for settings. Synonyms and rules
 * are still copied from the live index, so curating those in the dashboard
 * survives a reindex.
 *
 * Does nothing unless --upload is passed (without it, prints the plan).
 *
 * Environment (the write key is a secret: set it in your shell, never commit it):
 *   ALGOLIA_APP_ID           e.g. HI1538U2K4
 *   ALGOLIA_INDEX_NAME       e.g. docs_bitrise_io
 *   ALGOLIA_WRITE_API_KEY    key limited to "<index>*" with the addObject,
 *                            editSettings and deleteIndex ACLs
 *
 * Usage:
 *   node scripts/upload-search-index.js [--dir build/search-index] [--min-records 1000] [--upload]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {algoliasearch} = require('algoliasearch');

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
  console.log(`Plan:       copy synonyms + rules from the live index, settings, records -> ${tmpIndex}, then move over ${INDEX}`);

  if (!UPLOAD) {
    console.log('\nDry run: nothing was sent. Re-run with --upload to apply.');
    return;
  }

  const client = algoliasearch(APP_ID, KEY);
  // The copy's task is tracked on the destination (the temporary index) and
  // the move's on its source (also the temporary index): every wait below
  // polls the temporary index, as the client's own replaceAllObjects does.
  const wait = (taskID) => client.waitForTask({indexName: tmpIndex, taskID});

  // Remove the temporary index if the run ends before the swap. Once the move
  // has been requested, Algolia finishes it on its own and the temporary index
  // disappears with it; deleting it then could race the move, so leave it.
  let moveRequested = false;
  let cleanup;
  const removeTmpIndex = async () => {
    if (moveRequested) return;
    try {
      await client.deleteIndex({indexName: tmpIndex});
      console.error(`Removed temporary index ${tmpIndex}. ${INDEX} is unchanged.`);
    } catch (err) {
      if (err.status === 404) console.error('No temporary index to remove yet.');
      else console.error(`Could not remove temporary index ${tmpIndex}; delete it manually.`);
    }
  };
  const cleanupOnce = () => (cleanup ??= removeTmpIndex());

  // GitHub Actions cancels a run that a newer push supersedes (see the
  // concurrency group in deploy.yml) with SIGINT, then SIGTERM a few seconds
  // later, then SIGKILL. Without this the cancelled run would leave its
  // temporary index, with every record in it, behind.
  for (const [signal, exitCode] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    process.once(signal, async () => {
      console.error(`Received ${signal}: stopping.`);
      if (moveRequested) console.error(`The move onto ${INDEX} was already requested; Algolia completes it on its own.`);
      await cleanupOnce();
      process.exit(exitCode);
    });
  }

  try {
    // Carry over curated synonyms and rules. The live index must already
    // exist: a missing one (say, a mistyped ALGOLIA_INDEX_NAME) fails here
    // instead of quietly creating a new index with nothing in it.
    const copy = await client.operationIndex({
      indexName: INDEX,
      operationIndexParams: {operation: 'copy', destination: tmpIndex, scope: ['synonyms', 'rules']},
    });
    await wait(copy.taskID);
    console.log('Copied synonyms and rules from the live index.');

    const s = await client.setSettings({indexName: tmpIndex, indexSettings: settings});
    await wait(s.taskID);
    console.log('Settings applied to temporary index.');

    await client.chunkedBatch({
      indexName: tmpIndex,
      objects: records,
      action: 'addObject',
      waitForTasks: true,
      batchSize: BATCH_SIZE,
    });
    console.log(`Uploaded ${records.length} records.`);

    moveRequested = true;
    let m;
    try {
      m = await client.operationIndex({
        indexName: tmpIndex,
        operationIndexParams: {operation: 'move', destination: INDEX},
      });
    } catch (err) {
      moveRequested = false; // rejected: nothing was moved, the temporary index is still ours to remove
      throw err;
    }
    await wait(m.taskID);
    console.log(`Done: ${INDEX} now holds ${records.length} records.`);
  } catch (err) {
    console.error(`Upload failed: ${err.message}`);
    await cleanupOnce();
    process.exit(1);
  }
}

if (!APP_ID || !INDEX || !KEY) {
  fail('set ALGOLIA_APP_ID, ALGOLIA_INDEX_NAME and ALGOLIA_WRITE_API_KEY.');
}

main();
