const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let incomeWithPP = 0;
let expensesLinked = 0;

const tripStats = {};

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const id = t.masterTripId || t.programId;
    if (!id) return;
    
    if (!tripStats[id]) tripStats[id] = { pp: 0, exp: 0, name: t.masterTripId ? 'Trip' : 'Program' };
    
    const rate = t.exchangeRate || 1;
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        tripStats[id].pp += (t.purchasePriceInBase || (t.purchasePrice || 0) * rate);
    } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        tripStats[id].exp += (t.amountInBase || (t.amount || 0) * rate);
    }
});

console.log('--- Overlap Check by Trip/Program ---');
Object.keys(tripStats).forEach(id => {
    const s = tripStats[id];
    if (s.pp > 0 && s.exp > 0) {
        console.log(`ID: ${id.padEnd(15)} | ${s.name} | PP: ${s.pp.toFixed(2).padStart(12)} | EXP: ${s.exp.toFixed(2).padStart(12)}`);
    }
});
