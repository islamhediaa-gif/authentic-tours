const mysql = require('mysql2/promise');
require('dotenv').config();

async function auditCloud() {
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        user: 'root',
        password: process.env.MYSQLPASSWORD || 'JmRbeEIrwIsVAbfBqZJstKzCIBGshSiv',
        database: 'railway',
        port: 36622,
        connectTimeout: 30000
    });

    try {
        const tenantId = 'authentic';
        
        // 1. حساب المبيعات وتكلفة العمليات من معاملات INCOME
        const [incomeRows] = await connection.execute(
            'SELECT SUM(selling_price_in_base) as totalSales, SUM(purchase_price_in_base) as totalCosts FROM transactions WHERE tenant_id = ? AND UPPER(type) = "INCOME"',
            [tenantId]
        );

        // 2. حساب المصروفات العامة من معاملات EXPENSE
        const [expenseRows] = await connection.execute(
            'SELECT SUM(amount_in_base) as totalExpenses FROM transactions WHERE tenant_id = ? AND UPPER(type) = "EXPENSE"',
            [tenantId]
        );

        const sales = Number(incomeRows[0].totalSales) || 0;
        const costs = Number(incomeRows[0].totalCosts) || 0;
        const expenses = Number(expenseRows[0].totalExpenses) || 0;
        const profit = sales - costs - expenses;

        console.log(`\n--- CLOUD DATABASE AUDIT (Railway) ---`);
        console.log(`Total Sales (Revenue): ${sales.toLocaleString()} EGP`);
        console.log(`Operational Costs: ${costs.toLocaleString()} EGP`);
        console.log(`General Expenses: ${expenses.toLocaleString()} EGP`);
        console.log(`---------------------------------------`);
        console.log(`NET PROFIT: ${profit.toLocaleString()} EGP`);
        console.log(`---------------------------------------\n`);

        if (Math.abs(profit - 1024607) < 100) {
            console.log("SUCCESS: Cloud data matches the dashboard! The 1M profit is mathematically correct based on the records in the database.");
        } else {
            console.log("NOTICE: Cloud data sums up differently than the dashboard displayed.");
        }

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        await connection.end();
    }
}

auditCloud();
