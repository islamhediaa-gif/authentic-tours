
const mysql = require('mysql2/promise');

async function run() {
    const conn = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        user: 'root',
        password: 'cyGeNwQWgwXcoAHKbyNazocITJaixMVx',
        database: 'railway',
        port: 43764
    });

    const tables = [
        'customers', 'suppliers', 'transactions', 'journal_entries', 'journal_lines',
        'partners', 'employees', 'treasuries', 'currencies', 
        'cost_centers', 'departments', 'designations',
        'attendance_logs', 'shifts', 'employee_leaves', 
        'employee_allowances', 'employee_documents', 'audit_logs',
        'tenant_settings', 'master_trips'
    ];

    console.log("Adding 'updated_at' column to tables if missing...");

    for (const table of tables) {
        try {
            // Check if column exists
            const [columns] = await conn.query(`DESCRIBE ??`, [table]);
            if (!columns.some(c => c.Field === 'updated_at')) {
                console.log(`Adding 'updated_at' to ${table}...`);
                await conn.query(`ALTER TABLE ?? ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`, [table]);
                console.log(`✅ Added to ${table}`);
            } else {
                console.log(`ℹ️ ${table} already has 'updated_at'`);
            }
        } catch (e) {
            console.error(`❌ Error updating ${table}:`, e.message);
        }
    }

    await conn.end();
}

run();
