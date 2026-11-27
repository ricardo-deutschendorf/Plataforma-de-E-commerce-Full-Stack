const crypto = require('crypto');
const { readJson, writeJson } = require('../functions/fileStore');
const { hashPassword } = require('../functions/password');

const DATA_FILE = 'data/users.json';

async function findByEmail(email) {
  const users = await readJson(DATA_FILE, []);
  return users.find((user) => user.email === email.toLowerCase());
}

async function create({ name, email, password }) {
  const users = await readJson(DATA_FILE, []);
  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password: hashPassword(password),
    emailVerifiedAt: null,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeJson(DATA_FILE, users);
  return user;
}

async function setEmailVerification(userId, tokenHash, expiresAt) {
  const users = await readJson(DATA_FILE, []);
  const user = users.find((item) => item.id === userId);
  if (!user) return null;

  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  await writeJson(DATA_FILE, users);
  return user;
}

async function verifyEmail(tokenHash) {
  const users = await readJson(DATA_FILE, []);
  const user = users.find((item) =>
    item.emailVerificationTokenHash === tokenHash &&
    item.emailVerificationExpiresAt &&
    new Date(item.emailVerificationExpiresAt) > new Date()
  );
  if (!user) return null;

  user.emailVerifiedAt = new Date().toISOString();
  delete user.emailVerificationTokenHash;
  delete user.emailVerificationExpiresAt;
  await writeJson(DATA_FILE, users);
  return user;
}

module.exports = { findByEmail, create, setEmailVerification, verifyEmail };
