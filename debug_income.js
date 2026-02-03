const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const txs = (data.transactions || []).filter(t => !t.isVoided && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY'));
console.log(`Total Income Transactions: ${txs.length}`);

const summary = {};
txs.forEach(t => {
    const cat = t.category || 'OTHER';
    if (!summary[cat]) summary[cat] = { count: 0, amount: 0, cost: 0 };
    summary[cat].count++;
    summary[cat].amount += (t.amount || 0) * (t.exchangeRate || 1);
    summary[cat].cost += (t.purchasePrice || 0) * (t.exchangeRate || 1);
});

console.log('--- Income Summary by Category ---');
Object.entries(summary).forEach(([cat, s]) => {
    console.log(`${cat.padEnd(20)}: Count=${s.count}, Rev=${s.amount.toLocaleString()}, Cost=${s.cost.toLocaleString()}, Profit=${(s.amount - s.cost).toLocaleString()}`);
});
