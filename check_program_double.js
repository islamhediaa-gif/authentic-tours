const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

const programStats = {};

transactions.forEach(t => {
    if (!t || t.isVoided || !t.programId) return;
    
    if (!programStats[t.programId]) programStats[t.programId] = { bulk: 0, pp: 0 };
    
    const rate = t.exchangeRate || 1;
    if (t.isPurchaseOnly) {
        programStats[t.programId].bulk += (t.amountInBase || (t.amount || 0) * rate);
    }
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        programStats[t.programId].pp += (t.purchasePriceInBase || (t.purchasePrice || 0) * rate);
    }
});

console.log('--- Program Double Counting Check ---');
Object.keys(programStats).forEach(pid => {
    const s = programStats[pid];
    if (s.bulk > 0 && s.pp > 0) {
        console.log(`Program: ${pid} | Bulk: ${s.bulk.toFixed(2)} | PP: ${s.pp.toFixed(2)}`);
    }
});
