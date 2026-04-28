const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Middleware (Order matters)
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// 2. Import Routes
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shopRoutes'); 

// 3. Define Routes
// Auth routes remain at the root if you prefer, or add a prefix
app.use('', authRoutes); 
app.use('/shop', shopRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});