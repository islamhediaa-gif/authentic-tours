const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const run = async () => {
  const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'nebras_erp',
    port: process.env.MYSQLPORT || 3306,
  });

  try {
    console.log("Checking master_trips columns...");
    const [mtCols] = await pool.query("SHOW COLUMNS FROM master_trips");
    const mtColNames = mtCols.map(c => c.Field);
    
    if (!mtColNames.includes('components')) {
      console.log("Adding 'components' to master_trips...");
      await pool.query("ALTER TABLE master_trips ADD COLUMN components LONGTEXT");
    }
    if (!mtColNames.includes('accommodation')) {
      console.log("Adding 'accommodation' to master_trips...");
      await pool.query("ALTER TABLE master_trips ADD COLUMN accommodation LONGTEXT");
    }

    console.log("Checking programs columns...");
    const [pCols] = await pool.query("SHOW COLUMNS FROM programs");
    const pColNames = pCols.map(c => c.Field);
    
    if (!pColNames.includes('components')) {
      console.log("Adding 'components' to programs...");
      await pool.query("ALTER TABLE programs ADD COLUMN components LONGTEXT");
    }

    console.log("Schema fix completed successfully");
  } catch (err) {
    console.error("Schema fix failed:", err.message);
  } finally {
    await pool.end();
  }
};

run();
