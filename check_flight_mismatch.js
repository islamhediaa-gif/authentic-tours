
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

const txMap = {};
transactions.forEach(t => txMap[t.journalEntryId] = t);

journalEntries.forEach(je => {
    const tx = txMap[je.id];
    if (tx && (tx.category === 'FLIGHT')) {
        let jeFlightCost = 0;
        (je.lines || []).forEach(l => {
            if (l.accountId === 'FLIGHT_COST') jeFlightCost += (l.debit - l.credit);
        });

        const txFlightCost = (tx.type === 'INCOME' ? (tx.purchasePriceInBase || 0) : (tx.amountInBase || 0));
        
        if (Math.abs(jeFlightCost - txFlightCost) > 1) {
            console.log(`Mismatch in JE ${je.id} (Tx ${tx.id}): JE Cost=${jeFlightCost}, Tx Cost=${txFlightCost}`);
            console.log(`  Tx Desc: ${tx.description}`);
            console.log(`  Tx Category: ${tx.category}, Type: ${tx.type}`);
        }
    }
});
