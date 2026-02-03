
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const serviceTx = transactions.filter(t => t.category === 'SERVICE' || t.category === 'SERVICE_ONLY');

console.log(`Total Service Transactions: ${serviceTx.length}`);

let totalRev = 0;
let totalCost = 0;

serviceTx.forEach(t => {
    if (t.type === 'INCOME') {
        totalRev += (t.amountInBase || 0);
        totalCost += (t.purchasePriceInBase || 0);
    } else if (t.type === 'EXPENSE') {
        totalCost += (t.amountInBase || 0);
    }
});

console.log(`Calculated Service Revenue: ${totalRev}`);
console.log(`Calculated Service Cost: ${totalCost}`);
console.log(`Calculated Profit: ${totalRev - totalCost}`);
