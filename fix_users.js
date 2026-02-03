
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

async function fixUsers() {
  console.log("Checking and fixing 'users' table on Railway...");
  const connection = await pool.getConnection();

  try {
    // 1. Create users table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        role VARCHAR(50),
        permissions LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Users table ensured.");

    // 2. Add updated_at to users if it was missing
    const [cols] = await connection.query(`SHOW COLUMNS FROM users`);
    if (!cols.some(c => c.Field === 'updated_at')) {
      await connection.query("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      console.log("Added updated_at to users table.");
    }

    // 3. Insert default admin if table is empty for authentic
    const [rows] = await connection.query("SELECT * FROM users WHERE tenant_id = 'authentic' AND username = 'admin'");
    if (rows.length === 0) {
      await connection.query(`
        INSERT INTO users (id, tenant_id, username, password, name, role, permissions)
        VALUES ('admin', 'authentic', 'admin', 'admin', 'المدير العام', 'ADMIN', '["ADMIN_ONLY"]')
      `);
      console.log("Inserted default admin user for authentic tenant.");
    }

    console.log("Fix completed successfully!");
  } catch (error) {
    console.error("Fix failed:", error);
  } finally {
    connection.release();
    process.exit();
  }
}

fixUsers();
