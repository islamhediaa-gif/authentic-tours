const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    });
    const [rows] = await conn.query('SELECT account_type, COUNT(*) as count FROM journal_lines GROUP BY account_type');
    console.log('Account Types:', rows);
    
    const [rawProfit] = await conn.query('SELECT SUM(CASE WHEN account_type = \'REVENUE\' THEN (credit - debit) WHEN account_type = \'EXPENSE\' THEN (credit - debit) ELSE 0 END) as raw_profit FROM journal_lines');
    console.log('Raw Profit (No Filters):', rawProfit);

    const [txStats] = await conn.query('SELECT COUNT(*) as total, SUM(is_purchase_only) as purchase_only, SUM(is_sale_only) as sale_only, COUNT(CASE WHEN is_purchase_only = 1 AND program_id IS NOT NULL AND program_id != "" THEN 1 END) as bulk_program FROM transactions');
    console.log('DB Transaction Stats:', txStats);

    const [bulkCats] = await conn.query('SELECT DISTINCT category FROM transactions WHERE is_purchase_only = 1');
    console.log('DB Bulk Categories:', bulkCats.map(r => r.category));

    const [jlCount] = await conn.query('SELECT COUNT(*) as count FROM journal_lines');
    console.log('DB JLs:', jlCount);

    const [profitRow] = await conn.query('SELECT * FROM view_equity_summary');
    console.log('SQL View Summary:', profitRow);
    await conn.end();
}
run().catch(console.error);
