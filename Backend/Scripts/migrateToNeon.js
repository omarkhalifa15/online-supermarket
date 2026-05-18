require("dotenv").config();
const mysql = require("mysql2/promise");
const db = require("../Config/db");

async function migrateTable(mysqlConnection, tableName, columns) {
  const [rows] = await mysqlConnection.execute(`SELECT * FROM ${tableName}`);

  console.log(`Migrating ${tableName}: ${rows.length} rows`);

  if (rows.length === 0) return;

  for (const row of rows) {
    const values = columns.map((col) => row[col]);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const columnNames = columns.join(", ");

    await db.query(
      `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
      values
    );
  }

  console.log(`${tableName} migrated successfully`);
}

async function migrate() {
  let mysqlConnection;

  try {
    mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Connected to MySQL");

    await db.query("DELETE FROM history");
    await db.query("DELETE FROM support_tickets");
    await db.query("DELETE FROM products");
    await db.query("DELETE FROM users");

    await migrateTable(mysqlConnection, "users", [
      "id",
      "name",
      "email",
      "password",
      "phone",
      "age",
      "address",
      "created_at",
    ]);

    await migrateTable(mysqlConnection, "products", [
      "id",
      "name",
      "price",
      "category",
      "stock",
      "image_url",
    ]);

    await migrateTable(mysqlConnection, "history", [
      "id",
      "user_id",
      "order_id",
      "product_id",
      "quantity",
      "price_at_purchase",
      "shipping_address",
      "payment_method",
      "payment_details",
      "purchased_at",
    ]);

    await migrateTable(mysqlConnection, "support_tickets", [
      "id",
      "user_id",
      "order_id",
      "name",
      "email",
      "phone",
      "issue_type",
      "message",
      "status",
      "created_at",
    ]);

    await db.query(`
      SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
      SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
      SELECT setval('history_id_seq', COALESCE((SELECT MAX(id) FROM history), 1));
      SELECT setval('support_tickets_id_seq', COALESCE((SELECT MAX(id) FROM support_tickets), 1));
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await db.end();
  }
}

migrate();