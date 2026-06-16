import { Router } from 'express';
import pool from '../db/connection.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { name, price, stock, description } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const [result] = await pool.query(
    'INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)',
    [name, price, stock ?? 0, description ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, price, stock, description } = req.body;
  const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });

  await pool.query(
    'UPDATE products SET name = ?, price = ?, stock = ?, description = ? WHERE id = ?',
    [
      name ?? existing[0].name,
      price ?? existing[0].price,
      stock ?? existing[0].stock,
      description !== undefined ? description : existing[0].description,
      req.params.id,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });

  const [saleLinks] = await pool.query(
    'SELECT id FROM sale_items WHERE product_id = ? LIMIT 1',
    [req.params.id]
  );
  if (saleLinks.length > 0) {
    return res.status(409).json({ error: 'Cannot delete product linked to existing sales' });
  }

  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
