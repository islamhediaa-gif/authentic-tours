
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

let incomeFlightCost = 0;
let purchaseOnlyFlightCost = 0;

transactions.forEach(t => {
    if (t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE') {
        if (t.type === 'INCOME') {
            incomeFlightCost += (t.purchasePriceInBase || 0);
        } else if (t.type === 'EXPENSE') {
            purchaseOnlyFlightCost += (t.amountInBase || 0);
        }
    }
});

console.log(`Flight Cost from Income Txs (Individual): ${incomeFlightCost}`);
console.log(`Flight Cost from Expense Txs (Bulk): ${purchaseOnlyFlightCost}`);
console.log(`Total Flight Cost: ${incomeFlightCost + purchaseOnlyFlightCost}`);
