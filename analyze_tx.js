
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function analyzeTransactions() {
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
        console.log(`Analyzing transactions for tenant: ${tenantId}`);
        
        const [txs] = await connection.execute(
            'SELECT * FROM transactions WHERE tenant_id = ?',
            [tenantId]
        );

        console.log(`Total transactions: ${txs.length}`);

        // Sort by net impact (Sales - Cost)
        const txImpacts = txs
            .filter(t => t.type.toUpperCase() === 'INCOME')
            .map(t => {
                const sales = parseFloat(t.selling_price_in_base || 0);
                const cost = parseFloat(t.purchase_price_in_base || 0);
                const profit = sales - cost;
                return {
                    id: t.id,
                    description: t.description,
                    amount: sales,
                    cost: cost,
                    profit: profit,
                    date: t.date
                };
            }).sort((a, b) => b.profit - a.profit);

        console.log("\nTop 10 Profitable Transactions (INCOME type):");
        console.table(txImpacts.slice(0, 10));

        console.log("\nTop 10 Highest Sales Transactions:");
        console.table([...txImpacts].sort((a, b) => b.amount - a.amount).slice(0, 10));

        const totalIncomeProfit = txImpacts.reduce((sum, t) => sum + t.profit, 0);
        
        const [expenseRows] = await connection.execute(
            'SELECT SUM(amount_in_base) as totalExpenses FROM transactions WHERE tenant_id = ? AND UPPER(type) = "EXPENSE"',
            [tenantId]
        );
        const totalExpenses = parseFloat(expenseRows[0].totalExpenses || 0);

        console.log(`\nTotal Income Profit (Sales - Cost): ${totalIncomeProfit.toLocaleString()}`);
        console.log(`Total General Expenses: ${totalExpenses.toLocaleString()}`);
        console.log(`Net Profit: ${(totalIncomeProfit - totalExpenses).toLocaleString()}`);

        // Check for anomalies: Sales with 0 cost
        const zeroCost = txImpacts.filter(t => t.cost === 0 && t.amount > 0);
        if (zeroCost.length > 0) {
            console.log(`\nFound ${zeroCost.length} transactions with 0 cost but positive sales.`);
            console.log("These might be inflating the profit if they should have a cost.");
            console.table(zeroCost.slice(0, 10));
        }

    } catch (err) {
        console.error("Analysis failed:", err);
    } finally {
        await connection.end();
    }
}

analyzeTransactions();
