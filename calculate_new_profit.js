
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function calculateCurrentYearProfit() {
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
        const currentYearStart = '2026-01-01';
        const currentYearEnd = '2026-12-31';

        console.log(`Calculating profit for ${tenantId} in period: ${currentYearStart} to ${currentYearEnd}`);

        // Get Trial Balance lines for the period
        const [lines] = await connection.execute(`
            SELECT 
                account_id, 
                account_type, 
                SUM(debit) as periodDebit, 
                SUM(credit) as periodCredit 
            FROM journal_lines 
            JOIN journal_entries ON journal_lines.journal_entry_id = journal_entries.id
            WHERE journal_lines.tenant_id = ? 
            AND journal_entries.date >= ? 
            AND journal_entries.date <= ?
            GROUP BY account_id, account_type
        `, [tenantId, currentYearStart, currentYearEnd]);

        const ADMIN_CATEGORIES = [
            'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
            'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
            'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE'
        ];

        let flightRev = 0, hajjUmrahRev = 0, serviceRev = 0;
        let flightCost = 0, hajjUmrahCost = 0, serviceCost = 0;
        let adminExpenses = 0;

        lines.forEach(b => {
            const balance = Number(b.periodCredit || 0) - Number(b.periodDebit || 0); // Revenue
            const costBalance = Number(b.periodDebit || 0) - Number(b.periodCredit || 0); // Expense

            if (b.account_type === 'REVENUE') {
                if (b.account_id === 'FLIGHT_REVENUE') flightRev += balance;
                else if (b.account_id === 'HAJJ_UMRAH_REVENUE') hajjUmrahRev += balance;
                else serviceRev += balance;
            } else if (b.account_type === 'EXPENSE') {
                if (ADMIN_CATEGORIES.includes(b.account_id)) {
                    adminExpenses += costBalance;
                } else {
                    if (b.account_id === 'FLIGHT_COST') flightCost += costBalance;
                    else if (b.account_id === 'HAJJ_UMRAH_COST') hajjUmrahCost += costBalance;
                    else serviceCost += costBalance;
                }
            }
        });

        const totalRevenue = flightRev + hajjUmrahRev + serviceRev;
        const totalDirectCost = flightCost + hajjUmrahCost + serviceCost;
        const netProfit = totalRevenue - totalDirectCost - adminExpenses;

        console.log("\n--- New Period Results (2026) ---");
        console.log(`Total Sales: ${totalRevenue.toLocaleString()} EGP`);
        console.log(`Operations Cost: ${totalDirectCost.toLocaleString()} EGP`);
        console.log(`General Expenses: ${adminExpenses.toLocaleString()} EGP`);
        console.log(`-----------------------------------`);
        console.log(`NET PROFIT: ${netProfit.toLocaleString()} EGP`);

    } catch (err) {
        console.error("Calculation failed:", err);
    } finally {
        await connection.end();
    }
}

calculateCurrentYearProfit();
