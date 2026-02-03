
const mysql = require('mysql2/promise');
async function run() {
    try {
        const c = await mysql.createConnection({
            host: 'yamanote.proxy.rlwy.net',
            user: 'root',
            password: 'cyGeNwQWgwXcoAHKbyNazocITJaixMVx',
            database: 'railway',
            port: 43764
        });
        const [ts] = await c.execute('SHOW TABLES');
        for(let t of ts) {
            const tableName = Object.values(t)[0];
            console.log('Table: ' + tableName);
            const [cols] = await c.execute('DESCRIBE ' + tableName);
            console.log(cols.map(c => c.Field));
        }
        await c.end();
    } catch (e) {
        console.error(e);
    }
}
run();
