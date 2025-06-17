const fs = require("fs");

const redirectMarkdown = './redirect.md';
const redirectContent = fs.readFileSync(redirectMarkdown, 'utf8');
const redirects = redirectContent.split('\n')
  .filter(line => line.trim() !== '')
  .map(line => line.split('|').map(part => part.trim()).filter(part => part !== ''))
  .filter(parts => parts.length === 2 && parts[1].startsWith('https') || parts[1].startsWith('/'));
module.exports = redirects;
