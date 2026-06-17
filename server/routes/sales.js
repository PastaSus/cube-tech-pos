import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db/connection.js';

const router = Router();

function generateReceiptNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = crypto.randomInt(100000, 999999);
  return `RCP-${y}${m}${d}-${rand}`;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sales ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /sales error:', err);
    res.status(500).json({ error: 'Failed to list sales' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid sale ID' });
    }
    const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    if (sale.length === 0) return res.status(404).json({ error: 'Sale not found' });

    const [items] = await pool.query(
      `SELECT si.*, p.name AS product_name
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [id]
    );
    res.json({ ...sale[0], items });
  } catch (err) {
    console.error('GET /sales/:id error:', err);
    res.status(500).json({ error: 'Failed to get sale' });
  }
});

router.post('/', async (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart must have at least one item' });
  }

  for (const [i, item] of items.entries()) {
    if (!item.product_id || !Number.isInteger(item.product_id) || item.product_id <= 0) {
      return res.status(400).json({ error: `Item ${i}: invalid product_id` });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: `Item ${i}: quantity must be a positive integer` });
    }
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let total = 0;
    const saleItems = [];

    for (const item of items) {
      const [product] = await connection.query(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      if (product.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      if (product[0].stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product[0].name}`);
      }

      const subtotal = Number(product[0].price) * item.quantity;
      total += subtotal;

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      saleItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product[0].price,
        subtotal,
      });
    }

    let receiptNumber;
    let attempts = 0;
    while (attempts < 10) {
      receiptNumber = generateReceiptNumber();
      const [existing] = await connection.query(
        'SELECT id FROM sales WHERE receipt_number = ?',
        [receiptNumber]
      );
      if (existing.length === 0) break;
      attempts++;
    }
    if (attempts >= 10) {
      throw new Error('Could not generate unique receipt number');
    }

    const [saleResult] = await connection.query(
      'INSERT INTO sales (receipt_number, total) VALUES (?, ?)',
      [receiptNumber, total]
    );

    const saleId = saleResult.insertId;
    for (const si of saleItems) {
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [saleId, si.product_id, si.quantity, si.unit_price, si.subtotal]
      );
    }

    await connection.commit();

    const [newSale] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    const [newItems] = await connection.query(
      `SELECT si.*, p.name AS product_name
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [saleId]
    );

    res.status(201).json({ ...newSale[0], items: newItems });
  } catch (err) {
    if (connection) await connection.rollback();
    const status = err.message.includes('not found') || err.message.includes('stock') || err.message.includes('receipt') ? 400 : 500;
    res.status(status).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
