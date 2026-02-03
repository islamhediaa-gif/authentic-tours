
const mysql = require('mysql2/promise');
async function check() {
    const conn = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        user: 'root',
        password: 'cyGeNwQWgwXcoAHKbyNazocITJaixMVx',
        database: 'railway',
        port: 43764
    });
    const tables = ['customers', 'transactions', 'journal_entries', 'journal_lines'];
    for (const table of tables) {
        try {
            const [rows] = await conn.execute(`DESCRIBE ${table}`);
            console.log(`Table ${table}:`, rows.map(r => r.Field));
        } catch (e) {
            console.log(`Table ${table} not found`);
        }
    }
    await conn.end();
}
check();
