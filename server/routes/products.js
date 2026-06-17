import { Router } from 'express';
import pool from '../db/connection.js';

const router = Router();

async function validateProduct(body) {
  const errors = [];
  if (!body.name) errors.push('Name is required');
  if (body.price == null || body.price < 0) errors.push('Valid price is required');
  if (body.stock != null && body.stock < 0) errors.push('Stock cannot be negative');
  return errors;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/', async (req, res) => {
  try {
    const errors = await validateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const { name, price, stock, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)',
      [name, price, stock ?? 0, description ?? null]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });

    const { name, price, stock, description } = req.body;
    if (stock != null && stock < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }
    if (price != null && price < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    await pool.query(
      'UPDATE products SET name = ?, price = ?, stock = ?, description = ? WHERE id = ?',
      [
        name ?? existing[0].name,
        price != null ? price : existing[0].price,
        stock != null ? stock : existing[0].stock,
        description !== undefined ? description : existing[0].description,
        id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      connection.release();
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Product not found' });
    }

    const [saleLinks] = await connection.query(
      'SELECT id FROM sale_items WHERE product_id = ? LIMIT 1',
      [id]
    );
    if (saleLinks.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ error: 'Cannot delete product linked to existing sales' });
    }

    await connection.query('DELETE FROM products WHERE id = ?', [id]);
    await connection.commit();
    res.status(204).send();
  } catch (err) {
    await connection.rollback();
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  } finally {
    connection.release();
  }
});

export default router;
