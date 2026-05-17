const express = require('express');
const router  = express.Router();
const db      = require('../Config/db');

const getProductDiscount = (category) => {
  const discountMap = {
    Fruits: 20,
    Vegetables: 15,
    Dairy: 10,
    Beverages: 12,
    Snacks: 18,
    Bakery: 10,
    Meat: 8
  };

  return discountMap[category] || 10;
};

const getDiscountedPrice = (price, category) => {
  const discount = getProductDiscount(category);
  return Number(price) - (Number(price) * discount / 100);
};

const makePaymentReference = () => `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const normalizePaymentDetails = (paymentMethod, details = {}) => {
  if (paymentMethod === 'cash' || !paymentMethod) return null;
  details = details || {};

  if (details.card_number || details.cvv) {
    const err = new Error('Full card number and CVV must not be stored');
    err.status = 400;
    throw err;
  }

  if (paymentMethod === 'visa') {
    const cardholder = String(details.cardholder_name || '').trim();
    const cardLast4 = String(details.card_last4 || '').replace(/\D/g, '');
    const cardExpiry = String(details.card_expiry || '').trim();

    if (!cardholder || !/^\d{4}$/.test(cardLast4) || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      const err = new Error('Cardholder name, card last 4 digits, and expiry date are required');
      err.status = 400;
      throw err;
    }

    return JSON.stringify({
      provider: 'Visa',
      cardholder_name: cardholder,
      card_last4: cardLast4,
      card_expiry: cardExpiry,
      payment_reference: makePaymentReference()
    });
  }

  if (paymentMethod === 'applepay') {
    const appleAccount = String(details.applepay_account || '').trim();

    if (!appleAccount) {
      const err = new Error('Apple Pay account email or phone is required');
      err.status = 400;
      throw err;
    }

    return JSON.stringify({
      provider: 'Apple Pay',
      applepay_account: appleAccount,
      payment_reference: makePaymentReference()
    });
  }

  return null;
};

let checkoutColumnsReady = false;

const ensureCheckoutColumns = async (conn = db) => {
  if (checkoutColumnsReady) return;

  const [columns] = await conn.query('SHOW COLUMNS FROM history');
  const columnNames = new Set(columns.map((column) => column.Field));

  if (!columnNames.has('order_id')) {
    await conn.query('ALTER TABLE history ADD COLUMN order_id VARCHAR(80) NULL AFTER user_id');
  }

  if (!columnNames.has('shipping_address')) {
    await conn.query('ALTER TABLE history ADD COLUMN shipping_address TEXT NULL AFTER price_at_purchase');
  }

  if (!columnNames.has('payment_method')) {
    await conn.query('ALTER TABLE history ADD COLUMN payment_method VARCHAR(40) NULL AFTER shipping_address');
  }

  if (!columnNames.has('payment_details')) {
    await conn.query('ALTER TABLE history ADD COLUMN payment_details TEXT NULL AFTER payment_method');
  }

  checkoutColumnsReady = true;
};

// ── GET /shop/products ───────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const { search, category } = req.query;

  let query = `SELECT id, name, category, price, image_url, stock FROM products WHERE 1=1`;
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
      'SELECT id, name, category, price, image_url, stock FROM products WHERE id = ?',
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
  const { user_id, product_id, quantity, shipping_address, payment_method, payment_details } = req.body;

  if (!user_id || !product_id || !quantity || quantity < 1)
    return res.status(400).json({ error: 'user_id, product_id and quantity (≥1) are required' });

  try {
    await ensureCheckoutColumns();
    const safePaymentDetails = normalizePaymentDetails(payment_method, payment_details);

    const [products] = await db.query('SELECT id, price, category, stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0)
      return res.status(404).json({ error: 'Product not found' });

    const product = products[0];
    const purchasePrice = getDiscountedPrice(product.price, product.category);
    if (product.stock < quantity)
      return res.status(400).json({ error: 'Not enough stock available' });

    await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product_id]);
    await db.query(
      `INSERT INTO history
        (user_id, product_id, quantity, price_at_purchase, shipping_address, payment_method, payment_details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, product_id, quantity, purchasePrice, shipping_address || null, payment_method || null, safePaymentDetails]
    );
    res.json({ message: 'Purchase recorded successfully' });
  } catch (err) {
    console.error('[POST /purchase]', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to save purchase' });
  }
});

// ── POST /shop/purchase/batch ────────────────────────────────────────────────
// Checkout: record all cart items in a single transaction
// Body: { user_id, items: [{ product_id, quantity }, ...] }
router.post('/purchase/batch', async (req, res) => {
  const { user_id, items, shipping_address, payment_method, payment_details } = req.body;

  if (!user_id || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'user_id and a non-empty items array are required' });

  if (!shipping_address || !shipping_address.trim())
    return res.status(400).json({ error: 'Delivery address is required' });

  if (!payment_method || !['cash', 'visa', 'applepay'].includes(payment_method))
    return res.status(400).json({ error: 'Valid payment method is required' });

  const orderId = `ORD-${Date.now()}-${user_id}`;
  let safePaymentDetails = null;

  try {
    safePaymentDetails = normalizePaymentDetails(payment_method, payment_details);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const conn = await db.getConnection();

  try {
    await ensureCheckoutColumns(conn);
    await conn.beginTransaction();

    for (const item of items) {
      const [products] = await conn.query(
        'SELECT id, price, category, stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      const product = products[0];
      const purchasePrice = getDiscountedPrice(product.price, product.category);
      if (product.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ error: `Not enough stock for product ${item.product_id}` });
      }

      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      await conn.query(
        `INSERT INTO history 
         (user_id, order_id, product_id, quantity, price_at_purchase, shipping_address, payment_method, payment_details) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          orderId,
          item.product_id,
          item.quantity,
          purchasePrice,
          shipping_address.trim(),
          payment_method,
          safePaymentDetails
        ]
      );
    }

    await conn.commit();

    res.json({
      message: 'Order placed successfully',
      order_id: orderId,
      count: items.length
    });

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
    await ensureCheckoutColumns();

    const [results] = await db.query(
      `SELECT
         h.id,
         h.order_id,
         p.id AS product_id,
         p.name AS product_name,
         p.image_url,
         p.category,
         p.price AS original_price,
         h.quantity,
         h.price_at_purchase AS price,
         h.shipping_address,
         h.payment_method,
         h.payment_details,
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
