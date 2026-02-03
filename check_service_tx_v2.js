
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const serviceTx = transactions.filter(t => t.category === 'GENERAL_SERVICE');

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

console.log(`Total General Service Transactions: ${serviceTx.length}`);
console.log(`Calculated Revenue: ${totalRev}`);
console.log(`Calculated Cost: ${totalCost}`);
console.log(`Calculated Profit: ${totalRev - totalCost}`);
