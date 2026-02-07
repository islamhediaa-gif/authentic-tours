
const express = require('express');
const mysql = require('mysql2/promise');
const mysqlLib = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env or .env.local
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  const envConfig = require('dotenv').parse(fs.readFileSync(path.join(__dirname, '.env.local')));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('Loaded environment from .env.local (Overriding system env)');
} else {
  require('dotenv').config();
}

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    // السماح بكل الروابط مؤقتاً أثناء التجهيز أو وضع روابط محددة
    // في الـ VPS يفضل وضع الدومين الخاص بك هنا
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve Frontend Static Files (When built)
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  console.log(`📂 Serving frontend from: ${distPath}`);
  app.use(express.static(distPath));
  // Redirect root to frontend
  app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Catch-all route for React Router (Single Page Application)
  // Express 5 requires named parameters for wildcards like :any*
  app.get('/:any*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
    // If no frontend built yet, show server status
    app.get('/', (req, res) => {
        res.send(`<h1>Authentic ERP Server is running!</h1><p>Frontend directory "dist" not found at: ${distPath}. Please ensure "npm run build" finished successfully.</p>`);
    });
}
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Global Logger to see every request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] 📥 ${req.method} ${req.url}`);
  next();
});

// Database connection pool configuration
const dbConfig = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'nebras_db',
  port: process.env.MYSQLPORT || 3306,
};

const pool = (typeof dbConfig === 'string') 
  ? mysql.createPool({ uri: dbConfig, connectTimeout: 30000 })
  : mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000
    });

// --- GLOBAL HELPERS (Defined before use) ---
const tableColumnsCache = {};

const getTableColumns = async (table) => {
  if (tableColumnsCache[table]) return tableColumnsCache[table];
  try {
    const [cols] = await pool.query(mysqlLib.format("SHOW COLUMNS FROM ??", [table]));
    const names = cols.map(c => c.Field);
    tableColumnsCache[table] = names;
    return names;
  } catch (e) {
    console.error(`Failed to get columns for ${table}:`, e.message);
    return null;
  }
};

const toSnake = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  const snake = {};
  for (const key in obj) {
    let snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (key === 'id') snakeKey = 'id';
    if (key === 'tripId') snakeKey = 'trip_id';
    if (key === 'programId') snakeKey = 'program_id';
    if (key === 'journalEntryId') snakeKey = 'journal_entry_id';
    if (key === 'transactionId') snakeKey = 'transaction_id';
    if (key === 'costCenterId') snakeKey = 'cost_center_id';
    if (key === 'tenantId') snakeKey = 'tenant_id';
    let value = obj[key];
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) value = d.toISOString().slice(0, 19).replace('T', ' ');
      } catch (e) {}
    }
    snake[snakeKey] = value;
  }
  return snake;
};

const bulkUpsert = async (table, records, tenant_id) => {
    if (records.length === 0) return;
    const validColumns = await getTableColumns(table);
    const sanitized = records.map(r => {
        const filtered = {};
        if (validColumns) {
            for (const col of validColumns) if (r[col] !== undefined) filtered[col] = r[col];
        } else Object.assign(filtered, r);
        return filtered;
    });
    const CHUNK_SIZE = 500;
    let totalAffected = 0;
    for (let i = 0; i < sanitized.length; i += CHUNK_SIZE) {
        const chunk = sanitized.slice(i, i + CHUNK_SIZE);
        const keys = Array.from(new Set(chunk.flatMap(r => Object.keys(r))));
        const values = [];
        const placeholders = chunk.map(record => {
            const row = keys.map(k => {
                let v = record[k] === undefined ? null : record[k];
                if (v !== null && typeof v === 'object') v = JSON.stringify(v);
                values.push(v);
                return '?';
            });
            return `(${row.join(', ')})`;
        }).join(', ');
        const updates = keys.filter(k => k !== 'id').map(k => mysqlLib.format('?? = VALUES(??)', [k, k])).join(', ');
        let sql = (updates.length > 0) 
            ? mysqlLib.format(`INSERT INTO ?? (${keys.map(() => '??').join(', ')}) VALUES `, [table, ...keys]) + placeholders + ` ON DUPLICATE KEY UPDATE ${updates}`
            : mysqlLib.format(`INSERT IGNORE INTO ?? (${keys.map(() => '??').join(', ')}) VALUES `, [table, ...keys]) + placeholders;
        try {
            const [res] = await pool.query(sql, values);
            totalAffected += res.affectedRows;
        } catch (e) { console.error(`❌ Bulk upsert failed for ${table}:`, e.message); }
    }
    return { affectedRows: totalAffected };
};

// Single Big Fetch Endpoint for high reliability
app.get('/api/data-all', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    console.log(`🚀 [Data All] High-speed fetch for tenant: ${tenant_id}`);
    if (!tenant_id) throw new Error('Missing tenant_id');

    const tables = [
      'transactions', 'journal_lines', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'audit_logs', 'tenant_settings', 'master_trips', 'users', 'programs'
    ];

    const allData = {};
    for (const table of tables) {
      const sql = mysqlLib.format(`SELECT * FROM ?? WHERE tenant_id = ?`, [table, tenant_id]);
      const [rows] = await pool.query(sql);
      allData[table] = rows;
    }

    console.log(`✅ [Data All] Sent all data for ${tenant_id}`);
    res.json({ success: true, data: allData });
  } catch (error) {
    console.error(`❌ [Data All] Failed:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// إنشاء الجداول وتحديث الهيكل إذا لم تكن موجودة
const initDB = async () => {
  try {
    // 1. إنشاء قاعدة البيانات إذا لم تكن موجودة باستخدام اتصال مؤقت
    const tempConn = await mysql.createConnection({
      host: process.env.MYSQLHOST || 'localhost',
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQLDATABASE || 'nebras_db'}\``);
    
    // رفع حد البيانات المسموح بنقلها لـ 100 ميجا لحل مشكلة اللوجو الكبير
    try {
        await tempConn.query("SET GLOBAL max_allowed_packet = 104857600");
        console.log("✅ MySQL max_allowed_packet increased to 100MB");
    } catch (e) {
        console.warn("⚠️ Could not set GLOBAL max_allowed_packet, trying session level...");
        await tempConn.query("SET SESSION max_allowed_packet = 104857600");
    }
    
    await tempConn.end();

    console.log(`✅ Database "${process.env.MYSQLDATABASE || 'nebras_db'}" ensured.`);

    // 2. قائمة الجداول الأساسية المطلوب إنشاؤها
    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS tenant_settings (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        company_name VARCHAR(255),
        logo_url TEXT,
        settings_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS currencies (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(100),
        code VARCHAR(10),
        symbol VARCHAR(10),
        exchange_rate DECIMAL(18, 4)
      )`,
      `CREATE TABLE IF NOT EXISTS treasuries (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        currency_id VARCHAR(255),
        balance DECIMAL(18, 4) DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        balance DECIMAL(18, 4) DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        balance DECIMAL(18, 4) DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS partners (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        balance DECIMAL(18, 4) DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        date DATETIME,
        type VARCHAR(50),
        amount DECIMAL(18, 4),
        currency_id VARCHAR(255),
        description TEXT,
        reference_id VARCHAR(255),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        date DATETIME,
        description TEXT,
        reference VARCHAR(255),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS journal_lines (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        journal_entry_id VARCHAR(255),
        transaction_id VARCHAR(255),
        trip_id VARCHAR(255),
        program_id VARCHAR(255),
        account_id VARCHAR(255),
        debit DECIMAL(18, 4) DEFAULT 0,
        credit DECIMAL(18, 4) DEFAULT 0,
        description TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        user_id VARCHAR(255),
        action VARCHAR(255),
        table_name VARCHAR(100),
        record_id VARCHAR(255),
        old_data LONGTEXT,
        new_data LONGTEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS master_trips (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        start_date DATETIME,
        end_date DATETIME,
        status VARCHAR(50),
        components LONGTEXT,
        accommodation LONGTEXT
      )`,
      `CREATE TABLE IF NOT EXISTS programs (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        components LONGTEXT
      )`,
      `CREATE TABLE IF NOT EXISTS cost_centers (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        code VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS designations (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS attendance_logs (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        employee_id VARCHAR(255),
        date DATE,
        check_in TIME,
        check_out TIME,
        status VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS shifts (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        name VARCHAR(255),
        start_time TIME,
        end_time TIME
      )`,
      `CREATE TABLE IF NOT EXISTS employee_leaves (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        employee_id VARCHAR(255),
        type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS employee_allowances (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        employee_id VARCHAR(255),
        type VARCHAR(50),
        amount DECIMAL(18, 4)
      )`,
      `CREATE TABLE IF NOT EXISTS employee_documents (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        employee_id VARCHAR(255),
        type VARCHAR(50),
        expiry_date DATE,
        file_url TEXT
      )`
    ];

    for (const query of tableQueries) {
      await pool.query(query);
    }

    console.log("🚀 All ERP tables verified/created successfully.");
  } catch (err) {
    console.error("❌ Database initialization failed!");
    console.error("Reason:", err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error("💡 TIP: Is MySQL running? Check XAMPP/WAMP control panel.");
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 TIP: Wrong username or password in .env file.");
    }
  }
};
initDB();

// Admin Schema Fix Endpoint
app.get('/api/admin/fix-schema', async (req, res) => {
  try {
    // Force add columns if missing
    const [cols] = await pool.query("SHOW COLUMNS FROM journal_lines");
    const names = cols.map(c => c.Field);
    if (!names.includes('transaction_id')) {
        await pool.query("ALTER TABLE journal_lines ADD COLUMN transaction_id VARCHAR(255)");
    }
    if (!names.includes('trip_id')) {
        await pool.query("ALTER TABLE journal_lines ADD COLUMN trip_id VARCHAR(255)");
    }
    
    await initDB();
    res.json({ success: true, message: "Schema verified and fixed manually" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Super Restore Endpoint - ارفع كل حاجة مرة واحدة
app.post('/api/admin/super-restore', async (req, res) => {
  try {
    const { data, tenant_id } = req.body;
    if (!data || !tenant_id) throw new Error('Missing data or tenant_id');

    // Clear column cache to ensure we see newly added columns
    for (const k in tableColumnsCache) delete tableColumnsCache[k];

    console.log(`🚀 [Super Restore] Starting full wipe and restore for tenant: ${tenant_id}`);
    
    // Auto-fix journal_lines schema before wipe/restore if columns missing
    try {
        const [jlCols] = await pool.query("SHOW COLUMNS FROM journal_lines");
        const jlColNames = jlCols.map(c => c.Field);

        const idCol = jlCols.find(c => c.Field === 'id');
        if (idCol && idCol.Type.toLowerCase().includes('int')) {
            await pool.query("ALTER TABLE journal_lines MODIFY COLUMN id VARCHAR(255)");
        }

        if (!jlColNames.includes('transaction_id')) {
            await pool.query("ALTER TABLE journal_lines ADD COLUMN transaction_id VARCHAR(255)");
            console.log("SuperRestore: Fixed missing transaction_id");
        }
        if (!jlColNames.includes('trip_id')) {
            await pool.query("ALTER TABLE journal_lines ADD COLUMN trip_id VARCHAR(255)");
            console.log("SuperRestore: Fixed missing trip_id");
        }
    } catch (e) { console.error("Schema check failed in SuperRestore:", e.message); }
    
    // 1. Nuclear Wipe first
    const tablesToWipe = [
      'journal_lines', 'transactions', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'audit_logs', 'tenant_settings', 'master_trips', 'users', 'programs'
    ];

    for (const table of tablesToWipe) {
      try {
        console.log(`[Super Restore] Wiping table: ${table}`);
        const sql = mysqlLib.format(`DELETE FROM ?? WHERE tenant_id = ?`, [table, tenant_id]);
        const [res] = await pool.query(sql);
        console.log(`[Super Restore] Wiped ${table}: ${res.affectedRows} rows deleted`);
      } catch (e) {
        console.warn(`Wipe failed for ${table}: ${e.message}`);
      }
    }
    
    const tablesMap = {
      'currencies': 'currencies',
      'treasuries': 'treasuries',
      'costCenters': 'cost_centers',
      'departments': 'departments',
      'designations': 'designations',
      'shifts': 'shifts',
      'employees': 'employees',
      'customers': 'customers',
      'suppliers': 'suppliers',
      'partners': 'partners',
      'users': 'users',
      'programs': 'programs',
      'masterTrips': 'master_trips',
      'journalEntries': 'journal_entries',
      'transactions': 'transactions',
      'auditLogs': 'audit_logs',
      'settings': 'tenant_settings'
    };

    const results = {};
    const allJournalLines = [];

    for (const [key, tableName] of Object.entries(tablesMap)) {
      let records = data[key];
      if (!records) continue;
      if (!Array.isArray(records)) records = [records];
      if (records.length === 0) continue;

      console.log(`📦 [Super Restore] Processing ${records.length} records for ${tableName}...`);

      // Special handling for journal lines if key is journalEntries
      if (key === 'journalEntries') {
          records.forEach((entry, eIdx) => {
              if (entry.lines && Array.isArray(entry.lines)) {
                  entry.lines.forEach((line, lIdx) => {
                      const l = toSnake(line);
                      l.tenant_id = tenant_id;
                      l.journal_entry_id = entry.id; 
                      
                      if (!l.trip_id && entry.tripId) l.trip_id = entry.tripId;
                      if (!l.program_id && entry.programId) l.program_id = entry.programId;
                      
                      // Using a more unique ID for journal lines to avoid collisions
                      l.id = `L_${entry.id}_${lIdx}_${Math.random().toString(36).substr(2, 5)}`;
                      allJournalLines.push(l);
                  });
              }
          });
      }

      // Special handling for transactions to extract journal lines
      if (key === 'transactions') {
          records.forEach((tx, tIdx) => {
              if (tx.journalLines && Array.isArray(tx.journalLines)) {
                  tx.journalLines.forEach((line, lIdx) => {
                      const l = toSnake(line);
                      l.tenant_id = tenant_id;
                      l.transaction_id = tx.id;
                      
                      if (!l.trip_id && tx.tripId) l.trip_id = tx.tripId;
                      if (!l.program_id && tx.programId) l.program_id = tx.programId;
                      
                      l.id = `TX_L_${tx.id}_${lIdx}_${Math.random().toString(36).substr(2, 5)}`;
                      allJournalLines.push(l);
                  });
              }
          });
      }

      // Prepare records for the table
      const processed = records.map(r => {
          const s = toSnake(r);
          s.tenant_id = tenant_id;
          if (tableName === 'journal_entries') delete s.lines;
          if (tableName === 'transactions') delete s.journalLines;
          
          if (tableName === 'tenant_settings') {
              if (!s.company_name && r.name) s.company_name = r.name;
              if (r.logo && !s.logo_url) s.logo_url = r.logo;
          }
          
          return s;
      });

      await bulkUpsert(tableName, processed, tenant_id);
      results[tableName] = processed.length;
    }

    // Final bulk upsert for ALL journal lines
    if (allJournalLines.length > 0) {
        const [checkCols] = await pool.query("SHOW COLUMNS FROM journal_lines");
        const idCol = checkCols.find(c => c.Field === 'id');
        results['journal_lines_id_type'] = idCol ? idCol.Type : 'unknown';
        
        console.log(`📝 [Super Restore] Upserting total ${allJournalLines.length} journal lines... ID Type: ${idCol?.Type}`);
        const bulkRes = await bulkUpsert('journal_lines', allJournalLines, tenant_id);
        results['journal_lines_total'] = allJournalLines.length;
        results['journal_lines_affected'] = bulkRes?.affectedRows || 0;
    }

    console.log(`✅ [Super Restore] Completed successfully for ${tenant_id}. Results:`, results);
    res.json({ success: true, results });
  } catch (error) {
    console.error(`❌ [Super Restore] Failed:`, error.message, error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic Fetch Endpoint
app.get('/api/admin/describe/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const [cols] = await pool.query(mysqlLib.format("DESCRIBE ??", [table]));
    res.json({ success: true, data: cols });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    const validColumns = await getTableColumns(table);
    
    const processedRecords = records.map(record => {
      const copy = { ...record };
      
      // Fix for tenant_settings missing company_name or mapping logo
      if (table === 'tenant_settings') {
        if (!copy.company_name && copy.companyName) {
          copy.company_name = copy.companyName;
        }
        if (!copy.company_name) {
          copy.company_name = 'Authentic Tours';
        }
        if (copy.logo && !copy.logo_url) {
          copy.logo_url = copy.logo;
        }
      }

      // Remove lines if it's a journal entry (we sync them separately now)
      if (table === 'journal_entries') {
        delete copy.lines;
        delete copy.journalLines;
      }
      
      const snake = toSnake(copy);
      snake.tenant_id = tenant_id;

      // Filter to only include valid columns if we have them
      if (validColumns) {
        const filtered = {};
        for (const col of validColumns) {
          if (snake[col] !== undefined) {
            filtered[col] = snake[col];
          }
        }
        return filtered;
      }
      
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
      `INSERT INTO ?? (${allKeys.map(() => '??').join(', ')}) VALUES `,
      [table, ...allKeys]
    ) + placeholders.join(', ') + ` ON DUPLICATE KEY UPDATE ${updates}`;

    try {
      await pool.query(sql, values);
      console.log(`[${table}] Bulk synced ${records.length} records`);
    } catch (err) {
      console.error(`Bulk SQL Error for table ${table}:`, err.message);
      console.error(`First record sample:`, JSON.stringify(processedRecords[0]));
      // Fallback to one-by-one if bulk fails (to identify the problematic row)
      console.log(`Falling back to one-by-one for ${table}...`);
      for (const [idx, record] of processedRecords.entries()) {
          try {
            const keys = Object.keys(record);
            const vals = Object.values(record).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);
            const p = keys.map(() => '?').join(', ');
            const u = keys.map(k => mysqlLib.format('?? = VALUES(??)', [k, k])).join(', ');
            const s = mysqlLib.format(`INSERT INTO ?? (${keys.map(() => '??').join(', ')}) VALUES (${p}) ON DUPLICATE KEY UPDATE ${u}`, [table, ...keys]);
            await pool.query(s, vals);
          } catch (rowErr) {
            console.error(`Row ${idx} failed for ${table}:`, rowErr.message);
            console.error(`Record data:`, JSON.stringify(record));
            throw rowErr; // Re-throw to fail the request
          }
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

// Dashboard Summary Endpoint
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    
    // 1. Get Opening Balances Sums
    const [tOpen] = await pool.query('SELECT SUM(opening_balance * exchange_rate) as open_cash FROM treasuries WHERE tenant_id = ?', [tenant_id]);
    const [cOpen] = await pool.query('SELECT SUM(opening_balance_in_base) as open_cust FROM customers WHERE tenant_id = ?', [tenant_id]);
    const [sOpen] = await pool.query('SELECT SUM(opening_balance_in_base) as open_supp FROM suppliers WHERE tenant_id = ?', [tenant_id]);

    // 2. Get Transaction Sums from Journal Lines
    const [journalStats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN account_type IN ('TREASURY', 'BANK') THEN (debit - credit) ELSE 0 END) as net_cash,
        SUM(CASE WHEN account_type = 'CUSTOMER' THEN (debit - credit) ELSE 0 END) as net_customers,
        SUM(CASE WHEN account_type = 'SUPPLIER' THEN (credit - debit) ELSE 0 END) as net_suppliers,
        SUM(CASE WHEN account_type = 'REVENUE' THEN (credit - debit) WHEN account_type = 'INCOME' THEN (credit - debit) ELSE 0 END) as net_revenue
      FROM journal_lines 
      WHERE tenant_id = ?`, [tenant_id]);
      
    // Fix: check if journalStats[0] exists
    const stats = journalStats && journalStats[0] ? journalStats[0] : {};
    
    res.json({ 
      success: true, 
      data: {
        total_cash: (Number(tOpen[0]?.open_cash) || 0) + (Number(stats.net_cash) || 0),
        customer_debts: (Number(cOpen[0]?.open_cust) || 0) + (Number(stats.net_customers) || 0),
        supplier_credits: (Number(sOpen[0]?.open_supp) || 0) + (Number(stats.net_suppliers) || 0),
        total_revenue: Number(stats.net_revenue) || 0
      } 
    });
  } catch (error) {
    console.error('[Summary Error]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Authentic ERP Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`-----------------------------------------`);
});
