
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT || 3306
    });

    try {
        console.log('Final attempt to fix dates...');
        
        // جلب عينة للتأكد من الشكل
        const [rows] = await conn.execute('SELECT id, date FROM journal_entries WHERE date LIKE "%GMT%" LIMIT 1');
        if (rows.length > 0) {
            console.log('Sample date to fix:', rows[0].date);
        }

        // تحويل الصيغة: "Thu Jan 01 2026 00:00:00 GMT+0200"
        // سنقوم بقص أول 15 حرف: "Thu Jan 01 2026"
        await conn.execute(`
            UPDATE journal_entries 
            SET date = STR_TO_DATE(LEFT(date, 15), '%a %b %d %Y')
            WHERE date LIKE '%GMT%'
        `);

        await conn.execute(`
            UPDATE transactions 
            SET date = STR_TO_DATE(LEFT(date, 15), '%a %b %d %Y')
            WHERE date LIKE '%GMT%'
        `);

        console.log('DONE!');
    } catch (e) {
        console.error(e);
    } finally {
        await conn.end();
    }
}
fix();
