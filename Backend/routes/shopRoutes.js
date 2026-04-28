const express = require('express');
const router = express.Router();
const db = require('../Config/db'); // Adjust path if needed

// Get all products (with optional search/filter)
router.get('/products', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  let params = [];

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Record a purchase in history
router.post('/purchase', (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  const sql = 'INSERT INTO history (user_id, product_id, quantity) VALUES (?, ?, ?)';
  
  db.query(sql, [user_id, product_id, quantity], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Purchase saved to history' });
  });
});

module.exports = router;