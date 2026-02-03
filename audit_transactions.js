const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const txs = data.transactions || [];

console.log('--- Transactions with zero amountInBase but non-zero purchasePrice ---');
const zeroAmount = txs.filter(t => (t.amountInBase === 0 || t.amount === 0) && (t.purchasePriceInBase > 0 || t.purchasePrice > 0));
zeroAmount.forEach(t => {
    console.log(`ID: ${t.id}, Type: ${t.type}, Cat: ${t.category}, Ref: ${t.refNo}, Amount: ${t.amount}, Cost: ${t.purchasePriceInBase || t.purchasePrice}, Desc: ${t.description}`);
});

console.log('\n--- Top 10 Most Expensive Transactions (by purchasePrice) ---');
const expensive = [...txs].sort((a, b) => (b.purchasePriceInBase || b.purchasePrice || 0) - (a.purchasePriceInBase || a.purchasePrice || 0)).slice(0, 10);
expensive.forEach(t => {
    console.log(`ID: ${t.id}, Type: ${t.type}, Cat: ${t.category}, Ref: ${t.refNo}, Amount: ${t.amountInBase || t.amount}, Cost: ${t.purchasePriceInBase || t.purchasePrice}, Desc: ${t.description}`);
});

console.log('\n--- Category Totals ---');
const totals = {};
txs.forEach(t => {
    if (!totals[t.category]) totals[t.category] = { revenue: 0, cost: 0 };
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        totals[t.category].revenue += (t.amountInBase || 0);
        totals[t.category].cost += (t.purchasePriceInBase || t.purchasePrice || 0);
    } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        totals[t.category].cost += (t.amountInBase || 0);
    }
});
Object.entries(totals).forEach(([cat, val]) => {
    console.log(`${cat.padEnd(20)}: Revenue=${val.revenue.toFixed(2)}, Cost=${val.cost.toFixed(2)}, Profit=${(val.revenue - val.cost).toFixed(2)}`);
});
