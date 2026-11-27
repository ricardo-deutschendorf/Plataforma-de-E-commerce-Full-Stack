const pool = require('../functions/db');

let ownershipColumnReady;

async function ensureOwnershipColumn() {
  if (!ownershipColumnReady) {
    ownershipColumnReady = pool.query(
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id TEXT'
    ).catch((error) => {
      ownershipColumnReady = null;
      throw error;
    });
  }
  await ownershipColumnReady;
}

const COLUMNS = `
  id, name, description, category,
  image_url AS "imageUrl",
  price::float AS price,
  stock,
  owner_id AS "ownerId",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

async function findAll() {
  await ensureOwnershipColumn();
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products ORDER BY created_at`);
  return rows;
}

async function findById(id) {
  await ensureOwnershipColumn();
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM products WHERE id::text = $1`, [id]
  );
  return rows[0];
}

async function create({ name, description, category, imageUrl, price, stock, ownerId = null }) {
  await ensureOwnershipColumn();
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, category, image_url, price, stock, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COLUMNS}`,
    [name, description, category, imageUrl, price, stock, ownerId]
  );
  return rows[0];
}

async function update(id, { name, description, category, imageUrl, price, stock }, ownerId) {
  await ensureOwnershipColumn();
  const { rows } = await pool.query(
    `UPDATE products
        SET name = $2, description = $3, category = $4,
            image_url = $5, price = $6, stock = $7
      WHERE id::text = $1 AND owner_id = $8 RETURNING ${COLUMNS}`,
    [id, name, description, category, imageUrl, price, stock, ownerId]
  );
  return rows[0] || null;
}

async function remove(id, ownerId) {
  await ensureOwnershipColumn();
  const { rowCount } = await pool.query(
    'DELETE FROM products WHERE id::text = $1 AND owner_id = $2',
    [id, ownerId]
  );
  return rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };