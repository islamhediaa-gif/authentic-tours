
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectData() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT || 3306
    });
    
    try {
        console.log('--- Inspecting Database Content ---');
        
        const [txCount] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
        console.log('Total Transactions:', txCount[0].count);
        
        const [jeCount] = await connection.execute('SELECT COUNT(*) as count FROM journal_entries');
        console.log('Total Journal Entries:', jeCount[0].count);
        
        console.log('\n--- Sample Journal Entry Dates ---');
        const [entries] = await connection.execute('SELECT id, date FROM journal_entries LIMIT 5');
        entries.forEach(e => console.log(`ID: ${e.id}, Date: "${e.date}" (Length: ${e.date ? e.date.length : 0})`));

        console.log('\n--- Revenue Account Check ---');
        const [revenueLines] = await connection.execute('SELECT COUNT(*) as count FROM journal_lines WHERE accountType = "REVENUE"');
        console.log('Lines marked as REVENUE:', revenueLines[0].count);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

inspectData();
