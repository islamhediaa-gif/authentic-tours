const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const sql = `
CREATE OR REPLACE VIEW view_equity_summary AS
WITH tx_info AS (
    SELECT 
        journal_entry_id,
        MAX(CASE WHEN is_purchase_only = 1 THEN 1 ELSE 0 END) as is_purchase_only,
        MAX(CASE WHEN is_sale_only = 1 THEN 1 ELSE 0 END) as is_sale_only,
        MAX(program_id) as program_id,
        MAX(category) as category
    FROM transactions
    GROUP BY journal_entry_id
),
program_bulk AS (
    SELECT DISTINCT program_id
    FROM transactions
    WHERE is_purchase_only = 1 AND program_id IS NOT NULL AND program_id != ''
),
category_bulk AS (
    SELECT DISTINCT category
    FROM transactions
    WHERE is_purchase_only = 1 AND category IS NOT NULL AND category != ''
),
category_hints AS (
    SELECT 
        journal_entry_id,
        MAX(CASE WHEN account_id = 'FLIGHT_COST' THEN CAST('FLIGHT' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci 
                 WHEN account_id = 'HAJJ_UMRAH_COST' THEN CAST('HAJJ_UMRAH' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci 
                 ELSE CAST('' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci END) as hint
    FROM journal_lines
    GROUP BY journal_entry_id
),
filtered_lines AS (
    SELECT 
        jl.tenant_id,
        jl.account_type,
        jl.credit,
        jl.debit
    FROM journal_lines jl
    LEFT JOIN tx_info t ON jl.journal_entry_id = t.journal_entry_id
    LEFT JOIN category_hints ch ON jl.journal_entry_id = ch.journal_entry_id
    LEFT JOIN program_bulk pb ON t.program_id = pb.program_id
    LEFT JOIN category_bulk cb ON ch.hint = cb.category
    WHERE 
        -- Live Repair Logic
        NOT (COALESCE(t.is_purchase_only, 0) = 1 AND COALESCE(t.is_sale_only, 0) = 0 AND jl.account_type IN ('REVENUE', 'CUSTOMER'))
        AND NOT (COALESCE(t.is_sale_only, 0) = 1 AND COALESCE(t.is_purchase_only, 0) = 0 AND jl.account_type IN ('EXPENSE', 'SUPPLIER'))
        AND NOT (pb.program_id IS NOT NULL AND COALESCE(t.is_purchase_only, 0) = 0 AND jl.account_type IN ('EXPENSE', 'SUPPLIER'))
        AND NOT (cb.category IS NOT NULL AND COALESCE(t.is_purchase_only, 0) = 0 AND jl.account_type IN ('EXPENSE', 'SUPPLIER'))
)
SELECT 
    tenant_id,
    -- Capital = Implied Capital from opening balances
    (
        COALESCE((SELECT SUM(opening_balance * COALESCE(exchange_rate, 1)) FROM treasuries), 0) +
        COALESCE((SELECT SUM(opening_balance_in_base) FROM customers), 0) -
        COALESCE((SELECT SUM(opening_balance_in_base) FROM suppliers), 0) -
        COALESCE((SELECT SUM(opening_balance) FROM partners), 0)
    ) as total_capital,
    -- Net Profit from filtered journal lines
    SUM(CASE 
        WHEN account_type = 'REVENUE' THEN (credit - debit)
        WHEN account_type = 'EXPENSE' THEN (credit - debit)
        ELSE 0 END) as net_profit,
    -- Partners Balance (Opening + Transactions)
    COALESCE((SELECT SUM(opening_balance) FROM partners), 0) +
    SUM(CASE WHEN account_type = 'PARTNER' THEN (credit - debit) ELSE 0 END) as partners_balance,
    -- Total Equity = Capital + Profit + Partners
    (
        COALESCE((SELECT SUM(opening_balance * COALESCE(exchange_rate, 1)) FROM treasuries), 0) +
        COALESCE((SELECT SUM(opening_balance_in_base) FROM customers), 0) -
        COALESCE((SELECT SUM(opening_balance_in_base) FROM suppliers), 0) -
        COALESCE((SELECT SUM(opening_balance) FROM partners), 0)
    ) +
    SUM(CASE 
        WHEN account_type = 'REVENUE' THEN (credit - debit)
        WHEN account_type = 'EXPENSE' THEN (credit - debit)
        ELSE 0 END) +
    (
        COALESCE((SELECT SUM(opening_balance) FROM partners), 0) +
        SUM(CASE WHEN account_type = 'PARTNER' THEN (credit - debit) ELSE 0 END)
    ) as total_equity
FROM filtered_lines
GROUP BY tenant_id;
`;

async function update() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    });
    console.log("Updating view_equity_summary...");
    await conn.query(sql);
    console.log("✅ View updated successfully!");
    await conn.end();
}

update().catch(console.error);
