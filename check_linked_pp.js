const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let problematic = 0;

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const isLinked = !!(t.masterTripId || t.programId);
    if (isLinked && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY')) {
        const pPrice = (t.purchasePriceInBase || (t.purchasePrice || 0) * (t.exchangeRate || 1));
        if (pPrice > 0 && t.category !== 'HAJJ_UMRAH') {
            problematic++;
            console.log(`Date: ${t.date} | Cat: ${t.category} | PP: ${pPrice.toFixed(2)} | Trip: ${t.masterTripId} | Desc: ${t.details}`);
        }
    }
});

console.log(`Total problematic INCOME transactions: ${problematic}`);
