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

      const createProducts = `
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          postal_code VARCHAR(20),
          category VARCHAR(100),
          sub_category VARCHAR(100),
          product_group VARCHAR(100),
          product_name VARCHAR(255),
          package_price DECIMAL(10,2),
          price_per_unit VARCHAR(50),
          package_size VARCHAR(50),
          is_estimated TINYINT(1),
          is_special TINYINT(1),
          in_stock TINYINT(1),
          retail_price DECIMAL(10,2),
          product_url TEXT,
          brand VARCHAR(100),
          sku VARCHAR(50),
          unit_price DECIMAL(10,2),
          unit_price_unit VARCHAR(20),
          state VARCHAR(10),
          city VARCHAR(100)
        )`;
       

connection.query(alterUsers, (err) => {
  if (err) throw err;
  console.log('Users table updated with new columns!');
});

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

      connection.query(createProducts, (err) => {
        if (err) throw err;
        console.log('Products table created!');

        connection.query(createUsers, (err) => {
          if (err) throw err;
          console.log('Users table created!');

          connection.query(createHistory, (err) => {
            if (err) throw err;
            console.log('History table created!');
            console.log('All done! Database is ready.');
            connection.end();
          });
        });
      });
    });
  });
});