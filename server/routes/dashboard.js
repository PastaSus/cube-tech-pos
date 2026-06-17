import { Router } from 'express';
import pool from '../db/connection.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [[{ totalProducts }]] = await pool.query(
      'SELECT COUNT(*) AS totalProducts FROM products'
    );
    const [[{ totalInventory }]] = await pool.query(
      'SELECT COALESCE(SUM(stock), 0) AS totalInventory FROM products'
    );
    const [[{ totalSales }]] = await pool.query(
      'SELECT COUNT(*) AS totalSales FROM sales'
    );
    const [[{ totalRevenue }]] = await pool.query(
      'SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM sales'
    );
    const [recentSales] = await pool.query(
      'SELECT * FROM sales ORDER BY created_at DESC LIMIT 5'
    );

    res.json({ totalProducts, totalInventory, totalSales, totalRevenue, recentSales });
  } catch (err) {
    console.error('GET /dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
