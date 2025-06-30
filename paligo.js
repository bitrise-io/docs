const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const { PALIGO_API_KEY } = process.env;

const LATEST_PALIGO_FILE = '.paligo.json';

const listPublishSettings = async () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${PALIGO_API_KEY}`,
  };
  const response = await fetch('https://bitrise.paligoapp.com/api/v2/publishsettings/', {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  return response.json();
};

const listProductions = async () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${PALIGO_API_KEY}`,
  };
  const response = await fetch('https://bitrise.paligoapp.com/api/v2/productions/', {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

const createProduction = async (publishsetting) => {
  const inputBody = JSON.stringify({ publishsetting });
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${PALIGO_API_KEY}`,
  };

  const response = await fetch('https://bitrise.paligoapp.com/api/v2/productions/', {
    method: 'POST',
    body: inputBody,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

const showProduction = async (productionId) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${PALIGO_API_KEY}`,
  };

  const response = await fetch(`https://bitrise.paligoapp.com/api/v2/productions/${productionId}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

const pollProductionStatus = async (productionId, handleResponse) => {
  const response = await showProduction(productionId);
  if (handleResponse) handleResponse(response);
  if (response.status !== 'done') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(pollProductionStatus(productionId, handleResponse));
      }, 5000); // Poll every 5 seconds
    });
  }
  return response;
};

const getOutput = async (outputUrl, outputPath) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${PALIGO_API_KEY}`,
  };

  const response = await fetch(outputUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(outputPath, buffer);

  return outputPath;
};

const extractOutputFile = async (outputPath, extractPath) => {
  await fs.promises.mkdir(extractPath, { recursive: true });
  await fs
    .createReadStream(outputPath)
    .pipe(unzipper.Extract({ path: extractPath }))
    .promise();
  return extractPath;
};

const listFolders = async (dirPath) => {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
};

const pathExists = async (filePath) => {
  return await fs.promises.access(filePath).then(() => true).catch(() => false);
};

const publish = async (publishsetting, outputPath, useLatest) => {
  let productionId;
  if (useLatest) {
    // const latestPaligoFilePath = path.join(outputPath, LATEST_PALIGO_FILE);
    // process.stdout.write(`Checking for latest production file: ${latestPaligoFilePath} `);
    // if (await pathExists(latestPaligoFilePath)) {
    //   process.stdout.write(`found\n`);
    //   const latestPaligoData = JSON.parse(await fs.promises.readFile(latestPaligoFilePath, 'utf8'));
    //   process.stdout.write(`Using last production: ${latestPaligoData.id}\n`);
    //   productionId = latestPaligoData.id;
    // } else {
    //   process.stdout.write(`not found\n`);
      const latestPaligoFileUrl = `https://devcenter.bitrise.dev/${LATEST_PALIGO_FILE}`;
      process.stdout.write(`Fetching ${latestPaligoFileUrl} `);
      const latestPaligoDataResponse = await fetch(latestPaligoFileUrl);
      if (latestPaligoDataResponse.ok) {
        const latestPaligoData = await latestPaligoDataResponse.json();
        process.stdout.write(`done\n`);
        process.stdout.write(`Using last production: ${latestPaligoData.id}\n`);
        productionId = latestPaligoData.id;
      } else {
        process.stdout.write(`failed: ${latestPaligoDataResponse.status} ${latestPaligoDataResponse.statusText}\n`);
        process.stdout.write(`No last production found, creating a new one.\n`);
      }
    // }
  }
  if (!productionId) {
    const createProductionResponse = await createProduction(publishsetting);
    process.stdout.write(`Production created: ${createProductionResponse.id}\n`);
    productionId = createProductionResponse.id;
    process.stdout.write('Building production:\n');
  }
  const productionStatus = await pollProductionStatus(productionId, (statusResponse) => {
    process.stdout.write(`  [${statusResponse.status}]`);
    if (statusResponse.steps) process.stdout.write(` ${statusResponse.steps.count}/${statusResponse.steps.total}`);
    if (statusResponse.message) process.stdout.write(`: ${statusResponse.message}`);
    process.stdout.write('\n');
  });

  process.stdout.write(`Downloading output file: ${productionStatus.url}...\n`);

  const tempPath = path.join(__dirname, 'temp');
  if (!(await pathExists(tempPath))) {
    await fs.promises.mkdir(tempPath, { recursive: true });
  }
  const outputFile = await getOutput(productionStatus.url, path.join(tempPath, `${productionStatus.id}.zip`));

  process.stdout.write(`Output file downloaded: ${outputFile}\nExtracting output file...\n`);
  const extractPath = await extractOutputFile(outputFile, outputFile.replace('.zip', '/'));

  process.stdout.write(`Output file extracted: ${extractPath}\nDeploying output...\n`);

  if (await (pathExists(outputPath))) {
    await fs.promises.rm(outputPath, { recursive: true, force: true });
  }
  const folders = await listFolders(extractPath);
  await fs.promises.rename(path.join(extractPath, folders[0], 'out'), outputPath);
  await fs.promises.writeFile(path.join(outputPath, LATEST_PALIGO_FILE), JSON.stringify({ id: productionId }));  
  await fs.promises.rm(extractPath, { recursive: true, force: true });

  process.stdout.write('Output deployed.\n\n');
};

if (process.argv[1] === __filename) {

  const cli = async () => {
    if (process.argv[2] === 'list') {
      const settings = await listPublishSettings();
      process.stdout.write('Available publish settings:\n');
      console.log(settings);
      settings.publishsettings?.forEach((setting) => {
        process.stdout.write(`- ID: ${setting.id}, Name: ${setting.name}\n`);
      });
    } else if (process.argv[2] === 'publish' || process.argv[2] === 'download_latest') {
      if (process.argv.length < 5) {
        process.stderr.write(`Usage: node publish.js ${process.argv[2]} <publishsetting> <outputPath>\n`);
        process.exit(1);
      }
      const publishsetting = process.argv[3];
      const outputPath = process.argv[4];
      await publish(publishsetting, outputPath, process.argv[2] === 'download_latest');
    } else {
      process.stderr.write(`
Usage: node publish.js <list|publish>
- list: List available publish settings
- publish <publishsetting> <outputPath>: Publish using the specified publish setting and output path
- download_latest <publishsetting> <outputPath>: Download the latest production for the specified publish setting and output path`);
      process.exit(1);
    }
    process.exit(0);
  };

  cli().catch((error) => {
    throw error;
  });
}

module.exports = { pathExists, publish };