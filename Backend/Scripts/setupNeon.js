require("dotenv").config();
const db = require("../Config/db");

async function setupNeon() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        age INTEGER,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url VARCHAR(500)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        order_id VARCHAR(80),
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        price_at_purchase NUMERIC(10,2) NOT NULL,
        shipping_address TEXT,
        payment_method VARCHAR(40),
        payment_details TEXT,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

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
      );
    `);

    console.log("Neon tables created successfully!");
  } catch (error) {
    console.error("Error creating Neon tables:", error);
  } finally {
    await db.end();
  }
}

setupNeon();