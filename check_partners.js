const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQLPASSWORD,
            database: process.env.MYSQLDATABASE,
            port: process.env.MYSQLPORT
        });
        const [rows] = await conn.query("SHOW FULL COLUMNS FROM journal_lines WHERE Field = 'account_type'");
        console.log(rows);
        await conn.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
