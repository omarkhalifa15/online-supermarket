const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../Config/db');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@freshmart.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let supportTableReady = false;

const ensureSupportTable = async () => {
  if (supportTableReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      order_id VARCHAR(80),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(30),
      issue_type VARCHAR(60) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  supportTableReady = true;
};

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Admin token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin email or password' });
  }

  const token = jwt.sign(
    { role: 'admin', email: ADMIN_EMAIL },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Admin login successful',
    token,
    admin: { email: ADMIN_EMAIL }
  });
});

router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    await ensureSupportTable();

    const result = await db.query(
      `SELECT
        id,
        user_id,
        order_id,
        name,
        email,
        phone,
        issue_type,
        message,
        status,
        created_at
       FROM support_tickets
       ORDER BY
        CASE status
          WHEN 'Open' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'Resolved' THEN 3
          ELSE 4
        END,
        created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[GET /admin/tickets]', err);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.put('/tickets/:id/status', requireAdmin, async (req, res) => {
  const allowedStatuses = ['Open', 'In Progress', 'Resolved'];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid ticket status' });
  }

  try {
    await ensureSupportTable();

    const result = await db.query(
      'UPDATE support_tickets SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({
      message: 'Ticket status updated',
      ticket: result.rows[0]
    });
  } catch (err) {
    console.error('[PUT /admin/tickets/:id/status]', err);
    res.status(500).json({ message: 'Failed to update ticket status' });
  }
});

module.exports = router;