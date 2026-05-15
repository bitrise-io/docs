const fs = require('fs');
const path = require('path');

const redirects = JSON.parse(fs.readFileSync('./redirects.json', 'utf8'));
const outputPath = path.join('./build', '_redirects');

const lines = [
  '# Language redirects',
  '/ja/*  /en/:splat  301',
  '/jp/*  /en/:splat  301',
  '',
  '# Page-specific redirects',
];

const seen = new Set();

for (const [source, target] of Object.entries(redirects)) {
  const normalized = source.replace(/\.html$/, '');

  if (seen.has(normalized)) continue;

  const htmlVariant = normalized + '.html';
  const htmlTarget = redirects[htmlVariant];
  if (htmlTarget && htmlTarget === target) {
    seen.add(normalized);
    seen.add(htmlVariant);
  } else {
    seen.add(source);
  }

  lines.push(`${source}  ${target}  301`);
}

fs.writeFileSync(outputPath, lines.join('\n') + '\n');
process.stdout.write(`Generated ${outputPath} with ${lines.length - 4} redirect rules\n`);
