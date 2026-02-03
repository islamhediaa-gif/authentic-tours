const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let totalRev = 0;
let directCost = 0;
let adminExpenses = 0;

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    if (t.category === 'CASH') return; // EXCLUDE TREASURY MOVEMENTS

    const rate = t.exchangeRate || 1;
    const amountBase = (t.amountInBase || (t.amount || 0) * rate);

    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        const rev = amountBase || (t.sellingPriceInBase || (t.sellingPrice || 0) * rate);
        totalRev += rev;
        directCost += (t.purchasePriceInBase || (t.purchasePrice || 0) * rate);
    } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        const isLinked = !!(t.masterTripId || t.programId);
        const isDirectCat = t.category === 'HAJJ_UMRAH' || 
                            (t.category && t.category.startsWith('FLIGHT')) || 
                            t.category === 'GENERAL_SERVICE';

        if (isLinked || isDirectCat) {
            directCost += amountBase;
        } else {
            adminExpenses += amountBase;
        }
    }
});

console.log(`Total Revenue: ${totalRev.toFixed(2)}`);
console.log(`Total Direct Cost: ${directCost.toFixed(2)}`);
console.log(`Gross Profit: ${(totalRev - directCost).toFixed(2)}`);
console.log(`Admin Expenses: ${adminExpenses.toFixed(2)}`);
console.log(`Net Operating Profit: ${(totalRev - directCost - adminExpenses).toFixed(2)}`);
