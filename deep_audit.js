
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function deepAudit() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || 'yamanote.proxy.rlwy.net',
        user: 'root',
        password: process.env.MYSQLPASSWORD || 'cyGeNwQWgwXcoAHKbyNazocITJaixMVx',
        database: 'railway',
        port: 36622
    });

    try {
        const tenantId = 'authentic';
        console.log(`Starting deep audit for: ${tenantId}\n`);

        // 1. التحقق من العمليات التي ليس لها تكلفة (قد تكون هي السبب في تضخم الربح)
        const [zeroCostRows] = await connection.execute(
            `SELECT description, selling_price_in_base, date 
             FROM transactions 
             WHERE tenant_id = ? AND UPPER(type) = "INCOME" AND (purchase_price_in_base = 0 OR purchase_price_in_base IS NULL)
             ORDER BY selling_price_in_base DESC LIMIT 10`,
            [tenantId]
        );

        console.log("--- عمليات بيع بدون تكلفة مسجلة (أعلى 10) ---");
        console.table(zeroCostRows);

        // 2. التحقق من تكرار القيود المحاسبية (Double Counting)
        const [duplicateRows] = await connection.execute(
            `SELECT description, date, COUNT(*) as occurrences, SUM(debit) as total_debit
             FROM journal_lines 
             JOIN journal_entries ON journal_lines.journal_entry_id = journal_entries.id
             WHERE journal_lines.tenant_id = ? AND account_type = "REVENUE"
             GROUP BY description, date, debit, credit
             HAVING occurrences > 1
             LIMIT 10`,
            [tenantId]
        );

        console.log("\n--- قيود إيرادات مكررة محتملة ---");
        console.table(duplicateRows);

        // 3. حساب الربح باستبعاد العمليات المشكوك فيها (بدون تكلفة)
        const [stats] = await connection.execute(
            `SELECT 
                SUM(CASE WHEN (purchase_price_in_base > 0) THEN (selling_price_in_base - purchase_price_in_base) ELSE 0 END) as profitWithCost,
                SUM(CASE WHEN (purchase_price_in_base = 0 OR purchase_price_in_base IS NULL) THEN selling_price_in_base ELSE 0 END) as profitWithoutCost
             FROM transactions 
             WHERE tenant_id = ? AND UPPER(type) = "INCOME"`,
            [tenantId]
        );

        console.log("\n--- تحليل هيكل الربح ---");
        console.log(`أرباح من عمليات لها تكلفة: ${Number(stats[0].profitWithCost).toLocaleString()} EGP`);
        console.log(`مبيعات (ربح كامل) لعمليات بدون تكلفة: ${Number(stats[0].profitWithoutCost).toLocaleString()} EGP`);

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        await connection.end();
    }
}

deepAudit();
