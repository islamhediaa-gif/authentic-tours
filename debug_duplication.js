
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

const flightTx = transactions.filter(t => t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE');

flightTx.slice(0, 5).forEach(t => {
    console.log(`\nChecking Tx ${t.id} (${t.refNo}): ${t.description}`);
    console.log(`  Type: ${t.type}, Selling: ${t.sellingPrice}, Purchase: ${t.purchasePrice}`);
    
    // Check its JE
    const je = journalEntries.find(j => j.id === t.journalEntryId);
    if (je) {
        const costLine = je.lines.find(l => l.accountType === 'EXPENSE');
        console.log(`  JE ${je.id} Cost Line: ${costLine?.accountName} = ${costLine?.debit}`);
    }

    // Check for other JEs or Txs with similar amount and description
    const others = transactions.filter(o => o.id !== t.id && o.purchasePrice === t.purchasePrice && o.description.includes(t.pnr || '!!!'));
    others.forEach(o => {
        console.log(`  Found Other Tx: ${o.id} Type: ${o.type}, Desc: ${o.description}`);
    });
});
