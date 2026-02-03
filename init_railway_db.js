
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function initDB() {
  console.log("Connecting to Railway MySQL...");
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    multipleStatements: true
  });

  console.log("Reading schema file...");
  const schema = fs.readFileSync(path.join(__dirname, 'railway_schema.sql'), 'utf8');

  console.log("Executing schema...");
  try {
    await connection.query(schema);
    console.log("✅ Database Schema initialized successfully on Railway!");
  } catch (err) {
    console.error("❌ Error initializing schema:", err.message);
  } finally {
    await connection.end();
  }
}

initDB();
