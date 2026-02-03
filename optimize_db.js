
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

async function optimizeSpeed() {
  console.log("Optimizing database speed on Railway...");
  const connection = await pool.getConnection();

  try {
    // 1. Add Index to journal_lines for tenant_id if not exists
    console.log("Adding index to journal_lines...");
    try {
        await connection.query("CREATE INDEX idx_tenant_id ON journal_lines(tenant_id)");
        console.log("Index added to journal_lines.");
    } catch (e) { console.log("Index might already exist in journal_lines."); }

    // 2. Add Index to transactions for tenant_id if not exists
    console.log("Adding index to transactions...");
    try {
        await connection.query("CREATE INDEX idx_tenant_id_tx ON transactions(tenant_id)");
    } catch (e) { console.log("Index might already exist in transactions."); }

    // 3. Fix potential nulls in journal_lines
    await connection.query("UPDATE journal_lines SET debit = 0 WHERE debit IS NULL");
    await connection.query("UPDATE journal_lines SET credit = 0 WHERE credit IS NULL");

    console.log("Optimization completed successfully!");
  } catch (error) {
    console.error("Optimization failed:", error);
  } finally {
    connection.release();
    process.exit();
  }
}

optimizeSpeed();
