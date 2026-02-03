const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let unlinkedOtherExpNoCash = 0;

transactions.forEach(t => {
    if (!t || t.isVoided || t.category === 'CASH') return;
    const isLinked = !!(t.masterTripId || t.programId);
    const rate = t.exchangeRate || 1;
    
    if (isLinked) return;

    if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        const isDirect = t.category === 'HAJJ_UMRAH' || (t.category && t.category.startsWith('FLIGHT')) || t.category === 'GENERAL_SERVICE';
        if (!isDirect && !t.isPurchaseOnly) {
            unlinkedOtherExpNoCash += (t.amountInBase || (t.amount || 0) * rate);
        }
    }
});

console.log(`Unlinked OTHER (No CASH) - EXPENSE transactions: ${unlinkedOtherExpNoCash.toFixed(2)}`);
