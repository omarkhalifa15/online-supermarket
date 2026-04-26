const mysql = require('mysql2');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '../.env' });
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

const results = [];

fs.createReadStream('E:\\Downloads\\archive (1)\\Australia_Grocery_2022Sep.csv')
  .pipe(csv())
  .on('data', (data) => {
    results.push([
      data.Postal_code || null,
      data.Category || null,
      data.Sub_category || null,
      data.Product_Group || null,
      data.Product_Name || null,
      parseFloat(data.Package_price) || null,
      data.Price_per_unit || null,
      data.package_size || null,
      parseInt(data.is_estimated) || 0,
      parseInt(data.is_special) || 0,
      parseInt(data.in_stock) || 0,
      parseFloat(data.Retail_price) || null,
      data.Product_Url || null,
      data.Brand || null,
      data.Sku || null,
      parseFloat(data.unit_price) || null,
      data.unit_price_unit || null,
      data.state || null,
      data.city || null,
    ]);
  })
  .on('end', () => {
    console.log(`Read ${results.length} rows. Importing...`);

    const query = `INSERT INTO products 
      (postal_code, category, sub_category, product_group, product_name, 
      package_price, price_per_unit, package_size, is_estimated, is_special, 
      in_stock, retail_price, product_url, brand, sku, unit_price, 
      unit_price_unit, state, city) VALUES ?`;

    const batchSize = 1000;
    let imported = 0;

    const insertBatch = (batch) => {
      return new Promise((resolve, reject) => {
        connection.query(query, [batch], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    const importAll = async () => {
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        await insertBatch(batch);
        imported += batch.length;
        console.log(`Imported ${imported}/${results.length} rows...`);
      }
      console.log('Import complete!');
      connection.end();
    };

    importAll().catch(console.error);
  });