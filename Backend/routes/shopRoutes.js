const express = require('express');
const router  = express.Router();
const db      = require('../Config/db');

// ── GET /shop/products ───────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const { search, category } = req.query;

  let query = `SELECT id, name, category, price, image_url FROM products WHERE 1=1`;
  const params = [];

  if (search && search.trim()) {
    query += ' AND name LIKE ?';
    params.push(`%${search.trim()}%`);
  }
  if (category && category.trim()) {
    query += ' AND category = ?';
    params.push(category.trim());
  }
  query += ' ORDER BY name ASC';

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('[GET /products]', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── GET /shop/products/:id ───────────────────────────────────────────────────
router.get('/products/:id', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, name, category, price, image_url FROM products WHERE id = ?',
      [req.params.id]
    );
    if (results.length === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json(results[0]);
  } catch (err) {
    console.error('[GET /products/:id]', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── POST /shop/purchase ──────────────────────────────────────────────────────
// Single item purchase (kept for backward compatibility)
router.post('/purchase', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity || quantity < 1)
    return res.status(400).json({ error: 'user_id, product_id and quantity (≥1) are required' });

  try {
    const [products] = await db.query('SELECT id, price FROM products WHERE id = ?', [product_id]);
    if (products.length === 0)
      return res.status(404).json({ error: 'Product not found' });

    await db.query(
      `INSERT INTO history (user_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
      [user_id, product_id, quantity, products[0].price]
    );
    res.json({ message: 'Purchase recorded successfully' });
  } catch (err) {
    console.error('[POST /purchase]', err);
    res.status(500).json({ error: 'Failed to save purchase' });
  }
});

// ── POST /shop/purchase/batch ────────────────────────────────────────────────
// Checkout: record all cart items in a single transaction
// Body: { user_id, items: [{ product_id, quantity }, ...] }
router.post('/purchase/batch', async (req, res) => {
  const { user_id, items } = req.body;

  if (!user_id || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'user_id and a non-empty items array are required' });

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity < 1)
      return res.status(400).json({ error: 'Each item must have product_id and quantity ≥ 1' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of items) {
      const [products] = await conn.query(
        'SELECT id, price FROM products WHERE id = ?',
        [item.product_id]
      );
      if (products.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      await conn.query(
        `INSERT INTO history (user_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
        [user_id, item.product_id, item.quantity, products[0].price]
      );
    }

    await conn.commit();
    res.json({ message: 'Order placed successfully', count: items.length });
  } catch (err) {
    await conn.rollback();
    console.error('[POST /purchase/batch]', err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    conn.release();
  }
});

// ── GET /shop/history ────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id)
    return res.status(400).json({ error: 'user_id query param is required' });

  try {
    const [results] = await db.query(
      `SELECT
         h.id,
         p.id          AS product_id,
         p.name        AS product_name,
         p.image_url,
         p.category,
         h.quantity,
         h.price_at_purchase AS price,
         h.purchased_at
       FROM history h
       JOIN products p ON h.product_id = p.id
       WHERE h.user_id = ?
       ORDER BY h.purchased_at DESC`,
      [user_id]
    );
    res.json(results);
  } catch (err) {
    console.error('[GET /history]', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ── GET /shop/categories ─────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const [results] = await db.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    res.json(results.map(r => r.category));
  } catch (err) {
    console.error('[GET /categories]', err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;