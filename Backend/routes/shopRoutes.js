const express = require('express');
const router  = express.Router();
const db      = require('../Config/db');

// ── GET /shop/products ───────────────────────────────────────────────────────
// Public – search by name and/or filter by category
router.get('/products', async (req, res) => {
  const { search, category } = req.query;

  let query = `
    SELECT id, name, category, price, image_url
    FROM products
    WHERE 1=1
  `;
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
// Public – single product detail
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
// Save purchase to history
// Body: { user_id, product_id, quantity }
router.post('/purchase', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity || quantity < 1)
    return res.status(400).json({ error: 'user_id, product_id and quantity (≥1) are required' });

  try {
    // Verify product exists and grab its price
    const [products] = await db.query(
      'SELECT id, price FROM products WHERE id = ?',
      [product_id]
    );
    if (products.length === 0)
      return res.status(404).json({ error: 'Product not found' });

    const price_at_purchase = products[0].price;

    await db.query(
      `INSERT INTO history (user_id, product_id, quantity, price_at_purchase)
       VALUES (?, ?, ?, ?)`,
      [user_id, product_id, quantity, price_at_purchase]
    );

    res.json({ message: 'Purchase recorded successfully' });
  } catch (err) {
    console.error('[POST /purchase]', err);
    res.status(500).json({ error: 'Failed to save purchase' });
  }
});

// ── GET /shop/history ────────────────────────────────────────────────────────
// Get purchase history — pass ?user_id=123
router.get('/history', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id)
    return res.status(400).json({ error: 'user_id query param is required' });

  try {
    const [results] = await db.query(
      `SELECT
         h.id,
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
// Public – list distinct categories that actually have products
router.get('/categories', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );
    res.json(results.map(r => r.category));
  } catch (err) {
    console.error('[GET /categories]', err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;