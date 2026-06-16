import { Router } from 'express';
import pool from '../db/connection.js';

const router = Router();

function generateReceiptNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `RCP-${y}${m}${d}-${rand}`;
}

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM sales ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
  if (sale.length === 0) return res.status(404).json({ error: 'Sale not found' });

  const [items] = await pool.query(
    `SELECT si.*, p.name AS product_name
     FROM sale_items si
     JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?`,
    [req.params.id]
  );
  res.json({ ...sale[0], items });
});

router.post('/', async (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart must have at least one item' });
  }

  const connection = await pool.getConnection();
  try {
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
    let isUnique = false;
    while (!isUnique) {
      receiptNumber = generateReceiptNumber();
      const [existing] = await connection.query(
        'SELECT id FROM sales WHERE receipt_number = ?',
        [receiptNumber]
      );
      if (existing.length === 0) isUnique = true;
    }

    const [saleResult] = await connection.query(
      'INSERT INTO sales (receipt_number, total) VALUES (?, ?)',
      [receiptNumber, total]
    );

    for (const si of saleItems) {
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [saleResult.insertId, si.product_id, si.quantity, si.unit_price, si.subtotal]
      );
    }

    await connection.commit();

    const [newSale] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleResult.insertId]);
    const [newItems] = await connection.query(
      `SELECT si.*, p.name AS product_name
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [saleResult.insertId]
    );

    res.status(201).json({ ...newSale[0], items: newItems });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
