const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let unlinkedFlightPP = 0;
let unlinkedFlightExp = 0;

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const isLinked = !!(t.masterTripId || t.programId);
    const rate = t.exchangeRate || 1;
    
    if (isLinked) return;

    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        if (t.category === 'FLIGHT') {
            unlinkedFlightPP += (t.purchasePriceInBase || (t.purchasePrice || 0) * rate);
        }
    } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        if (t.category === 'FLIGHT') {
            unlinkedFlightExp += (t.amountInBase || (t.amount || 0) * rate);
        }
    }
});

console.log(`Unlinked Flight - purchasePrice: ${unlinkedFlightPP.toFixed(2)}`);
console.log(`Unlinked Flight - EXPENSE transactions: ${unlinkedFlightExp.toFixed(2)}`);
