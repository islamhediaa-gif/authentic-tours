
const express = require('express');
const mysql = require('mysql2/promise');
const mysqlLib = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['https://www.nebras-erp.com', 'https://authentic-tours.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'nebras_erp',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// إنشاء الجداول وتحديث الهيكل إذا لم تكن موجودة
const initDB = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_backups (
        user_id VARCHAR(255) PRIMARY KEY,
        data LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // تأمين وجود الأعمدة الجديدة في الجداول الرئيسية
    try {
      const [mtCols] = await pool.query("SHOW COLUMNS FROM master_trips");
      const mtColNames = mtCols.map(c => c.Field);
      if (!mtColNames.includes('components')) {
        await pool.query("ALTER TABLE master_trips ADD COLUMN components LONGTEXT");
        console.log("Added 'components' column to master_trips");
      }
      if (!mtColNames.includes('accommodation')) {
        await pool.query("ALTER TABLE master_trips ADD COLUMN accommodation LONGTEXT");
        console.log("Added 'accommodation' column to master_trips");
      }
    } catch (e) { console.warn("Master trips table might not exist yet during init"); }

    try {
      const [pCols] = await pool.query("SHOW COLUMNS FROM programs");
      const pColNames = pCols.map(c => c.Field);
      if (!pColNames.includes('components')) {
        await pool.query("ALTER TABLE programs ADD COLUMN components LONGTEXT");
        console.log("Added 'components' column to programs");
      }
    } catch (e) { console.warn("Programs table might not exist yet during init"); }

    console.log("Database initialized and schema verified");
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
};
initDB();

// Admin Schema Fix Endpoint
app.get('/api/admin/fix-schema', async (req, res) => {
  try {
    await initDB();
    res.json({ success: true, message: "Schema verified and fixed if needed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper for snake_case conversion (simplified)
const toSnake = (obj) => {
  const snake = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    let value = obj[key];
    
    // Convert ISO date strings to MySQL format
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          value = d.toISOString().slice(0, 19).replace('T', ' ');
        }
      } catch (e) {}
    }
    
    snake[snakeKey] = value;
  }
  return snake;
};

// Generic Fetch Endpoint
app.get('/api/data/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { tenant_id } = req.query;
    const sql = mysqlLib.format(`SELECT * FROM ?? WHERE tenant_id = ?`, [table, tenant_id]);
    const [rows] = await pool.query(sql);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wipe Endpoint
app.delete('/api/wipe/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tables = [
      'transactions', 'journal_lines', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'audit_logs', 'tenant_settings', 'master_trips', 'users'
    ];

    for (const table of tables) {
      try {
        console.log(`Attempting to wipe table: ${table}`);
        const sql = mysqlLib.format(`DELETE FROM ?? WHERE tenant_id = ?`, [table, tenantId]);
        await pool.query(sql);
        console.log(`Successfully wiped table: ${table}`);
      } catch (e) {
        console.warn(`Wipe failed for table ${table} (might not exist):`, e.message);
      }
    }

    // Also wipe backup
    try {
      const backupSql = mysqlLib.format(`DELETE FROM user_backups WHERE user_id = ?`, [tenantId]);
      await pool.query(backupSql);
    } catch (e) {
      console.warn(`Wipe failed for user_backups:`, e.message);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic Upsert Endpoint
app.post('/api/upsert/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { records, tenant_id } = req.body;
    
    if (!records || !Array.isArray(records)) throw new Error('Invalid records');
    if (records.length === 0) return res.json({ success: true });

    // Pre-process all records: snake_case and stringify objects
    const processedRecords = records.map(record => {
      const copy = { ...record };
      // Remove lines if it's a journal entry (we sync them separately now)
      if (table === 'journal_entries') {
        delete copy.lines;
        delete copy.journalLines;
      }
      
      const snake = toSnake(copy);
      snake.tenant_id = tenant_id;
      return snake;
    });

    // Get all unique keys across all records in the batch
    const allKeys = Array.from(new Set(processedRecords.flatMap(r => Object.keys(r))));
    
    // Build the bulk query
    const values = [];
    const placeholders = [];
    
    for (const record of processedRecords) {
      const rowPlaceholders = [];
      for (const key of allKeys) {
        let val = record[key] === undefined ? null : record[key];
        // Handle objects/arrays stringification
        if (val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        values.push(val);
        rowPlaceholders.push('?');
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const updates = allKeys.map(key => mysqlLib.format('?? = VALUES(??)', [key, key])).join(', ');
    
    const sql = mysqlLib.format(
      `INSERT INTO ?? (${allKeys.map(() => '??').join(', ')}) 
       VALUES ${placeholders.join(', ')} 
       ON DUPLICATE KEY UPDATE ${updates}`,
      [table, ...allKeys]
    );

    try {
      await pool.query(sql, values);
      console.log(`[${table}] Bulk synced ${records.length} records`);
    } catch (err) {
      console.error(`Bulk SQL Error for table ${table}:`, err.message);
      // Fallback to one-by-one if bulk fails (to identify the problematic row)
      console.log(`Falling back to one-by-one for ${table}...`);
      for (const record of processedRecords) {
          const keys = Object.keys(record);
          const vals = Object.values(record).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);
          const p = keys.map(() => '?').join(', ');
          const u = keys.map(k => mysqlLib.format('?? = VALUES(??)', [k, k])).join(', ');
          const s = mysqlLib.format(`INSERT INTO ?? (${keys.map(() => '??').join(', ')}) VALUES (${p}) ON DUPLICATE KEY UPDATE ${u}`, [table, ...keys]);
          await pool.query(s, vals);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup Endpoint
app.post('/api/backup/save', async (req, res) => {
  try {
    const { userId, data } = req.body;
    await pool.execute(
      `INSERT INTO user_backups (user_id, data) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data)]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/backup/load/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      `SELECT data FROM user_backups WHERE user_id = ?`,
      [userId]
    );
    if (rows.length === 0) return res.json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0].data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Railway Backend running on port ${PORT}`));
