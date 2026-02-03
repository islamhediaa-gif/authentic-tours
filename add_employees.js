
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

async function addUsers() {
  console.log("Adding samar and nada to Railway users table...");
  const connection = await pool.getConnection();

  try {
    const users = [
      { id: 'samar_user', username: 'samar', password: 'samar', name: 'سمر', role: 'ADMIN' },
      { id: 'nada_user', username: 'nada', password: 'nada', name: 'ندى', role: 'ADMIN' }
    ];

    for (const u of users) {
      await connection.query(`
        INSERT INTO users (id, tenant_id, username, password, name, role, permissions)
        VALUES (?, 'authentic', ?, ?, ?, ?, '["ADMIN_ONLY"]')
        ON DUPLICATE KEY UPDATE username=VALUES(username), password=VALUES(password), role=VALUES(role)
      `, [u.id, u.username, u.password, u.name, u.role]);
      console.log(`User ${u.username} ensured.`);
    }

    console.log("Users added successfully!");
  } catch (error) {
    console.error("Error adding users:", error);
  } finally {
    connection.release();
    process.exit();
  }
}

addUsers();
