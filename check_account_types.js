
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
async function check() {
    const c = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    });
    const [rows] = await c.query('SELECT account_type, COUNT(*) as count FROM journal_lines GROUP BY account_type');
    console.log('Account Types:', rows);
    
    const [capital] = await c.query("SELECT * FROM journal_lines WHERE account_type = 'PARTNER'");
    console.log('Partner Rows:', capital);
    
    await c.end();
}
check().catch(console.error);
