const express = require('express');
const router = express.Router();
const db = require('../Config/db');

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

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_support_status_created
    ON support_tickets (status, created_at)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_support_order
    ON support_tickets (order_id)
  `);

  supportTableReady = true;
};

router.post('/tickets', async (req, res) => {
  const {
    user_id,
    order_id,
    name,
    email,
    phone,
    issue_type,
    message
  } = req.body;

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim();
  const cleanIssueType = String(issue_type || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!cleanName || !cleanEmail || !cleanIssueType || !cleanMessage) {
    return res.status(400).json({
      message: 'Name, email, issue type, and message are required'
    });
  }

  if (!cleanEmail.includes('@')) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  try {
    await ensureSupportTable();

    const result = await db.query(
      `INSERT INTO support_tickets
        (user_id, order_id, name, email, phone, issue_type, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, status`,
      [
        user_id || null,
        order_id || null,
        cleanName,
        cleanEmail,
        phone || null,
        cleanIssueType,
        cleanMessage
      ]
    );

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: result.rows[0].id,
        status: result.rows[0].status
      }
    });
  } catch (err) {
    console.error('[POST /support/tickets]', err);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
});

module.exports = router;
