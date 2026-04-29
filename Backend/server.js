const express = require('express');
const cors = require('cors');
require('dotenv').config();
 
const app = express();
 
// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
 
// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shopRoutes');
 
app.use('', authRoutes);     // POST /auth/login, POST /auth/register
app.use('/shop', shopRoutes);     // GET /shop/products, POST /shop/purchase, GET /shop/history
 
// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
 
// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));