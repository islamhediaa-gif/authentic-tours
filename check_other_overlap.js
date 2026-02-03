const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let unlinkedOtherPP = 0;
let unlinkedOtherExp = 0;

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const isLinked = !!(t.masterTripId || t.programId);
    const rate = t.exchangeRate || 1;
    
    if (isLinked) return;

    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        if (t.category !== 'HAJJ_UMRAH' && !t.category.startsWith('FLIGHT')) {
            unlinkedOtherPP += (t.purchasePriceInBase || (t.purchasePrice || 0) * rate);
        }
    } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        if (t.category !== 'HAJJ_UMRAH' && !t.category.startsWith('FLIGHT') && !t.isPurchaseOnly) {
            unlinkedOtherExp += (t.amountInBase || (t.amount || 0) * rate);
        }
    }
});

console.log(`Unlinked OTHER - purchasePrice: ${unlinkedOtherPP.toFixed(2)}`);
console.log(`Unlinked OTHER - EXPENSE transactions: ${unlinkedOtherExp.toFixed(2)}`);
