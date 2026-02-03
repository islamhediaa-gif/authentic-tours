const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

let totalRev = 0;
data.transactions.forEach(t => {
    if (t.isVoided) return;
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        totalRev += Number(t.amountInBase || 0);
    }
});
console.log('Total Sales in Backup File:', totalRev);

const txIds = data.transactions.map(t => t.id);
const uniqueTxIds = new Set(txIds);
console.log('Total Transactions:', txIds.length, 'Unique:', uniqueTxIds.size);
