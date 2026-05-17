require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');

  connection.query('CREATE DATABASE IF NOT EXISTS grocery_db', (err) => {
    if (err) throw err;
    console.log('Database created!');

    connection.query('USE grocery_db', (err) => {
      if (err) throw err;

      // Simplified Products Table to match the 50-item JSON
      const createProducts = `
  CREATE TABLE IF NOT EXISTS products (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(255)  NOT NULL,
    price     DECIMAL(10,2) NOT NULL,
    category  VARCHAR(100)  NOT NULL,
    stock     INT           DEFAULT 0,
    image_url VARCHAR(500)  DEFAULT NULL
  )`;

const createHistory = `
  CREATE TABLE IF NOT EXISTS history (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    order_id          VARCHAR(80) NULL,
    product_id        INT NOT NULL,
    quantity          INT DEFAULT 1,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    shipping_address  TEXT NULL,
    payment_method    VARCHAR(40) NULL,
    payment_details   TEXT NULL,
    purchased_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`;

const createSupportTickets = `
  CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    order_id VARCHAR(80) NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    issue_type VARCHAR(60) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_support_status_created (status, created_at),
    INDEX idx_support_order (order_id)
  )`;

      const createUsers = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NULL,
          age INT NULL,
          address TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

      // Execute queries in sequence to avoid Foreign Key errors
      connection.query(createProducts, (err) => {
        if (err) throw err;
        console.log('Products table ready!');

        connection.query(createUsers, (err) => {
          if (err) throw err;
          console.log('Users table ready!');

          connection.query(createHistory, (err) => {
            if (err) throw err;
            console.log('History table ready!');
            connection.query(createSupportTickets, (err) => {
              if (err) throw err;
              console.log('Support tickets table ready!');
              console.log('All done! Database is ready for the supermarket project.');
              connection.end();
            });
          });
        });
      });
    });
  });
});
