const fs = require('fs/promises');
const path = require('path');

async function readJson(relativePath, fallback = []) {
  const filePath = path.join(__dirname, '..', relativePath);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeJson(relativePath, value) {
  const filePath = path.join(__dirname, '..', relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

module.exports = { readJson, writeJson };
