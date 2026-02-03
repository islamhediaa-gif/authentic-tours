const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const isLinked = !!(t.masterTripId || t.programId);
    if (isLinked && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY')) {
        const pPrice = (t.purchasePriceInBase || (t.purchasePrice || 0) * (t.exchangeRate || 1));
        if (pPrice > 0) {
            console.log(`Linked Income: Cat=${t.category} | PP=${pPrice} | Trip=${t.masterTripId} | Desc=${t.details}`);
        }
    }
});
