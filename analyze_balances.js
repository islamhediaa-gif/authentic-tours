
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function analyzeBalances() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || 'yamanote.proxy.rlwy.net',
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || 'railway',
        port: 36622,
        connectTimeout: 30000
    });

    try {
        const tenantId = 'authentic';
        console.log(`Analyzing balances for tenant: ${tenantId}`);
        
        const [rows] = await connection.execute(
            'SELECT account_type, SUM(debit - credit) as balance FROM journal_lines WHERE tenant_id = ? GROUP BY account_type',
            [tenantId]
        );

        console.log("\nAccount Type Balances:");
        console.table(rows.map(r => ({
            Type: r.account_type,
            Balance: parseFloat(r.balance).toLocaleString()
        })));

        const [assets] = await connection.execute(
            'SELECT account_name, account_id, SUM(debit - credit) as balance FROM journal_lines WHERE tenant_id = ? AND account_type IN ("TREASURY", "BANK", "CUSTOMER") GROUP BY account_id, account_name HAVING balance != 0 ORDER BY balance DESC',
            [tenantId]
        );

        console.log("\nTop Liquid Assets & Receivables:");
        console.table(assets.map(a => ({
            Name: a.account_name || a.account_id,
            Balance: parseFloat(a.balance).toLocaleString()
        })));

    } catch (err) {
        console.error("Analysis failed:", err);
    } finally {
        await connection.end();
    }
}

analyzeBalances();
