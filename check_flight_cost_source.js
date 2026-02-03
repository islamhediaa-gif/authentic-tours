
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];
const transactions = data.transactions || [];

const txMap = {};
transactions.forEach(t => txMap[t.journalEntryId] = t);

let flightCostDetails = [];

journalEntries.forEach(je => {
    (je.lines || []).forEach(l => {
        if (l.accountId === 'FLIGHT_COST') {
            const tx = txMap[je.id];
            flightCostDetails.push({
                jeId: je.id,
                amount: (l.debit - l.credit),
                txId: tx?.id,
                txCat: tx?.category,
                txDesc: tx?.description
            });
        }
    });
});

const byCat = {};
flightCostDetails.forEach(d => {
    const cat = d.txCat || 'MANUAL';
    if (!byCat[cat]) byCat[cat] = 0;
    byCat[cat] += d.amount;
});

console.log("--- Flight Cost Sources by Transaction Category ---");
console.log(byCat);

console.log("\n--- Manual or Non-Flight Source Details ---");
flightCostDetails.filter(d => d.txCat !== 'FLIGHT' && d.txCat !== 'FLIGHT_REFUND' && d.txCat !== 'FLIGHT_REISSUE').slice(0, 10).forEach(d => {
    console.log(`JE: ${d.jeId} | Amount: ${d.amount} | Cat: ${d.txCat} | Desc: ${d.txDesc}`);
});
