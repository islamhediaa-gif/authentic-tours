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

async function checkData() {
  const dbConfig = {
    host: process.env.MYSQLHOST || 'interchange.proxy.rlwy.net',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 36607
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('--- Database Sync Verification ---');

    const tables = [
      'tenants', 'users', 'customers', 'suppliers', 
      'transactions', 'treasuries', 'currencies', 
      'journal_entries', 'programs', 'master_trips'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table.padEnd(15)}: ${rows[0].count} records`);
      } catch (e) {
        console.log(`${table.padEnd(15)}: Table or error`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkData();
