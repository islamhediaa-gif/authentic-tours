
const mysql = require('mysql2/promise');
require('dotenv').config();

async function extremeFix() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT || 3306
    });
    
    try {
        console.log('--- STARTING EXTREME DATE REPAIR ---');
        
        // جلب كل القيود التي تواريخها طويلة
        const [entries] = await connection.execute('SELECT id, date FROM journal_entries WHERE LENGTH(date) > 20');
        console.log(`Found ${entries.length} entries with long dates. Fixing...`);

        for (const entry of entries) {
            try {
                const dateObj = new Date(entry.date);
                if (!isNaN(dateObj.getTime())) {
                    const formattedDate = dateObj.toISOString().split('T')[0];
                    await connection.execute('UPDATE journal_entries SET date = ? WHERE id = ?', [formattedDate, entry.id]);
                }
            } catch (e) {
                console.error(`Failed to fix entry ${entry.id}`);
            }
        }

        // نفس الشيء للمعاملات
        const [txs] = await connection.execute('SELECT id, date FROM transactions WHERE LENGTH(date) > 20');
        console.log(`Found ${txs.length} transactions with long dates. Fixing...`);

        for (const tx of txs) {
            try {
                const dateObj = new Date(tx.date);
                if (!isNaN(dateObj.getTime())) {
                    const formattedDate = dateObj.toISOString().split('T')[0];
                    await connection.execute('UPDATE transactions SET date = ? WHERE id = ?', [formattedDate, tx.id]);
                }
            } catch (e) {
                console.error(`Failed to fix transaction ${tx.id}`);
            }
        }

        console.log('--- FINISHED EXTREME REPAIR ---');

    } catch (err) {
        console.error('Critical Error:', err);
    } finally {
        await connection.end();
    }
}

extremeFix();
