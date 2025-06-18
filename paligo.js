const fs = require('fs');
const unzipper = require('unzipper');

const { PALIGO_API_KEY } = process.env;

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

const publish = async (publishsetting, outputPath) => {
  const createProductionResponse = await createProduction(publishsetting);

  process.stdout.write(`Production created with ID: ${createProductionResponse.id}\n`);
  process.stdout.write('Building production:\n');
  const productionStatus = await pollProductionStatus(createProductionResponse.id, (statusResponse) => {
    process.stdout.write(`  [${statusResponse.status}]`);
    if (statusResponse.steps) process.stdout.write(` ${statusResponse.steps.count}/${statusResponse.steps.total}`);
    if (statusResponse.message) process.stdout.write(`: ${statusResponse.message}`);
    process.stdout.write('\n');
  });
  
  process.stdout.write(`Production completed: ${productionStatus.url}\nDownloading output file...\n`);
  const outputFile = await getOutput(productionStatus.url, `./temp/${productionStatus.id}.zip`);

  process.stdout.write(`Output file downloaded: ${outputFile}\nExtracting output file...\n`);
  const extractPath = await extractOutputFile(outputFile, outputFile.replace('.zip', '/'));

  process.stdout.write(`Output file extracted: ${extractPath}\nDeploying output...\n`);

  if (
    await fs.promises
      .access(outputPath)
      .then(() => true)
      .catch(() => false)
  ) {
    await fs.promises.rm(outputPath, { recursive: true, force: true });
  }

  const folders = await listFolders(extractPath);
  await fs.promises.rename(`${extractPath}${folders[0]}/out`, outputPath);

  process.stdout.write('Output deployed.\n\n');
};

if (process.argv[1] === __filename) {
  if (process.argv[2] === 'list') {
    listPublishSettings().then((settings) => {
      process.stdout.write('Available publish settings:\n');
      settings.publishsettings?.forEach((setting) => {
        process.stdout.write(`- ID: ${setting.id}, Name: ${setting.name}\n`);
      });
      process.exit(0);
    }).catch((error) => {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exit(0);
    });
  } else if (
    process.argv[2] === 'publish') {
    if (process.argv.length < 5) {
      process.stderr.write('Usage: node publish.js publish <publishsetting> <outputPath>\n');
      process.exit(1);
    }
    const publishsetting = process.argv[3];
    const outputPath = process.argv[4];
    publish(publishsetting, outputPath).then(() => {
      process.exit(0);
    }).catch((error) => {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exit(0);
    });
  } else {
    process.stderr.write(`
Usage: node publish.js <list|publish>
- list: List available publish settings
- publish <publishsetting> <outputPath>: Publish using the specified publish setting and output path`);
    process.exit(1);
  }
}

module.exports = { publish };