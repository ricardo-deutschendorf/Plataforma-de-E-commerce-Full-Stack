const crypto = require('crypto');
const { readJson, writeJson } = require('../functions/fileStore');

const DATA_FILE = 'data/pastes.json';

async function findAll() {
  const pastes = await readJson(DATA_FILE, []);
  return pastes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function findById(id) {
  return (await readJson(DATA_FILE, [])).find((paste) => paste.id === id);
}

async function create(attributes) {
  const pastes = await readJson(DATA_FILE, []);
  const paste = { id: attributes.id || crypto.randomUUID(), ...attributes };
  pastes.push(paste);
  await writeJson(DATA_FILE, pastes);
  return paste;
}

async function update(id, attributes) {
  const pastes = await readJson(DATA_FILE, []);
  const index = pastes.findIndex((paste) => paste.id === id);
  if (index === -1) return null;

  const updated = { ...pastes[index], ...attributes, updatedAt: new Date().toISOString() };
  pastes[index] = updated;
  await writeJson(DATA_FILE, pastes);
  return updated;
}

async function remove(id) {
  const pastes = await readJson(DATA_FILE, []);
  const remaining = pastes.filter((paste) => paste.id !== id);
  if (remaining.length === pastes.length) return false;

  await writeJson(DATA_FILE, remaining);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
