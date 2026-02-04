
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
    const allowedOrigins = [
      'https://www.nebras-erp.com',
      'https://authentic-tours.vercel.app',
      'https://authentic-two-kappa.vercel.app',
      'http://localhost:5173'
    ];
    
    // السماح بالطلبات التي ليس لها origin (مثل تطبيقات الموبايل أو curl) 
    // أو الطلبات التي تأتي من الروابط المسموحة أو أي رابط vercel فرعي
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Database connection pool configuration
const dbConfig = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || {
  host: process.env.MYSQLHOST || 'interchange.proxy.rlwy.net',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || 'OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
  port: process.env.MYSQLPORT || 36607,
};

const columnCache = {};
const getTableColumns = async (table) => {
  if (columnCache[table]) return columnCache[table];
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM ??`, [table]);
    const names = cols.map(c => c.Field);
    columnCache[table] = names;
    return names;
  } catch (err) {
    console.warn(`Could not fetch columns for ${table}:`, err.message);
    return null;
  }
};

console.log(`Connecting to database at ${typeof dbConfig === 'string' ? 'MYSQL_URL' : dbConfig.host + ':' + dbConfig.port}`);

const pool = (typeof dbConfig === 'string') 
  ? mysql.createPool({ uri: dbConfig, connectTimeout: 30000 })
  : mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000
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

// Super Restore Endpoint - ارفع كل حاجة مرة واحدة
app.post('/api/admin/super-restore', async (req, res) => {
  try {
    const { data, tenant_id } = req.body;
    if (!data || !tenant_id) throw new Error('Missing data or tenant_id');

    console.log(`🚀 [Super Restore] Starting full wipe and restore for tenant: ${tenant_id}`);
    
    // 1. Nuclear Wipe first
    const tablesToWipe = [
      'transactions', 'journal_lines', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'audit_logs', 'tenant_settings', 'master_trips', 'users', 'programs'
    ];

    for (const table of tablesToWipe) {
      try {
        const sql = mysqlLib.format(`DELETE FROM ?? WHERE tenant_id = ?`, [table, tenant_id]);
        await pool.query(sql);
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

    for (const [key, tableName] of Object.entries(tablesMap)) {
      let records = data[key];
      if (!records) continue;
      if (!Array.isArray(records)) records = [records];
      if (records.length === 0) continue;

      console.log(`📦 [Super Restore] Processing ${records.length} records for ${tableName}...`);

      // Special handling for journal lines if key is journalEntries
      if (key === 'journalEntries') {
          const allLines = [];
          records.forEach((entry, eIdx) => {
              if (entry.lines && Array.isArray(entry.lines)) {
                  entry.lines.forEach((line, lIdx) => {
                      const l = toSnake(line);
                      l.tenant_id = tenant_id;
                      l.journal_entry_id = entry.id; // Preserve Entry ID
                      
                      // Also preserve Trip/Program from parent entry if not on line
                      if (!l.trip_id && entry.tripId) l.trip_id = entry.tripId;
                      if (!l.program_id && entry.programId) l.program_id = entry.programId;
                      
                      if (!l.id) l.id = `L_${entry.id}_${lIdx}`;
                      allLines.push(l);
                  });
              }
          });
          if (allLines.length > 0) {
              await bulkUpsert('journal_lines', allLines, tenant_id);
              results['journal_lines'] = allLines.length;
          }
      }

      // Special handling for transactions to extract journal lines if they exist there too
      if (key === 'transactions') {
          const allLines = [];
          records.forEach((tx, tIdx) => {
              if (tx.journalLines && Array.isArray(tx.journalLines)) {
                  tx.journalLines.forEach((line, lIdx) => {
                      const l = toSnake(line);
                      l.tenant_id = tenant_id;
                      l.transaction_id = tx.id; // Link to Transaction
                      
                      // Inherit trip/program from tx
                      if (!l.trip_id && tx.tripId) l.trip_id = tx.tripId;
                      if (!l.program_id && tx.programId) l.program_id = tx.programId;
                      
                      if (!l.id) l.id = `TX_L_${tx.id}_${lIdx}`;
                      allLines.push(l);
                  });
              }
          });
          if (allLines.length > 0) {
              await bulkUpsert('journal_lines', allLines, tenant_id);
              results['journal_lines_from_tx'] = allLines.length;
          }
      }

      // Prepare records for the table
      const processed = records.map(r => {
          const s = toSnake(r);
          s.tenant_id = tenant_id;
          if (tableName === 'journal_entries') delete s.lines;
          
          // Specific fix for tenant_settings
          if (tableName === 'tenant_settings') {
              if (!s.company_name && r.name) s.company_name = r.name;
              if (r.logo && !s.logo_url) s.logo_url = r.logo;
          }
          
          return s;
      });

      await bulkUpsert(tableName, processed, tenant_id);
      results[tableName] = processed.length;
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error(`❌ [Super Restore] Failed:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Internal helper for super-restore
async function bulkUpsert(table, records, tenant_id) {
    if (records.length === 0) return;
    
    const validColumns = await getTableColumns(table);
    const sanitized = records.map(r => {
        if (!validColumns) return r;
        const filtered = {};
        for (const col of validColumns) {
            if (r[col] !== undefined) filtered[col] = r[col];
        }
        return filtered;
    });

    // Chunk even super-restore a bit to avoid max_allowed_packet, but with large chunks
    const CHUNK_SIZE = 1000;
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

        const updates = keys.map(k => mysqlLib.format('?? = VALUES(??)', [k, k])).join(', ');
        const sql = mysqlLib.format(
            `INSERT INTO ?? (${keys.map(() => '??').join(', ')}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${updates}`,
            [table, ...keys]
        );
        await pool.query(sql, values);
    }
}

// Helper for snake_case conversion (simplified)
const toSnake = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  const snake = {};
  for (const key in obj) {
    let snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Explicit mapping for common relational IDs
    if (key === 'tripId') snakeKey = 'trip_id';
    if (key === 'programId') snakeKey = 'program_id';
    if (key === 'journalEntryId') snakeKey = 'journal_entry_id';
    if (key === 'costCenterId') snakeKey = 'cost_center_id';
    if (key === 'tenantId') snakeKey = 'tenant_id';

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Railway Backend running on port ${PORT}`));
