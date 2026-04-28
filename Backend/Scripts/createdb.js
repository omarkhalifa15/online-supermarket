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
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          category VARCHAR(100) NOT NULL,
          stock INT DEFAULT 0
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

      // This table serves as your "Orders" or purchase history
      const createHistory = `
        CREATE TABLE IF NOT EXISTS history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT DEFAULT 1,
          purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
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
            console.log('All done! Database is ready for the supermarket project.');
            connection.end();
          });
        });
      });
    });
  });
});