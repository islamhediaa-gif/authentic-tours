
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const flightTx = transactions.filter(t => t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE');

console.log(`Total Flight Transactions: ${flightTx.length}`);

let totalRev = 0;
let totalCost = 0;

flightTx.forEach(t => {
    if (t.type === 'INCOME') {
        totalRev += (t.amountInBase || 0);
        totalCost += (t.purchasePriceInBase || 0);
    } else if (t.type === 'EXPENSE') {
        totalCost += (t.amountInBase || 0);
    }
});

console.log(`Calculated Flight Revenue: ${totalRev}`);
console.log(`Calculated Flight Cost: ${totalCost}`);
console.log(`Calculated Profit: ${totalRev - totalCost}`);
