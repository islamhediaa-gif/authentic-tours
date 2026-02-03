const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env.local')));
  for (const k in envConfig) { process.env[k] = envConfig[k]; }
} else {
  dotenv.config();
}

async function fix() {
  const dbConfig = {
    host: process.env.MYSQLHOST || 'interchange.proxy.rlwy.net',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 36607
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL');

    console.log("Checking for 'target_entity_type' column...");
    const [cols] = await connection.query("SHOW COLUMNS FROM transactions");
    if (!cols.some(c => c.Field === 'target_entity_type')) {
      await connection.query("ALTER TABLE transactions ADD COLUMN target_entity_type VARCHAR(50) AFTER target_entity_id");
      console.log("Added 'target_entity_type' column to transactions.");
    }

    console.log("Checking for 'previous_rate' column in currencies...");
    const [currCols] = await connection.query("SHOW COLUMNS FROM currencies");
    if (!currCols.some(c => c.Field === 'previous_rate')) {
      await connection.query("ALTER TABLE currencies ADD COLUMN previous_rate DECIMAL(15, 6) DEFAULT 1");
      console.log("Added 'previous_rate' column to currencies.");
    }

    await connection.end();
    console.log('Fix completed!');
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

fix();
