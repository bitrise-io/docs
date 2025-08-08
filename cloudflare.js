/**
 * @description This module provides functions to interact with Cloudflare's Rules API for managing lists and redirects.
 * It includes functionality to fetch, update, and manage redirect rules in a specified list.
 *
 * @see https://developers.cloudflare.com/api/node/resources/rules/subresources/lists/
 */

const fs = require('fs');
const Cloudflare = require('cloudflare');

/**
 * @typedef {{
 *  id: string;
 *  created_on: string;
 *  kind: 'ip' | 'redirect' | 'hostname' | 'asn';
 *  modified_on: string;
 *  name: string;
 *  num_items: number;
 *  num_referencing_filters: number;
 *  description?: string;
 * }} ListsList
 */

/**
 * @typedef {{
 *  source_url: string;
 *  target_url: string;
 *  status_code: number;
 *  include_subdomains?: boolean;
 *  preserve_query_string?: boolean;
 *  subpath_matching?: boolean;
 *  preserve_path_suffix?: boolean;
 * }} Redirect
 */

/**
 * @typedef {{
 *  redirect: Redirect;
 *  comment?: string;
 * }} ListsListItemRedirectComment
 */

/**
 * @typedef {{
 *  operation_id: string;
 * }} ItemUpdateResponse
 */

/**
 * @typedef {{
 *  id: string;
 *  redirect: Redirect;
 *  created_on: string;
 *  modified_on: string;
 * }} ListItemRedirect
 */

/**
 * @typedef {{
 *  before: string;
 *  after: string;
 * }} ListCursor
 */

/**
 * @typedef {{
 *  result: ListItemRedirect[];
 *  result_info: {
 *    cursors: ListCursor;
 *  };
 * }} ListItemsPage
 */

/**
 * @typedef {{
 *  id: string;
 *  status: 'pending' | 'running';
 * }} ListsPendingOrRunningBulkOperation
 */

/**
 * @typedef {{
 *  id: string;
 *  completed: string;
 *  status: 'completed';
 * }} ListsCompletedBulkOperation
 */

/**
 * @typedef {{
 *  id: string;
 *  completed: string;
 *  error: string;
 *  status: 'failed';
 * }} ListsFailedBulkOperation
 */

/**
 * @typedef {ListsPendingOrRunningBulkOperation | ListsCompletedBulkOperation | ListsFailedBulkOperation} BulkOperationGetResponse
 */

if (!process.env.CF_API_TOKEN || !process.env.CF_ACCOUNT_ID) {
  process.stderr.write('Error: CF_API_TOKEN and CF_ACCOUNT_ID environment variables must be set.\n');
  process.exit(1);
}

const accountId = process.env.CF_ACCOUNT_ID;
const listName = 'bitrise_docs'; // 'dev_center';

const client = new Cloudflare({
  apiToken: process.env.CF_API_TOKEN,
});

/**
 * Fetches the devcenter list by name.
 *
 * @returns {Promise<ListsList|null>} - A promise that resolves to the devcenter list or null if not found.
 */
const getDevcenterList = async () => {
  try {
    /** @type {{ result: ListsList[]; }} */
    const response = await client.rules.lists.list({ account_id: accountId });
    return response.result.filter(list => list.name === listName).pop() || null;
  } catch (error) {
    process.stderr.write(`Error fetching ${listName} list: ${error}\n`);
    throw error;
  }
};

/**
 * Polls the status of a Cloudflare bulk operation by its operation ID.
 *
 * @param {string} operationId - The ID of the bulk operation to poll.
 * @returns {Promise<ListsCompletedBulkOperation>} - A promise that resolves to the bulk operation status response.
 */
const pollBulkOperation = async (operationId) => {
  try {
    /** @type {BulkOperationGetResponse} */
    const response = await client.rules.lists.bulkOperations.get(operationId, { account_id: accountId });
    if (response.status === 'failed') {
      throw new Error(response.error);
    }
    if (response.status === 'completed') {
      return response;
    }
    // If the operation is still pending or running, wait and poll again
    process.stdout.write(`[${response.status}]\n`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before polling again
    return pollBulkOperation(operationId);
  } catch (error) {
    process.stderr.write(`Error polling bulk operation ${operationId}: ${error}\n`);
    throw error;
  }
};

/**
 * Fetches all redirect list items for a given list ID, handling pagination if necessary.
 *
 * @param {string} listId - The ID of the list to fetch items from.
 * @param {string|null} cursorAfter - The cursor for pagination, if any.
 * @returns {Promise<ListItemRedirect[]>} - A promise that resolves to an array of redirect list items.
 */
const getRedirectListItems = async (listId, cursorAfter) => {
  try {
    process.stdout.write('.');
    const options = { account_id: accountId };
    if (cursorAfter) {
      options.cursor = cursorAfter;
    }
    /** @type {ListItemsPage} */
    const listItemsPage = await client.rules.lists.items.list(listId, options);
    const redirects = listItemsPage.result;
    if (listItemsPage.result_info.cursors.after) {
      return redirects.concat(await getRedirectListItems(listId, listItemsPage.result_info.cursors.after));
    }
    return redirects;
  } catch (error) {
    process.stderr.write(`Error fetching list items for list ${listId}: ${error}\n`);
    throw error;
  }
};

const main = async () => {
  const devCenterList = await getDevcenterList();
  if (devCenterList) {
    process.stdout.write(`Found ${listName} list: ${devCenterList.id}\n`);

    const newRedirectsJson = './redirects.json';
    const newRedirects = JSON.parse(await fs.promises.readFile(newRedirectsJson, 'utf8'));

    /** @type {ListsListItemRedirectComment[]} */
    const redirectsToUpload = [];

    Object.keys(newRedirects).forEach(sourceUrl => {
      if (sourceUrl.match(/^[^/]/)) {
        process.stderr.write(`Error: Source URL "${sourceUrl}" must start with a slash.\n`);
        return;
      }

      const targetUrl = newRedirects[sourceUrl];
      const urlPrefix = 'https://docs.bitrise.io';
      const targetUrlPrefix = targetUrl.match(/^https?:\/\//) ? '' : urlPrefix;

      const options = {
        status_code: 301,
        preserve_query_string: true
      };
      if (sourceUrl.endsWith('*')) {
        options.subpath_matching = true;
        if (targetUrl.endsWith('$1')) {
          options.target_url = `${targetUrlPrefix}${targetUrl.slice(0, -2)}`;
          options.preserve_path_suffix = true;
        } else {
          options.target_url = `${targetUrlPrefix}${targetUrl}`;
          options.preserve_path_suffix = false;
        }
        redirectsToUpload.push({
          redirect: {
            source_url: `${urlPrefix}${sourceUrl.slice(0, -1)}`,
            ...options,
          }
        });
      } else {
        options.target_url = `${targetUrlPrefix}${targetUrl}`;

        // Redirects for both .html and without .html
        redirectsToUpload.push({
          redirect: {
            source_url: `${urlPrefix}${sourceUrl.replace(/\.html$/, '')}`,
            ...options
          }
        });
        redirectsToUpload.push({
          redirect: {
            source_url: `${urlPrefix}${sourceUrl.replace(/\.html$/, '')}.html`,
            ...options
          }
        });

        if (sourceUrl.match(/^\/en\//)) {
          if (targetUrlPrefix === urlPrefix && targetUrl.match(/^\/en\//)) {
            options.target_url = `${targetUrlPrefix}${targetUrl.replace(/^\/en\//, '/ja/')}`;
          }
          
          // Japanese redirects
          redirectsToUpload.push({
            redirect: {
              source_url: `${urlPrefix}${sourceUrl.replace(/^\/en\//, '/ja/').replace(/\.html$/, '')}`,
              ...options
            }
          });
          redirectsToUpload.push({
            redirect: {
              source_url: `${urlPrefix}${sourceUrl.replace(/^\/en\//, '/ja/').replace(/\.html$/, '')}.html`,
              ...options
            }
          });

          // Legacy Japanese redirects
          redirectsToUpload.push({
            redirect: {
              source_url: `${urlPrefix}${sourceUrl.replace(/^\/en\//, '/jp/').replace(/\.html$/, '')}`,
              ...options
            }
          });
          redirectsToUpload.push({
            redirect: {
              source_url: `${urlPrefix}${sourceUrl.replace(/^\/en\//, '/jp/').replace(/\.html$/, '')}.html`,
              ...options
            }
          });
        }
      }
    });

    process.stdout.write(`Updating items in list ${devCenterList.id}...\n`);

    /** @type {ItemUpdateResponse} */
    const item = await client.rules.lists.items.update(devCenterList.id, {
      account_id: accountId,
      body: redirectsToUpload
    });

    await pollBulkOperation(item.operation_id);
    process.stdout.write(`Updated items in list ${devCenterList.id}\n`);

    // process.stdout.write(`Fetching redirects from list ${devCenterList.id}`);
    // /** @type {ListItemRedirect[]} */
    // const verifyRedirects = await getRedirectListItems(devCenterList.id);
    // process.stdout.write(`done (${verifyRedirects.length})\n`);
    // console.log(verifyRedirects);

    // process.stdout.write(`Fetching redirects from list ${devCenterList.id}`);
    // /** @type {ListItemRedirect[]} */
    // const redirects = await getRedirectListItems(devCenterList.id);
    // process.stdout.write(`done (${redirects.length})\n`);
    // const oldRedirects = {};
    // redirects.forEach(redirect => {
    //   const sourceUrl = redirect.redirect.source_url.trim().replace(/^https?:\/\/devcenter.bitrise.io/, '').replace(/(\.html|\/)$/, '');
    //   const targetUrl = redirect.redirect.target_url.trim().replace(/^https?:\/\/devcenter.bitrise.io/, '').replace(/(\.html|\/)$/, '.html');

    //   oldRedirects[sourceUrl] = targetUrl;
    // });
    // console.log(`Found ${Object.keys(oldRedirects).length} redirects`);
    // await fs.promises.writeFile('./old_redirects.json', JSON.stringify(oldRedirects, null, 2));
  }
};

main().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exit(1);
});
