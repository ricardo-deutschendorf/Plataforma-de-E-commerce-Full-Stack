const pool = require('../functions/db');

const COLUMNS = `
  id, name, description, category,
  image_url AS "imageUrl",
  price::float AS price,
  stock,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

async function findAll() {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products ORDER BY created_at`);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM products WHERE id::text = $1`, [id]
  );
  return rows[0];
}

async function create({ name, description, category, imageUrl, price, stock }) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, category, image_url, price, stock)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
    [name, description, category, imageUrl, price, stock]
  );
  return rows[0];
}

async function update(id, { name, description, category, imageUrl, price, stock }) {
  const { rows } = await pool.query(
    `UPDATE products
        SET name = $2, description = $3, category = $4,
            image_url = $5, price = $6, stock = $7
      WHERE id::text = $1 RETURNING ${COLUMNS}`,
    [id, name, description, category, imageUrl, price, stock]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id::text = $1', [id]);
  return rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };