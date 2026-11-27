const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 60 * 1000;

function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  return { token, tokenHash, expiresAt };
}

module.exports = { createEmailVerificationToken };
