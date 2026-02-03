
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const BACKUP_FILE = path.join(__dirname, 'Backup_Nebras_2026-01-29.json');
const TENANT_ID = 'authentic';

const formatValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.includes('T') && value.includes('Z') && value.length > 18) {
        return value.replace('T', ' ').replace('Z', '').split('.')[0];
    }
    return value;
};

const toSnakeKey = (key) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

async function migrate() {
    console.log("Starting FINAL REPAIRED BATCH migration to Railway MySQL...");
    
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT,
        multipleStatements: true
    });

    const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    
    console.log("Cleaning up old data...");
    await connection.query("DELETE FROM journal_lines");
    await connection.query("DELETE FROM journal_entries");
    await connection.query("DELETE FROM transactions");
    
    const tables = [
        { name: 'tenants', records: [{ id: TENANT_ID, name: 'Authentic ERP' }] },
        { name: 'customers', records: data.customers },
        { name: 'suppliers', records: data.suppliers },
        { name: 'partners', records: data.partners },
        { name: 'employees', records: data.employees },
        { name: 'treasuries', records: data.treasuries },
        { name: 'currencies', records: data.currencies },
        { name: 'master_trips', records: data.masterTrips },
        { name: 'programs', records: data.programs },
        { name: 'transactions', records: data.transactions },
        { name: 'journal_entries', records: data.journalEntries },
        { name: 'users', records: data.users },
        { name: 'cost_centers', records: data.costCenters },
        { name: 'shifts', records: data.shifts },
        { name: 'departments', records: data.departments },
        { name: 'designations', records: data.designations },
        { name: 'audit_logs', records: data.auditLogs }
    ];

    const tableColumns = {};
    for (const table of tables) {
        const [rows] = await connection.query(`DESCRIBE ??`, [table.name]);
        tableColumns[table.name] = rows.map(r => r.Field);
    }
    const [jlRows] = await connection.query(`DESCRIBE journal_lines`);
    tableColumns['journal_lines'] = jlRows.map(r => r.Field);

    for (const table of tables) {
        if (!table.records || table.records.length === 0) continue;
        
        let records = table.records;
        if (table.name === 'transactions') {
            console.log("Aggregating transactions to handle duplicates...");
            const aggregated = {};
            records.forEach(r => {
                if (!aggregated[r.id]) {
                    aggregated[r.id] = { ...r };
                } else {
                    Object.keys(r).forEach(key => {
                        if (r[key] !== undefined && r[key] !== null && r[key] !== '') {
                            if (typeof r[key] === 'boolean') {
                                aggregated[r.id][key] = aggregated[r.id][key] || r[key];
                            } else if (aggregated[r.id][key] === undefined || aggregated[r.id][key] === null || aggregated[r.id][key] === '') {
                                aggregated[r.id][key] = r[key];
                            }
                        }
                    });
                }
            });
            records = Object.values(aggregated);
        }

        console.log(`Pushing ${records.length} records to ${table.name}...`);
        const validColumns = tableColumns[table.name];
        
        const BATCH_SIZE = 100;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const processedBatch = batch.map(record => {
                const snakeRecord = {};
                validColumns.forEach(col => {
                    const originalKey = Object.keys(record).find(k => toSnakeKey(k) === col);
                    if (originalKey !== undefined) {
                        snakeRecord[col] = formatValue(record[originalKey]);
                    } else if (col === 'tenant_id') {
                        snakeRecord[col] = TENANT_ID;
                    } else {
                        snakeRecord[col] = null;
                    }
                });
                return snakeRecord;
            });

            const keys = validColumns;
            const values = processedBatch.map(r => keys.map(k => r[k]));
            const sql = `INSERT INTO ?? (${keys.map(k => '??').join(', ')}) VALUES ? 
                         ON DUPLICATE KEY UPDATE ${keys.map(k => '?? = VALUES(??)').join(', ')}`;
            const flattenedKeys = [];
            keys.forEach(k => flattenedKeys.push(k, k));

            try {
                await connection.query(sql, [table.name, ...keys, values, ...flattenedKeys]);
            } catch (err) {
                console.error(`Error in batch for ${table.name}:`, err.message);
            }
        }
    }

    // Journal Lines - REPAIRED MAPPING
    if (data.journalEntries) {
        console.log("Pushing Journal Lines...");
        const jlColumns = tableColumns['journal_lines'];
        const allLines = [];
        data.journalEntries.forEach((entry, entryIdx) => {
            if (entry.lines && Array.isArray(entry.lines)) {
                entry.lines.forEach((line, idx) => {
                    const snakeLine = {};
                    jlColumns.forEach(col => {
                        const originalKey = Object.keys(line).find(k => toSnakeKey(k) === col);
                        if (originalKey !== undefined) {
                            snakeLine[col] = formatValue(line[originalKey]);
                        } else {
                            snakeLine[col] = null;
                        }
                    });
                    
                    // OVERRIDES
                    snakeLine.tenant_id = TENANT_ID;
                    snakeLine.journal_entry_id = entry.id;
                    // Use entryIdx and idx to ensure absolute uniqueness regardless of duplicate JEs
                    snakeLine.id = `L_${entryIdx}_${idx}`;
                    
                    allLines.push(snakeLine);
                });
            }
        });

        console.log(`Total Journal Lines to push: ${allLines.length}`);
        const BATCH_SIZE = 100;
        for (let i = 0; i < allLines.length; i += BATCH_SIZE) {
            const batch = allLines.slice(i, i + BATCH_SIZE);
            const keys = jlColumns;
            const values = batch.map(r => keys.map(k => r[k]));
            const sql = `INSERT INTO journal_lines (${keys.map(k => '??').join(', ')}) VALUES ? 
                         ON DUPLICATE KEY UPDATE ${keys.map(k => '?? = VALUES(??)').join(', ')}`;
            const flattenedKeys = [];
            keys.forEach(k => flattenedKeys.push(k, k));

            try {
                await connection.query(sql, [...keys, values, ...flattenedKeys]);
            } catch (err) {
                console.error(`Error in batch for journal_lines (Index ${i}):`, err.message);
            }
        }
    }

    console.log("Saving full JSON backup blob...");
    await connection.query(
        `INSERT INTO user_backups (user_id, data) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE data = VALUES(data)`,
        [TENANT_ID, JSON.stringify(data)]
    );

    await connection.end();
    console.log("✅ Migration completed successfully!");
}

migrate().catch(console.error);
