const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../Config/db');
require('dotenv').config({ path: '../.env' });

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, phone, age, address } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required' });

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password, phone, age, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, phone || null, age || null, address || null]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0)
      return res.status(400).json({ message: 'Invalid email or password' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:      user.id,
        name:    user.name,
        email:   user.email,
        phone:   user.phone   || '',
        address: user.address || '',
        age:     user.age     || '',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /auth/update ──────────────────────────────────────────────────────────
router.put('/update', async (req, res) => {
  const { user_id, name, email, phone, address } = req.body;

  if (!user_id || !name || !email)
    return res.status(400).json({ message: 'user_id, name and email are required' });

  try {
    const [conflict] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, user_id]
    );
    if (conflict.length > 0)
      return res.status(400).json({ message: 'Email is already in use' });

    await db.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email, phone || null, address || null, user_id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: { id: user_id, name, email, phone: phone || '', address: address || '' },
    });
  } catch (err) {
    console.error('[PUT /auth/update]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /auth/verify-password ───────────────────────────────────────────────
router.post('/verify-password', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Query database using the pool connection
        const [users] = await db.query('SELECT password FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User session expired or not found" });
        }

        const isMatch = await bcrypt.compare(password, users[0].password);
        
        if (isMatch) {
            return res.status(200).json({ success: true, message: "Verified" });
        } else {
            return res.status(401).json({ message: "Incorrect password" });
        }
    } catch (error) {
        console.error('[Verify Password Error]:', error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;