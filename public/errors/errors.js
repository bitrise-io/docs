/**
 * @typedef {{
 *  page: {
 *    id: string;
 *    name: string;
 *    url: string;
 *    time_zone: string;
 *    updated_at: string;
 *  };
 *  status: {
 *    indicator: "minor" | "major" | "critical" | "none" | "maintenance";
 *    description: string;
 *  };
 * }} StatusResult;
 */

/**
 * @param {URL} statusURL
 * @returns {Promise<{
 *  severity: "minor" | "major" | "critical" | "none";
 *  message: string;
 * }>}
 */
const getStatus = async (statusURL) => {
  const statusAPIURL = new URL(statusURL);
  statusAPIURL.pathname = '/api/v2/status.json';
  const result = await fetch(statusAPIURL);
  /** @type {StatusResult} */
  const data = await result.json();
  return {
    severity: data.status.indicator === 'maintenance' ? 'minor' : data.status.indicator,
    message: data.status.description,
  };
};

if (window.location.pathname.match(/\/$/)) {
  window.location.pathname = window.location.pathname.replace(/\/$/, '.html');
}

const STATUS_PAGE_ID = '1q8r4n02vb2k';
window.addEventListener('load', async () => {
  document.querySelector('div.copyright p').innerHTML = `&copy; ${new Date().getFullYear()} Bitrise Ltd.`;

  try {
    const statusLink = document.querySelector('div.status a');
    const { severity, message } = await getStatus(statusLink.href);
    statusLink.className = `severity-${severity}`;
    statusLink.innerHTML = `Status: ${message}`;
  } catch (e) {
    /* don't update status badge */
  }
});
