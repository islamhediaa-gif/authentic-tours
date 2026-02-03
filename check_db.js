const mysql = require('mysql2/promise');
async function check() {
    try {
        const db = await mysql.createConnection({
            host: 'yamanote.proxy.rlwy.net',
            user: 'root',
            password: 'cyGeNwQWgwXcoAHKbyNazocITJaixMVx',
            database: 'railway',
            port: 43764
        });
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM transactions WHERE tenant_id = "authentic"');
        console.log('Current DB Count:', rows[0].count);
        
        const [types] = await db.execute('SELECT type, COUNT(*) as count FROM transactions WHERE tenant_id = "authentic" GROUP BY type');
        console.log('Transaction Types:', types);
        
        await db.end();
    } catch (e) {
        console.error(e);
    }
}
check();