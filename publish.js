const fs = require('fs');
const unzipper = require('unzipper');

const { POLIGO_API_KEY } = process.env;

const listPublishSettings = async () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${POLIGO_API_KEY}`,
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

const createProduction = async () => {
  const inputBody = '{ "publishsetting": "19" }';
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${POLIGO_API_KEY}`,
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
    Authorization: `Basic ${POLIGO_API_KEY}`,
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
    Authorization: `Basic ${POLIGO_API_KEY}`,
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

// listPublishSettings().then((settings) => {
//   process.stdout.write('Available publish settings:\n');
//   settings.publishsettings?.forEach((setting) => {
//     process.stdout.write(`- ID: ${setting.id}, Name: ${setting.name}\n`);
//   });
// }).catch((error) => {
//   process.stderr.write(`Error fetching publish settings: ${error.message}\n`);
// });

createProduction()
  .then(async (response) => {
    process.stdout.write(`Production created with ID: ${response.id}\n`);
    process.stdout.write('Building production:\n');
    return pollProductionStatus(response.id, (statusResponse) => {
      process.stdout.write(`[${statusResponse.status}]`);
      if (statusResponse.steps) process.stdout.write(` ${statusResponse.steps.count}/${statusResponse.steps.total}`);
      if (statusResponse.message) process.stdout.write(`: ${statusResponse.message}`);
      process.stdout.write('\n');
    });
  })
  .then((response) => {
    process.stdout.write(`Production completed: ${response.url}\nDownloading output file...\n`);
    return getOutput(response.url, `./temp/${response.id}.zip`);
  })
  .then((outputPath) => {
    process.stdout.write(`Output file downloaded: ${outputPath}\nExtracting output file...\n`);
    return extractOutputFile(outputPath, outputPath.replace('.zip', '/'));
  })
  .then(async (extractPath) => {
    process.stdout.write(`Output file extracted: ${extractPath}\nDeploying output...\n`);

    const folders = await listFolders(extractPath);
    const outFolder = `${extractPath}${folders[0]}`;

    if (
      await fs.promises
        .access('./out')
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.promises.rm('./out', { recursive: true, force: true });
    }
    await fs.promises.rename(`${outFolder}/out`, './out');

    process.stdout.write('Output deployed.\n\n');
  })
  .catch((error) => {
    process.stderr('Error:', error.message);
  });
