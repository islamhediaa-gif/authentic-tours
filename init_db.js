const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env.local')));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('Loaded from .env.local');
} else {
  dotenv.config();
}

async function init() {
  const dbConfig = {
    host: process.env.MYSQLHOST || 'interchange.proxy.rlwy.net',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 36607,
    multipleStatements: true
  };

  console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}...`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL');

    const schemaPath = path.join(__dirname, 'railway_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing railway_schema.sql...');
    await connection.query(schemaSql);
    console.log('Schema executed successfully.');

    // Ensure default admin user
    console.log('Ensuring default admin user...');
    const [rows] = await connection.query("SELECT * FROM users WHERE tenant_id = 'authentic' AND username = 'admin'");
    if (rows.length === 0) {
      await connection.query(`
        INSERT INTO users (id, tenant_id, username, password, name, role, permissions)
        VALUES ('admin', 'authentic', 'admin', 'admin', 'المدير العام', 'ADMIN', '["ADMIN_ONLY"]')
      `);
      console.log("Inserted default admin user for authentic tenant.");
    } else {
      console.log("Admin user already exists.");
    }
    
    console.log('Database initialized successfully!');
    await connection.end();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

init();
