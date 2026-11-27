const pool = require('../functions/db');
const { hashPassword } = require('../functions/password');

const COLUMNS = `
  id,
  name,
  email,
  password_hash AS password,
  email_verified_at AS "emailVerifiedAt",
  email_verification_token_hash AS "emailVerificationTokenHash",
  email_verification_expires_at AS "emailVerificationExpiresAt",
  created_at AS "createdAt"
`;

async function findByEmail(email) {
  const { rows } = await pool.query(
    `
      SELECT ${COLUMNS}
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
}

async function create({ name, email, password }) {
  const passwordHash = hashPassword(password);

  const { rows } = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, LOWER($2), $3)
      RETURNING ${COLUMNS}
    `,
    [
      name,
      email,
      passwordHash
    ]
  );

  console.log('Usuário gravado na Neon:', {
    id: rows[0]?.id,
    email: rows[0]?.email
  });

  return rows[0];
}

async function setEmailVerification(
  userId,
  tokenHash,
  expiresAt
) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        email_verification_token_hash = $1,
        email_verification_expires_at = $2
      WHERE id::text = $3
      RETURNING ${COLUMNS}
    `,
    [
      tokenHash,
      expiresAt,
      userId
    ]
  );

  return rows[0] || null;
}

async function verifyEmail(tokenHash) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        email_verified_at = NOW(),
        email_verification_token_hash = NULL,
        email_verification_expires_at = NULL
      WHERE
        email_verification_token_hash = $1
        AND email_verification_expires_at > NOW()
      RETURNING ${COLUMNS}
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

module.exports = {
  findByEmail,
  create,
  setEmailVerification,
  verifyEmail
};