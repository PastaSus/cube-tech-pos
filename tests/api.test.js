import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/index.js';
import pool from '../server/db/connection.js';

let testProductId;

describe('Products API', () => {
  it('GET /api/products returns empty or seeded list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/products creates a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test Burger', price: 5.99, stock: 10, description: 'Test product' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Burger');
    expect(Number(res.body.price)).toBe(5.99);
    expect(res.body.stock).toBe(10);
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
    testProductId = res.body.id;
  });

  it('POST /api/products rejects missing name', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ price: 5.99 });
    expect(res.status).toBe(400);
  });

  it('POST /api/products rejects negative stock', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Bad', price: 5.99, stock: -1 });
    expect(res.status).toBe(400);
  });

  it('GET /api/products/:id returns a product', async () => {
    const res = await request(app).get(`/api/products/${testProductId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Burger');
  });

  it('GET /api/products/:id returns 404 for missing', async () => {
    const res = await request(app).get('/api/products/99999');
    expect(res.status).toBe(404);
  });

  it('PUT /api/products/:id updates a product', async () => {
    const res = await request(app)
      .put(`/api/products/${testProductId}`)
      .send({ name: 'Updated Burger', price: 6.99 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Burger');
    expect(Number(res.body.price)).toBe(6.99);
  });

  it('PUT /api/products/:id rejects negative stock', async () => {
    const res = await request(app)
      .put(`/api/products/${testProductId}`)
      .send({ stock: -5 });
    expect(res.status).toBe(400);
  });
});

describe('Sales API', () => {
  let testSaleId;

  beforeAll(async () => {
    const [rows] = await pool.query('SELECT id, stock FROM products WHERE stock > 0 LIMIT 1');
    if (rows.length === 0) {
      await request(app)
        .post('/api/products')
        .send({ name: 'Sale Item', price: 10.00, stock: 100 });
    }
  });

  it('POST /api/sales completes a sale', async () => {
    const [products] = await pool.query('SELECT id, price, stock FROM products WHERE stock > 0 LIMIT 2');
    expect(products.length).toBeGreaterThan(0);

    const items = products.map(p => ({ product_id: p.id, quantity: 1 }));
    const res = await request(app)
      .post('/api/sales')
      .send({ items });

    expect(res.status).toBe(201);
    expect(res.body.receipt_number).toMatch(/^RCP-/);
    expect(res.body.total).toBeDefined();
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBe(items.length);
    testSaleId = res.body.id;
  });

  it('POST /api/sales rejects empty cart', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({ items: [] });
    expect(res.status).toBe(400);
  });

  it('POST /api/sales rejects negative quantity', async () => {
    const [products] = await pool.query('SELECT id FROM products LIMIT 1');
    const res = await request(app)
      .post('/api/sales')
      .send({ items: [{ product_id: products[0].id, quantity: -1 }] });
    expect(res.status).toBe(400);
  });

  it('POST /api/sales rejects excessive quantity', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({ items: [{ product_id: 99999, quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it('GET /api/sales returns sales list', async () => {
    const res = await request(app).get('/api/sales');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/sales/:id returns sale details', async () => {
    const res = await request(app).get(`/api/sales/${testSaleId}`);
    expect(res.status).toBe(200);
    expect(res.body.receipt_number).toBeDefined();
    expect(res.body.items).toBeDefined();
  });

  it('GET /api/sales/:id returns 404 for missing', async () => {
    const res = await request(app).get('/api/sales/99999');
    expect(res.status).toBe(404);
  });
});

describe('Dashboard API', () => {
  it('GET /api/dashboard returns stats', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalProducts');
    expect(res.body).toHaveProperty('totalInventory');
    expect(res.body).toHaveProperty('totalSales');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(Array.isArray(res.body.recentSales)).toBe(true);
  });
});

afterAll(async () => {
  if (testProductId) {
    await pool.query('DELETE FROM sale_items WHERE product_id = ?', [testProductId]);
    await pool.query('DELETE FROM products WHERE id = ?', [testProductId]);
  }
  await pool.end();
});
